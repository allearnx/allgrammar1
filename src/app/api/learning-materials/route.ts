import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth/helpers';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

// ── POST: PDF 업로드 (boss, teacher, admin) ──
export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user || !['teacher', 'admin', 'boss'].includes(user.role)) {
    return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const title = formData.get('title') as string | null;
    const description = (formData.get('description') as string) || null;

    if (!file) {
      return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 });
    }
    if (!title?.trim()) {
      return NextResponse.json({ error: '제목을 입력해주세요.' }, { status: 400 });
    }
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'PDF 파일만 업로드 가능합니다.' }, { status: 400 });
    }
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: '파일 크기는 20MB 이하만 가능합니다.' }, { status: 400 });
    }

    const fileName = `materials/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.pdf`;
    const admin = createAdminClient();
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await admin.storage
      .from('public-images')
      .upload(fileName, buffer, { contentType: 'application/pdf', upsert: false });

    if (uploadError) {
      logger.error('upload.material_pdf', { error: uploadError.message });
      return NextResponse.json({ error: '업로드 실패: ' + uploadError.message }, { status: 500 });
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
      return NextResponse.json({ error: '저장 실패' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    logger.error('upload.material', { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// ── GET: 자료 목록 (all authenticated) ──
export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  try {
    const supabase = await createClient();

    // RLS handles filtering — just select all accessible rows
    const { data, error } = await supabase
      .from('learning_materials')
      .select('id, title, description, file_url, file_size, uploaded_by, academy_id, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('fetch.learning_materials', { error: error.message });
      return NextResponse.json({ error: '조회 실패' }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (err) {
    logger.error('fetch.learning_materials', { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// ── DELETE: 자료 삭제 (업로더 본인 or boss) ──
export async function DELETE(request: NextRequest) {
  const user = await getUser();
  if (!user || !['teacher', 'admin', 'boss'].includes(user.role)) {
    return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
  }

  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'id가 필요합니다.' }, { status: 400 });
    }

    const admin = createAdminClient();

    // Fetch material to check ownership and get file path
    const { data: material, error: fetchError } = await admin
      .from('learning_materials')
      .select('id, uploaded_by, file_url')
      .eq('id', id)
      .single();

    if (fetchError || !material) {
      return NextResponse.json({ error: '자료를 찾을 수 없습니다.' }, { status: 404 });
    }

    // Only uploader or boss can delete
    if (user.role !== 'boss' && material.uploaded_by !== user.id) {
      return NextResponse.json({ error: '삭제 권한이 없습니다.' }, { status: 403 });
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
      return NextResponse.json({ error: '삭제 실패' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error('delete.learning_material', { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
