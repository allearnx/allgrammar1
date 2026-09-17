import { NextResponse } from 'next/server';
import { createApiHandler, dbResult } from '@/lib/api';
import { clinicAssignSchema } from '@/lib/api/schemas';
import { requireContentPermission } from '@/lib/api/require-content-permission';
import { sanitizeQuestions, validateBeforeSave } from '@/lib/validation/problem-validator';

const ADMIN_ROLES = ['teacher', 'admin', 'boss'] as const;

/**
 * 학생 개별 "클리닉(집중훈련)" 배정 — 단원 전체가 아니라 특정 학생에게만 템플릿 사본을 배정한다.
 * 반복 오답 등으로 특정 하위 개념을 보강해야 할 때, 단원 문법 시트가 아니라 독립 템플릿
 * (예: 관계부사=전치사+관계대명사 집중훈련)을 골라 학생을 선택하면 각 학생 전용 시트가 생긴다.
 * 학생은 /student/naesin 홈의 "선생님이 보낸 보충 문제" 섹션 → /student/naesin/exam/[sheetId]
 * 에서 풀며, unit_id 없이도 그 라우트가 그대로 동작한다(ProblemTab이 unitId=null을 받아들임).
 */
export const POST = createApiHandler(
  { roles: [...ADMIN_ROLES], schema: clinicAssignSchema },
  async ({ body, supabase, user }) => {
    await requireContentPermission(user, supabase);
    const { templateId, studentIds, note } = body;

    const template = dbResult(await supabase
      .from('naesin_templates')
      .select('*')
      .eq('id', templateId)
      .single());

    const hasQ = Array.isArray(template.questions) && template.questions.length > 0;
    const { questions: sq, answerKey: sak } = hasQ
      ? sanitizeQuestions(template.questions, template.answer_key, { title: template.title })
      : { questions: template.questions || [], answerKey: template.answer_key || [] };

    if (hasQ) {
      const validation = validateBeforeSave(sq);
      if (!validation.valid) {
        return NextResponse.json(
          { error: '템플릿에 오류가 있어 배정할 수 없습니다.', issues: validation.errors },
          { status: 422 },
        );
      }
    }

    // 같은 템플릿을 같은 학생에게 이미 배정했고 아직 풀지 않은 경우(시도 기록 없음)는 중복 생성하지 않고 건너뛴다.
    const { data: existing } = await supabase
      .from('naesin_problem_sheets')
      .select('id, assigned_student_id')
      .eq('source_template_id', templateId)
      .in('assigned_student_id', studentIds);

    const existingIds = (existing ?? []).map((s) => s.id);
    const { data: existingAttempts } = existingIds.length
      ? await supabase.from('naesin_problem_attempts').select('sheet_id').in('sheet_id', existingIds)
      : { data: [] as { sheet_id: string }[] };
    const attemptedSheetIds = new Set((existingAttempts ?? []).map((a) => a.sheet_id));
    const alreadyPendingStudentIds = new Set(
      (existing ?? [])
        .filter((s) => s.assigned_student_id && !attemptedSheetIds.has(s.id))
        .map((s) => s.assigned_student_id as string),
    );

    const targetStudentIds = studentIds.filter((id: string) => !alreadyPendingStudentIds.has(id));
    const skipped = studentIds.filter((id: string) => alreadyPendingStudentIds.has(id));

    if (targetStudentIds.length === 0) {
      return NextResponse.json({ assigned: 0, skipped, sheets: [] });
    }

    const now = new Date().toISOString();
    const rows = targetStudentIds.map((studentId: string) => ({
      unit_id: null,
      assigned_student_id: studentId,
      assigned_by: user.id,
      assigned_at: now,
      assigned_note: note?.trim() || null,
      title: template.title,
      mode: template.mode,
      questions: sq,
      answer_key: sak,
      category: template.category || 'problem',
      video_url: template.video_url ?? null,
      source_template_id: templateId,
    }));

    const inserted = dbResult(await supabase
      .from('naesin_problem_sheets')
      .insert(rows)
      .select('id, assigned_student_id')) ?? [];

    return NextResponse.json({ assigned: inserted.length, skipped, sheets: inserted });
  }
);
