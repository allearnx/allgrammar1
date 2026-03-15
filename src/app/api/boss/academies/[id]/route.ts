import { NextResponse } from 'next/server';
import { createApiHandler, dbResult } from '@/lib/api';
import { auditLog } from '@/lib/api/audit';
import { academyPatchSchema } from '@/lib/api/schemas';
import { generateInviteCode } from '@/lib/utils/invite-code';

export const PATCH = createApiHandler(
  { roles: ['boss'], schema: academyPatchSchema },
  async ({ body, params, supabase }) => {
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.name) updates.name = body.name.trim();
    if (body.max_students !== undefined) updates.max_students = body.max_students;

    dbResult(await supabase
      .from('academies')
      .update(updates)
      .eq('id', params.id));
    return NextResponse.json({ success: true });
  }
);

export const POST = createApiHandler(
  { roles: ['boss'] },
  async ({ params, supabase }) => {
    let inviteCode = '';
    for (let attempt = 0; attempt < 3; attempt++) {
      inviteCode = generateInviteCode();
      const { data: existing } = await supabase
        .from('academies')
        .select('id')
        .eq('invite_code', inviteCode)
        .single();
      if (!existing) break;
    }

    const data = dbResult(await supabase
      .from('academies')
      .update({ invite_code: inviteCode })
      .eq('id', params.id)
      .select('invite_code')
      .single());

    return NextResponse.json(data);
  }
);

export const DELETE = createApiHandler(
  { roles: ['boss'] },
  async ({ user, params, supabase }) => {
    // Check if academy has users
    const { count } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('academy_id', params.id);

    if (count && count > 0) {
      return NextResponse.json(
        { error: `학원에 ${count}명의 회원이 있습니다. 먼저 회원을 다른 학원으로 이동하세요.` },
        { status: 400 }
      );
    }

    dbResult(await supabase
      .from('academies')
      .delete()
      .eq('id', params.id));

    await auditLog(supabase, user.id, 'academy.delete', {
      type: 'academy', id: params.id,
    });

    return NextResponse.json({ success: true });
  }
);
