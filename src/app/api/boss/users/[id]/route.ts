import { NextResponse } from 'next/server';
import { createApiHandler, dbResult, NotFoundError, ValidationError } from '@/lib/api';
import { auditLog } from '@/lib/api/audit';
import { userPatchSchema } from '@/lib/api/schemas';
import { createAdminClient } from '@/lib/supabase/admin';

export const PATCH = createApiHandler(
  { roles: ['boss'], schema: userPatchSchema },
  async ({ user, body, params, supabase }) => {
    const updates: Record<string, unknown> = {};

    if ('role' in body && body.role !== undefined) {
      updates.role = body.role;
    }

    if ('academy_id' in body) {
      if (body.academy_id !== null && body.academy_id !== undefined) {
        const { data: academy } = await supabase
          .from('academies')
          .select('id')
          .eq('id', body.academy_id)
          .single();

        if (!academy) throw new NotFoundError('학원을 찾을 수 없습니다.');
      }
      updates.academy_id = body.academy_id;
    }

    if ('is_active' in body && body.is_active !== undefined) {
      updates.is_active = body.is_active;
    }

    if (Object.keys(updates).length === 0) {
      throw new ValidationError('수정할 항목이 없습니다.');
    }

    dbResult(await supabase
      .from('users')
      .update(updates)
      .eq('id', params.id));

    await auditLog(supabase, user.id, 'user.role_change', {
      type: 'user', id: params.id, details: updates,
    });

    return NextResponse.json({ success: true });
  }
);

export const DELETE = createApiHandler(
  { roles: ['boss'] },
  async ({ user, params, supabase }) => {
    const targetId = params.id;

    // boss 자신은 삭제 불가
    if (targetId === user.id) {
      return NextResponse.json(
        { error: '자기 자신은 삭제할 수 없습니다.' },
        { status: 400 }
      );
    }

    // 대상 사용자 확인
    const { data: target } = await supabase
      .from('users')
      .select('id, role, email')
      .eq('id', targetId)
      .single();

    if (!target) throw new NotFoundError('사용자를 찾을 수 없습니다.');

    // users 테이블에서 삭제
    dbResult(await supabase.from('users').delete().eq('id', targetId));

    // Supabase Auth에서도 삭제
    const adminClient = createAdminClient();
    await adminClient.auth.admin.deleteUser(targetId);

    await auditLog(supabase, user.id, 'user.delete', {
      type: 'user', id: targetId, details: { email: target.email, role: target.role },
    });

    return NextResponse.json({ success: true });
  }
);
