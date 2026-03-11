import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit } from '@/lib/api/rate-limit';

export async function GET(req: NextRequest) {
  // IP 기반 rate limit (분당 20회) — brute force 방지
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const limited = await checkRateLimit(ip, 'auth/validate-invite-code', 20, 60 * 1000);
  if (limited) return limited;

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
