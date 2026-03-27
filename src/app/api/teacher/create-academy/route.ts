import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api/handler';
import { createAcademySchema } from '@/lib/api/schemas';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

export const POST = createApiHandler(
  { roles: ['teacher'], schema: createAcademySchema },
  async ({ user, body }) => {
    if (user.academy_id) {
      return NextResponse.json({ error: '이미 학원에 소속되어 있습니다.' }, { status: 400 });
    }

    const admin = createAdminClient();

    // Generate invite code
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Create academy — auto_create_trial_subscription trigger fires automatically
    const { data: academy, error: academyError } = await admin
      .from('academies')
      .insert({
        name: body.academyName,
        invite_code: inviteCode,
        owner_id: user.id,
        max_students: 5,
        free_service: body.freeService,
        contact_phone: user.phone || null,
      })
      .select('id')
      .single();

    if (academyError || !academy) {
      logger.error('teacher.create_academy.insert_failed', { userId: user.id, error: academyError?.message });
      return NextResponse.json({ error: '학원 생성에 실패했습니다.' }, { status: 500 });
    }

    // Update user: teacher → admin + set academy_id
    const { error: updateError } = await admin
      .from('users')
      .update({ role: 'admin', academy_id: academy.id })
      .eq('id', user.id);

    if (updateError) {
      logger.error('teacher.create_academy.role_update_failed', { userId: user.id, error: updateError.message });
      // Rollback academy
      await admin.from('academies').delete().eq('id', academy.id);
      return NextResponse.json({ error: '역할 전환에 실패했습니다.' }, { status: 500 });
    }

    logger.info('teacher.create_academy.success', {
      userId: user.id,
      academyId: academy.id,
      academyName: body.academyName,
    });

    // Clear middleware profile cache so next request gets fresh role
    const response = NextResponse.json({ success: true, academyId: academy.id });
    response.cookies.delete('x-user-profile');
    return response;
  }
);
