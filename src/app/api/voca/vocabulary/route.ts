import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api/handler';
import { vocaVocabCreateSchema, vocaVocabPatchSchema, idSchema } from '@/lib/api/schemas';
import { requireContentPermission } from '@/lib/api/require-content-permission';
import { isValidFrontText } from '@/lib/voca/vocab-guard';
import { VOCA_VOCABULARY_COLUMNS } from '@/types/voca';

// GET — 단어 목록 (dayId 쿼리 파라미터)
// 관리 화면 전용 — 학생 학습 화면은 서버 컴포넌트에서 조회한다.
// 학생 계정으로 임의 dayId의 단어장(뜻·스펠링 정답 포함)을 덤프하는 것 방지.
export const GET = createApiHandler({ roles: ['teacher', 'admin', 'boss'], hasBody: false }, async ({ request, supabase }) => {
  const { searchParams } = new URL(request.url);
  const dayId = searchParams.get('dayId');
  if (!dayId) return NextResponse.json({ error: 'dayId is required' }, { status: 400 });

  const { data } = await supabase
    .from('voca_vocabulary')
    .select(VOCA_VOCABULARY_COLUMNS)
    .eq('day_id', dayId)
    .order('sort_order');
  return NextResponse.json(data || []);
});

// POST — 단어 생성
export const POST = createApiHandler(
  { roles: ['teacher', 'admin', 'boss'], schema: vocaVocabCreateSchema },
  async ({ body, supabase, user }) => {
    await requireContentPermission(user, supabase);
    // 오염 방지: AI 응답 문장/형식 문자열이 표제어로 저장되는 것 차단
    if (!isValidFrontText(body.front_text)) {
      return NextResponse.json(
        { error: '표제어가 영어 단어/숙어 형식이 아닙니다. 입력을 확인해주세요.' },
        { status: 400 },
      );
    }
    const { data, error } = await supabase
      .from('voca_vocabulary')
      .insert(body)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  }
);

// PATCH — 단어 수정
export const PATCH = createApiHandler(
  { roles: ['teacher', 'admin', 'boss'], schema: vocaVocabPatchSchema },
  async ({ body, supabase, user }) => {
    await requireContentPermission(user, supabase);
    const { id, ...updates } = body as Record<string, unknown>;
    const { data, error } = await supabase
      .from('voca_vocabulary')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  }
);

// DELETE — 단어 삭제
export const DELETE = createApiHandler(
  { roles: ['teacher', 'admin', 'boss'], schema: idSchema, hasBody: true },
  async ({ body, supabase, user }) => {
    await requireContentPermission(user, supabase);
    const { error } = await supabase
      .from('voca_vocabulary')
      .delete()
      .eq('id', body.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  }
);
