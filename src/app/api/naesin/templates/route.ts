import { NextResponse } from 'next/server';
import { createApiHandler, dbResult } from '@/lib/api';
import { requireContentPermission } from '@/lib/api/require-content-permission';
import { templateCreateSchema, templatePatchSchema } from '@/lib/api/schemas';
import { regradeSheet } from '@/lib/naesin/regrade-sheet';
import { createAdminClient } from '@/lib/supabase/admin';
import { sanitizeQuestions } from '@/lib/validation/problem-validator';
import { scanRow } from '@/lib/validation';
import { findDuplicateSentences } from '@/lib/naesin/duplicate-sentences';
import type { NaesinProblemQuestion } from '@/types/naesin';

const ADMIN_ROLES = ['teacher', 'admin', 'boss'] as const;

export const GET = createApiHandler(
  { roles: [...ADMIN_ROLES] },
  async ({ supabase }) => {
    const data = dbResult(await supabase
      .from('naesin_templates')
      .select('id, title, questions, template_topic, category, created_at')
      .eq('kind', 'template') // 내신 콕콕(kokkok)은 콘텐츠 관리에서만 보인다
      .order('template_topic')
      .order('created_at', { ascending: false }));

    // topic별 그룹핑
    const grouped: Record<string, typeof data> = {};
    for (const row of data ?? []) {
      const topic = row.template_topic || '기타';
      if (!grouped[topic]) grouped[topic] = [];
      grouped[topic].push(row);
    }

    return NextResponse.json({ templates: data, grouped });
  }
);

export const POST = createApiHandler(
  { roles: [...ADMIN_ROLES], schema: templateCreateSchema },
  async ({ body, supabase, user }) => {
    await requireContentPermission(user, supabase);
    const { title, templateTopic, questions: rawQuestions, answerKey: rawAnswerKey, category, mode, kind, grammarId, videoUrl } = body;
    const admin = createAdminClient();

    // Sanitize + validate
    const hasQ = Array.isArray(rawQuestions) && rawQuestions.length > 0;
    const { questions, answerKey } = hasQ
      ? sanitizeQuestions(rawQuestions as NaesinProblemQuestion[], rawAnswerKey as (string | number | null)[] | undefined, { title })
      : { questions: rawQuestions || [], answerKey: rawAnswerKey || [] };

    // 템플릿은 교사 작업 공간이므로 검증 오류를 경고로만 반환 (저장은 허용)
    // 학생용 시트로 배포(import) 시에만 엄격히 차단
    let validationWarnings: unknown[] = [];
    if (hasQ) {
      // 저장 시점 검사 — correctness만 (품질 노이즈 NO_EXPLANATION 등 제외)
      validationWarnings = scanRow('template', {
        id: '', title, questions: questions as NaesinProblemQuestion[],
        answer_key: answerKey as (string | number | null)[],
      }).filter((i) => i.category === 'correctness');
    }

    // 내신 콕콕은 내신 단원 문항과 같은 문장이 있으면 저장 차단 (층 간 동일 문항 금지)
    if (kind === 'kokkok' && hasQ) {
      const dups = await findDuplicateSentences(admin, questions as NaesinProblemQuestion[]);
      if (dups.length > 0) {
        return NextResponse.json(
          { error: `내신 문항과 똑같은 문장이 ${dups.length}건 있어 저장할 수 없습니다. 내신 콕콕은 내신 문제와 다른 문항이어야 합니다.`, duplicates: dups.slice(0, 20) },
          { status: 422 },
        );
      }
    }

    const inserted = dbResult(await admin
      .from('naesin_templates')
      .insert({
        title,
        template_topic: templateTopic,
        questions,
        answer_key: answerKey,
        category,
        mode,
        kind,
        grammar_id: grammarId ?? null,
        video_url: videoUrl || null,
        created_by: user.id,
      })
      .select()
      .single());

    return NextResponse.json(
      { ...inserted, ...(validationWarnings.length > 0 ? { validationWarnings } : {}) },
      { status: 201 },
    );
  }
);

