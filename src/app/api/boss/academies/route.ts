import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api';
import { createAdminClient } from '@/lib/supabase/admin';
import { academyCreateSchema } from '@/lib/api/schemas';
import { generateInviteCode } from '@/lib/utils/invite-code';

export const GET = createApiHandler(
  { roles: ['boss'] },
  async () => {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('academies')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }
);

export const POST = createApiHandler(
  { roles: ['boss'], schema: academyCreateSchema },
  async ({ body }) => {
    const admin = createAdminClient();

    // 초대 코드 생성 (충돌 시 최대 3회 재시도)
    let inviteCode = '';
    for (let attempt = 0; attempt < 3; attempt++) {
      inviteCode = generateInviteCode();
      const { data: existing } = await admin
        .from('academies')
        .select('id')
        .eq('invite_code', inviteCode)
        .single();
      if (!existing) break;
    }

    const { data, error } = await admin
      .from('academies')
      .insert({ name: body.name.trim(), invite_code: inviteCode })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  }
);
