import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/helpers';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

/**
 * Vercel 서버리스 함수의 4.5MB 본문 제한을 우회하기 위해
 * Supabase Storage 서명된 업로드 URL을 반환합니다.
 * 클라이언트가 이 URL로 파일을 직접 Supabase에 업로드합니다.
 */
export async function POST() {
  const user = await getUser();
  if (!user || !['teacher', 'admin', 'boss'].includes(user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const path = `temp-extract/${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const admin = createAdminClient();

    const { data, error } = await admin.storage
      .from('public-images')
      .createSignedUploadUrl(path);

    if (error) {
      logger.error('get-upload-url.failed', { error: error.message });
      return NextResponse.json({ error: '업로드 URL 생성 실패' }, { status: 500 });
    }

    const { data: urlData } = admin.storage
      .from('public-images')
      .getPublicUrl(path);

    return NextResponse.json({
      signedUrl: data.signedUrl,
      publicUrl: urlData.publicUrl,
      path,
    });
  } catch (err) {
    logger.error('get-upload-url.error', { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
