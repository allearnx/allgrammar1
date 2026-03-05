import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')?.trim().toUpperCase();

  if (!code || code.length !== 6 || !/^[A-Z0-9]+$/.test(code)) {
    return NextResponse.json({ error: '유효하지 않은 코드 형식입니다' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('academies')
    .select('name')
    .eq('invite_code', code)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: '유효하지 않은 초대 코드입니다' }, { status: 404 });
  }

  return NextResponse.json({ academyName: data.name });
}
