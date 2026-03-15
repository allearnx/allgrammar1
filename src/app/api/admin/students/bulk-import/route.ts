import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { createApiHandler } from '@/lib/api';
import { createAdminClient } from '@/lib/supabase/admin';
import { studentBulkImportSchema } from '@/lib/api/schemas';
import { checkPlanGate, checkServiceGate } from '@/lib/billing/check-plan-api';

export const POST = createApiHandler(
  { roles: ['admin', 'boss'], schema: studentBulkImportSchema, rateLimit: { max: 10, windowMs: 60_000 } },
  async ({ user, body }) => {
    if (!user.academy_id) {
      return NextResponse.json({ error: '학원에 소속되어 있지 않습니다.' }, { status: 400 });
    }

    const blocked = await checkPlanGate(user.academy_id, 'bulk:import');
    if (blocked) return blocked;

    // Free tier: only allow assigning the selected free service
    if (body.services && body.services.length > 0) {
      const serviceBlocked = await checkServiceGate(user.academy_id, body.services);
      if (serviceBlocked) return serviceBlocked;
    }

    const admin = createAdminClient();
    const academyId = user.academy_id;

    // Check seat limit
    const { data: academy } = await admin
      .from('academies')
      .select('max_students')
      .eq('id', academyId)
      .single();

    if (academy?.max_students) {
      const { count: currentCount } = await admin
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('academy_id', academyId)
        .eq('role', 'student')
        .eq('is_active', true);

      const available = academy.max_students - (currentCount || 0);
      if (body.students.length > available) {
        return NextResponse.json(
          { error: `좌석이 부족합니다. 현재 ${available}명만 추가 가능합니다.` },
          { status: 400 }
        );
      }
    }

    const created: string[] = [];
    const failed: { email: string; reason: string }[] = [];

    for (const student of body.students) {
      try {
        // Create user in Supabase Auth
        const { data: authUser, error: authError } = await admin.auth.admin.createUser({
          email: student.email,
          password: randomBytes(16).toString('base64url') + 'A1!',
          email_confirm: true,
          user_metadata: {
            full_name: student.full_name,
            role: 'student',
            invite_code: undefined,
          },
        });

        if (authError || !authUser.user) {
          failed.push({ email: student.email, reason: authError?.message || '생성 실패' });
          continue;
        }

        // Update user record with academy_id and phone
        const updates: Record<string, unknown> = {
          academy_id: academyId,
          role: 'student',
        };
        if (student.phone) updates.phone = student.phone;

        await admin
          .from('users')
          .update(updates)
          .eq('id', authUser.user.id);

        // Assign services if specified
        if (body.services && body.services.length > 0) {
          for (const service of body.services) {
            await admin
              .from('service_assignments')
              .upsert({
                student_id: authUser.user.id,
                service,
                assigned_by: user.id,
                source: 'manual',
              }, { onConflict: 'student_id,service' });
          }
        }

        created.push(student.email);
      } catch {
        failed.push({ email: student.email, reason: '알 수 없는 오류' });
      }
    }

    return NextResponse.json({ created: created.length, failed });
  }
);
