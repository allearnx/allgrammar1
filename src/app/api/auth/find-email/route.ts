import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit } from '@/lib/api/rate-limit';

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  const visible = local.slice(0, 3);
  return `${visible}***@${domain}`;
}

export async function POST(req: NextRequest) {
  // IP 기반 rate limit (분당 10회) — brute force 방지
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const limited = await checkRateLimit(ip, 'auth/find-email', 10, 60 * 1000);
  if (limited) return limited;

  let body: { name?: string; phone?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
  }

  const name = body.name?.trim();
  const phone = body.phone?.trim();

  if (!name || !phone) {
    return NextResponse.json({ error: '이름과 전화번호를 입력해주세요.' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('users')
    .select('email')
    .eq('full_name', name)
    .eq('phone', phone)
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json(
      { error: '일치하는 계정을 찾을 수 없습니다.' },
      { status: 404 },
    );
  }

  return NextResponse.json({ email: maskEmail(data.email) });
}
