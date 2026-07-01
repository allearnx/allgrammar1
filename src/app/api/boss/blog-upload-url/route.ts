import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/helpers';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

// 블로그 이미지·PDF를 Supabase Storage에 직접 업로드하기 위한 서명 URL 발급.
// (파일을 API 본문으로 보내지 않으므로 Vercel 4.5MB 제한을 우회 — 큰 사진도 업로드 가능)
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user || (user.role !== 'boss' && !user.is_homepage_manager)) {
    return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
  }

  let body: { ext?: string; contentType?: string } = {};
  try { body = await request.json(); } catch { /* optional */ }

  if (body.contentType && !ALLOWED.includes(body.contentType)) {
    return NextResponse.json({ error: '지원하지 않는 파일 형식입니다. (이미지 jpg/png/webp/gif 또는 pdf)' }, { status: 400 });
  }

  const ext = (body.ext || 'jpg').replace(/[^a-z0-9]/gi, '').slice(0, 5) || 'jpg';
  const path = `blog/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.storage.from('public-images').createSignedUploadUrl(path);
    if (error) {
      logger.error('blog-upload-url.failed', { error: error.message });
      return NextResponse.json({ error: '업로드 URL 생성 실패' }, { status: 500 });
    }
    const { data: urlData } = admin.storage.from('public-images').getPublicUrl(path);
    return NextResponse.json({ signedUrl: data.signedUrl, publicUrl: urlData.publicUrl });
  } catch (err) {
    logger.error('blog-upload-url.error', { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
