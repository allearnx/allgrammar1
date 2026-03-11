import { NextResponse } from 'next/server';
import { createApiHandler, dbResult } from '@/lib/api';
import { academyCreateSchema } from '@/lib/api/schemas';
import { generateInviteCode } from '@/lib/utils/invite-code';

export const GET = createApiHandler(
  { roles: ['boss'] },
  async ({ supabase }) => {
    const data = dbResult(await supabase
      .from('academies')
      .select('*')
      .order('created_at', { ascending: false }));

    return NextResponse.json(data);
  }
);

export const POST = createApiHandler(
  { roles: ['boss'], schema: academyCreateSchema },
  async ({ body, supabase }) => {
    // 초대 코드 생성 (충돌 시 최대 3회 재시도)
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
      .insert({ name: body.name.trim(), invite_code: inviteCode })
      .select()
      .single());

    return NextResponse.json(data, { status: 201 });
  }
);
