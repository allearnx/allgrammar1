import { NextResponse } from 'next/server';
import { ApiError, ValidationError, createApiHandler } from '@/lib/api';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

export const POST = createApiHandler(
  { roles: ['teacher', 'admin', 'boss'], hasBody: false },
  async ({ request }) => {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      throw new ValidationError('파일이 없습니다.');
    }

    if (file.type !== 'application/pdf') {
      throw new ValidationError('PDF 파일만 업로드 가능합니다.');
    }

    if (file.size > 20 * 1024 * 1024) {
      throw new ValidationError('파일 크기는 20MB 이하만 가능합니다.');
    }

    const fileName = `passages/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.pdf`;
    const admin = createAdminClient();
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error } = await admin.storage
      .from('public-images')
      .upload(fileName, buffer, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (error) {
      logger.error('upload.passage_pdf', { error: error.message });
      throw new ApiError(500, '업로드 실패: ' + error.message);
    }

    const { data: urlData } = admin.storage
      .from('public-images')
      .getPublicUrl(fileName);

    return NextResponse.json({ url: urlData.publicUrl });
  }
);
