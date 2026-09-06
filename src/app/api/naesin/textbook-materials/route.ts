import { NextResponse } from 'next/server';
import { ApiError, NotFoundError, ValidationError, createApiHandler } from '@/lib/api';
import { requireContentPermission } from '@/lib/api/require-content-permission';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

// 교과서 단어 암기 PDF 등 교과서 자료.
// /api/naesin/* 경로라 createApiHandler가 teacher/admin의 naesin_enabled(올라영)를
// 자동 검사하고, 쓰기는 requireContentPermission(콘텐츠 관리 학원)으로 한 번 더 잠근다.

const MATERIAL_COLUMNS = 'id, textbook_id, title, file_url, file_size, uploaded_by, uploaded_by_name, created_at';

// ── GET: 자료 목록 (?textbookId= 없으면 전체) ──
export const GET = createApiHandler({ hasBody: false }, async ({ request, supabase }) => {
  const { searchParams } = new URL(request.url);
  const textbookId = searchParams.get('textbookId');

  let query = supabase
    .from('naesin_textbook_materials')
    .select(MATERIAL_COLUMNS)
    .order('created_at', { ascending: false });
  if (textbookId) query = query.eq('textbook_id', textbookId);

  const { data, error } = await query;
  if (error) {
    logger.error('fetch.naesin_textbook_materials', { error: error.message });
    throw new ApiError(500, '조회 실패');
  }
  return NextResponse.json(data ?? []);
});

// ── POST: PDF 업로드 (boss + 콘텐츠 관리 학원) ──
export const POST = createApiHandler(
  { roles: ['teacher', 'admin', 'boss'], hasBody: false },
  async ({ user, request, supabase }) => {
    await requireContentPermission(user, supabase);

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const textbookId = formData.get('textbookId') as string | null;
    const title = (formData.get('title') as string | null)?.trim();

    if (!file) throw new ValidationError('파일이 없습니다.');
    if (!textbookId) throw new ValidationError('교과서가 지정되지 않았습니다.');
    if (!title) throw new ValidationError('자료 이름을 입력해주세요. (예: 1과 단어 암기장)');
    if (file.type !== 'application/pdf') throw new ValidationError('PDF 파일만 업로드 가능합니다.');
    if (file.size > 20 * 1024 * 1024) throw new ValidationError('파일 크기는 20MB 이하만 가능합니다.');

    const admin = createAdminClient();

    const { data: textbook } = await admin
      .from('naesin_textbooks')
      .select('id')
      .eq('id', textbookId)
      .single();
    if (!textbook) throw new NotFoundError('교과서를 찾을 수 없습니다.');

    const fileName = `naesin-materials/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.pdf`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await admin.storage
      .from('public-images')
      .upload(fileName, buffer, { contentType: 'application/pdf', upsert: false });
    if (uploadError) {
      logger.error('upload.naesin_textbook_material', { error: uploadError.message });
      throw new ApiError(500, '업로드 실패: ' + uploadError.message);
    }

    const { data: urlData } = admin.storage.from('public-images').getPublicUrl(fileName);

    const { data, error: insertError } = await admin
      .from('naesin_textbook_materials')
      .insert({
        textbook_id: textbookId,
        title,
        file_url: urlData.publicUrl,
        file_size: file.size,
        uploaded_by: user.id,
        uploaded_by_name: user.full_name || user.email,
      })
      .select(MATERIAL_COLUMNS)
      .single();
    if (insertError) {
      logger.error('insert.naesin_textbook_material', { error: insertError.message });
      throw new ApiError(500, '저장 실패');
    }

    return NextResponse.json(data);
  },
);

// ── DELETE: 자료 삭제 (boss + 콘텐츠 관리 학원 — 동료 자료 교체도 가능해야 함) ──
export const DELETE = createApiHandler(
  { roles: ['teacher', 'admin', 'boss'], hasBody: true },
  async ({ user, body, supabase }) => {
    await requireContentPermission(user, supabase);

    const { id } = (body ?? {}) as { id?: string };
    if (!id) throw new ValidationError('id가 필요합니다.');

    const admin = createAdminClient();
    const { data: material } = await admin
      .from('naesin_textbook_materials')
      .select('id, file_url')
      .eq('id', id)
      .single();
    if (!material) throw new NotFoundError('자료를 찾을 수 없습니다.');

    const storagePath = new URL(material.file_url).pathname.split('/public-images/')[1];
    if (storagePath) {
      await admin.storage.from('public-images').remove([storagePath]);
    }

    const { error: deleteError } = await admin
      .from('naesin_textbook_materials')
      .delete()
      .eq('id', id);
    if (deleteError) {
      logger.error('delete.naesin_textbook_material', { error: deleteError.message });
      throw new ApiError(500, '삭제 실패');
    }

    return NextResponse.json({ success: true });
  },
);
