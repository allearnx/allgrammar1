import { NextResponse } from 'next/server';
import { ApiError, ValidationError, createApiHandler } from '@/lib/api';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

// 블로그 이미지·PDF를 Supabase Storage에 직접 업로드하기 위한 서명 URL 발급.
// (파일을 API 본문으로 보내지 않으므로 Vercel 4.5MB 제한을 우회 — 큰 사진도 업로드 가능)
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];

export const POST = createApiHandler(
  { roles: ['boss'], allowHomepageManager: true, hasBody: false },
  async ({ request }) => {
    // body는 선택적 — 없거나 JSON이 아니어도 기본값으로 진행
    let body: { ext?: string; contentType?: string } = {};
    try { body = await request.json(); } catch { /* optional */ }

    if (body.contentType && !ALLOWED.includes(body.contentType)) {
      throw new ValidationError('지원하지 않는 파일 형식입니다. (이미지 jpg/png/webp/gif 또는 pdf)');
    }

    const ext = (body.ext || 'jpg').replace(/[^a-z0-9]/gi, '').slice(0, 5) || 'jpg';
    const path = `blog/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const admin = createAdminClient();
    const { data, error } = await admin.storage.from('public-images').createSignedUploadUrl(path);
    if (error) {
      logger.error('blog-upload-url.failed', { error: error.message });
      throw new ApiError(500, '업로드 URL 생성 실패');
    }
    const { data: urlData } = admin.storage.from('public-images').getPublicUrl(path);
    return NextResponse.json({ signedUrl: data.signedUrl, publicUrl: urlData.publicUrl });
  }
);
