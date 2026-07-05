import { NextResponse } from 'next/server';
import { ApiError, ValidationError, createApiHandler } from '@/lib/api';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

export const POST = createApiHandler(
  { roles: ['boss'], allowHomepageManager: true, hasBody: false },
  async ({ request }) => {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      throw new ValidationError('파일이 없습니다.');
    }

    // Validate file type
    const imageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const isPdf = file.type === 'application/pdf';
    if (!imageTypes.includes(file.type) && !isPdf) {
      throw new ValidationError('지원하지 않는 파일 형식입니다. (이미지 jpg/png/webp/gif 또는 pdf)');
    }

    // 이미지 5MB / PDF 20MB
    const maxBytes = isPdf ? 20 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      throw new ValidationError(`파일 크기는 ${isPdf ? '20' : '5'}MB 이하만 가능합니다.`);
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
      throw new ApiError(500, '업로드 실패: ' + error.message);
    }

    const { data: urlData } = admin.storage
      .from('public-images')
      .getPublicUrl(fileName);

    return NextResponse.json({ url: urlData.publicUrl });
  }
);
