import { NextResponse } from 'next/server';
import { ApiError, ForbiddenError, NotFoundError, ValidationError, createApiHandler } from '@/lib/api';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

// ── POST: PDF 업로드 (boss, teacher, admin) ──
export const POST = createApiHandler(
  { roles: ['teacher', 'admin', 'boss'], hasBody: false },
  async ({ user, request }) => {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const title = formData.get('title') as string | null;
    const description = (formData.get('description') as string) || null;

    if (!file) {
      throw new ValidationError('파일이 없습니다.');
    }
    if (!title?.trim()) {
      throw new ValidationError('제목을 입력해주세요.');
    }
    if (file.type !== 'application/pdf') {
      throw new ValidationError('PDF 파일만 업로드 가능합니다.');
    }
    if (file.size > 20 * 1024 * 1024) {
      throw new ValidationError('파일 크기는 20MB 이하만 가능합니다.');
    }

    const fileName = `materials/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.pdf`;
    const admin = createAdminClient();
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await admin.storage
      .from('public-images')
      .upload(fileName, buffer, { contentType: 'application/pdf', upsert: false });

    if (uploadError) {
      logger.error('upload.material_pdf', { error: uploadError.message });
      throw new ApiError(500, '업로드 실패: ' + uploadError.message);
    }

    const { data: urlData } = admin.storage.from('public-images').getPublicUrl(fileName);

    const { data, error: insertError } = await admin
      .from('learning_materials')
      .insert({
        title: title.trim(),
        description: description?.trim() || null,
        file_url: urlData.publicUrl,
        file_size: file.size,
        uploaded_by: user.id,
        academy_id: user.role === 'boss' ? null : user.academy_id,
      })
      .select()
      .single();

    if (insertError) {
      logger.error('insert.learning_material', { error: insertError.message });
      throw new ApiError(500, '저장 실패');
    }

    return NextResponse.json(data);
  }
);

// ── GET: 자료 목록 (all authenticated) ──
export const GET = createApiHandler(
  { hasBody: false },
  async ({ supabase }) => {
    // RLS handles filtering — just select all accessible rows
    const { data, error } = await supabase
      .from('learning_materials')
      .select('id, title, description, file_url, file_size, uploaded_by, academy_id, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('fetch.learning_materials', { error: error.message });
      throw new ApiError(500, '조회 실패');
    }

    return NextResponse.json(data ?? []);
  }
);

// ── DELETE: 자료 삭제 (업로더 본인 or boss) ──
export const DELETE = createApiHandler(
  { roles: ['teacher', 'admin', 'boss'], hasBody: true },
  async ({ user, body }) => {
    const { id } = (body ?? {}) as { id?: string };
    if (!id) {
      throw new ValidationError('id가 필요합니다.');
    }

    const admin = createAdminClient();

    // Fetch material to check ownership and get file path
    const { data: material, error: fetchError } = await admin
      .from('learning_materials')
      .select('id, uploaded_by, file_url')
      .eq('id', id)
      .single();

    if (fetchError || !material) {
      throw new NotFoundError('자료를 찾을 수 없습니다.');
    }

    // Only uploader or boss can delete
    if (user.role !== 'boss' && material.uploaded_by !== user.id) {
      throw new ForbiddenError('삭제 권한이 없습니다.');
    }

    // Delete from storage
    const urlPath = new URL(material.file_url).pathname;
    const storagePath = urlPath.split('/public-images/')[1];
    if (storagePath) {
      await admin.storage.from('public-images').remove([storagePath]);
    }

    // Delete from DB
    const { error: deleteError } = await admin
      .from('learning_materials')
      .delete()
      .eq('id', id);

    if (deleteError) {
      logger.error('delete.learning_material', { error: deleteError.message });
      throw new ApiError(500, '삭제 실패');
    }

    return NextResponse.json({ success: true });
  }
);