export const PATCH = createApiHandler(
  { roles: [...ADMIN_ROLES], schema: templatePatchSchema },
  async ({ body, supabase, user }) => {
    await requireContentPermission(user, supabase);
    const { id, title, templateTopic, questions, answerKey, syncCopies, videoUrl } = body;

    const updates: Record<string, unknown> = {};
    let patchWarnings: unknown[] = [];
    if (title != null) updates.title = title;
    if (templateTopic != null) updates.template_topic = templateTopic;
    if (videoUrl != null) updates.video_url = videoUrl.trim() || null;

    // Sanitize + validate questions on update
    if (questions != null && Array.isArray(questions) && questions.length > 0) {
      const { questions: sq, answerKey: sak } = sanitizeQuestions(
        questions as NaesinProblemQuestion[],
        answerKey as (string | number | null)[] | undefined,
        { title: typeof updates.title === 'string' ? updates.title : undefined },
      );
      updates.questions = sq;
      updates.answer_key = sak;

      // 템플릿 수정도 저장 허용 — correctness 경고만 반환
      patchWarnings = scanRow('template', {
        id: id as string, title: (title as string) ?? '', questions: sq,
        answer_key: sak as (string | number | null)[],
      }).filter((i) => i.category === 'correctness');
    } else {
      if (questions != null) updates.questions = questions;
      if (answerKey != null) updates.answer_key = answerKey;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'nothing to update' }, { status: 400 });
    }
    const admin = createAdminClient();

    if (Array.isArray(updates.questions) && (updates.questions as unknown[]).length > 0) {
      const { data: cur } = await admin.from('naesin_templates').select('kind').eq('id', id).single();
      if (cur?.kind === 'kokkok') {
        const dups = await findDuplicateSentences(admin, updates.questions as NaesinProblemQuestion[], id as string);
        if (dups.length > 0) {
          return NextResponse.json(
            { error: `내신 문항과 똑같은 문장이 ${dups.length}건 있어 저장할 수 없습니다. 내신 콕콕은 내신 문제와 다른 문항이어야 합니다.`, duplicates: dups.slice(0, 20) },
            { status: 422 },
          );
        }
      }
    }

    const updated = dbResult(await admin
      .from('naesin_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single());

    // 영상 링크는 이미 배정된 학생 사본에도 바로 반영 (콕콕 세트 → assigned 시트)
    if ('video_url' in updates) {
      await admin.from('naesin_problem_sheets').update({ video_url: updates.video_url }).eq('source_template_id', id).not('assigned_student_id', 'is', null);
    }

    // 복사본 일괄 업데이트 (sanitized 값 사용)
    let syncedCount = 0;
    if (syncCopies && ('questions' in updates || 'answer_key' in updates)) {
      const sheetUpdates: Record<string, unknown> = {};
      if (updates.questions != null) sheetUpdates.questions = updates.questions;
      if (updates.answer_key != null) sheetUpdates.answer_key = updates.answer_key;

      const { data: synced } = await supabase
        .from('naesin_problem_sheets')
        .update(sheetUpdates)
        .eq('source_template_id', id)
        .select('id');

      syncedCount = synced?.length ?? 0;

      // synced 시트 자동 재채점
      if (synced && synced.length > 0) {
        await Promise.all(synced.map((s) => regradeSheet(s.id)));
      }
    }

    return NextResponse.json({
      ...updated,
      syncedCount,
      ...(patchWarnings.length > 0 ? { validationWarnings: patchWarnings } : {}),
    });
  }
);

export const DELETE = createApiHandler(
  { roles: [...ADMIN_ROLES] },
  async ({ supabase, request, user }) => {
    await requireContentPermission(user, supabase);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }
    const admin = createAdminClient();

    // 원본 템플릿 삭제 시, 이 템플릿에서 가져온(import) 복사본 시트도 함께 삭제.
    // 복사본의 학생 시도/드래프트/오답은 sheet_id FK ON DELETE CASCADE 로 자동 정리됨.
    const copyResult = await admin
      .from('naesin_problem_sheets')
      .delete({ count: 'exact' })
      .eq('source_template_id', id);
    dbResult(copyResult);
    const copiesDeleted = copyResult.count ?? 0;

    dbResult(await admin
      .from('naesin_templates')
      .delete()
      .eq('id', id));

    return NextResponse.json({ ok: true, copiesDeleted });
  }
);
