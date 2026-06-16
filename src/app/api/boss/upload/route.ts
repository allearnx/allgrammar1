import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/helpers';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user || (user.role !== 'boss' && !user.is_homepage_manager)) {
      return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 });
    }

    // Validate file type
    const imageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const isPdf = file.type === 'application/pdf';
    if (!imageTypes.includes(file.type) && !isPdf) {
      return NextResponse.json({ error: '지원하지 않는 파일 형식입니다. (이미지 jpg/png/webp/gif 또는 pdf)' }, { status: 400 });
    }

    // 이미지 5MB / PDF 20MB
    const maxBytes = isPdf ? 20 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      return NextResponse.json({ error: `파일 크기는 ${isPdf ? '20' : '5'}MB 이하만 가능합니다.` }, { status: 400 });
    }

    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const filePath = `public-images/${fileName}`;

    const admin = createAdminClient();
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error } = await admin.storage
      .from('public-images')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      logger.error('upload.failed', { error: error.message, filePath });
      return NextResponse.json({ error: '업로드 실패: ' + error.message }, { status: 500 });
    }

    const { data: urlData } = admin.storage
      .from('public-images')
      .getPublicUrl(fileName);

    return NextResponse.json({ url: urlData.publicUrl });
  } catch (err) {
    logger.error('upload.error', { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
