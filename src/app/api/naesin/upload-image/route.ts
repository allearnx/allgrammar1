import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireContentPermission } from '@/lib/api/require-content-permission';
import { ApiError, ValidationError, createApiHandler } from '@/lib/api';
import { logger } from '@/lib/logger';

export const POST = createApiHandler(
  { hasBody: false },
  async ({ user, supabase, request }) => {
    await requireContentPermission(user, supabase);

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      throw new ValidationError('파일이 없습니다.');
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      throw new ValidationError('지원하지 않는 파일 형식입니다. (jpg, png, webp, gif만 가능)');
    }

    if (file.size > 20 * 1024 * 1024) {
      throw new ValidationError('파일 크기는 20MB 이하만 가능합니다.');
    }

    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `problems/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const admin = createAdminClient();
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error } = await admin.storage
      .from('public-images')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      logger.error('upload-image.failed', { error: error.message, fileName });
      throw new ApiError(500, '업로드 실패: ' + error.message);
    }

    const { data: urlData } = admin.storage
      .from('public-images')
      .getPublicUrl(fileName);

    return NextResponse.json({ url: urlData.publicUrl });
  }
);
