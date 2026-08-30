import type { SupabaseClient } from '@supabase/supabase-js';
import type { ExamReadiness } from '@/types/student-report';

/**
 * 시험별 준비도 — 학생의 시험 배정(차수·날짜·범위 단원)을 기준으로
 * 범위 내 진도·문제풀이 성적·미해결 오답을 스코프 집계한다.
 * 리포트(학생/학부모/선생님) 공용. 배정이 없으면 빈 배열.
 */
export async function computeExamReadiness(
  qc: SupabaseClient,
  studentId: string,
): Promise<ExamReadiness[]> {
  const { data: assignments } = await qc
    .from('naesin_exam_assignments')
    .select('id, textbook_id, exam_round, exam_label, exam_date, unit_ids')
    .eq('student_id', studentId)
    .order('exam_round');

  if (!assignments || assignments.length === 0) return [];

  const allUnitIds = [...new Set(assignments.flatMap((a) => (a.unit_ids as string[] | null) ?? []))];
  if (allUnitIds.length === 0) return [];
  const textbookIds = [...new Set(assignments.map((a) => a.textbook_id))];

  const [textbooksRes, unitsRes, progressRes, sheetsRes, wrongsRes, attemptsRes] = await Promise.all([
    qc.from('naesin_textbooks').select('id, display_name').in('id', textbookIds),
    qc.from('naesin_units').select('id, unit_number, title').in('id', allUnitIds),
    qc
      .from('naesin_student_progress')
      .select('unit_id, vocab_completed, passage_completed, dialogue_completed, grammar_completed, problem_completed, mock_exam_completed')
      .eq('student_id', studentId)
      .in('unit_id', allUnitIds),
    qc.from('naesin_problem_sheets').select('id, unit_id').in('unit_id', allUnitIds),
    qc
      .from('naesin_wrong_answers')
      .select('unit_id, resolved')
      .eq('student_id', studentId)
      .in('unit_id', allUnitIds)
      .limit(2000),
    // 시도 테이블엔 unit_id가 없음 — sheet_id로 받아 아래에서 유도 (.in() URL 한계 회피)
    qc
      .from('naesin_problem_attempts')
      .select('sheet_id, score, total_questions')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(1000),
  ]);

  const textbookName = new Map((textbooksRes.data ?? []).map((t) => [t.id, t.display_name as string]));
  const unitInfo = new Map((unitsRes.data ?? []).map((u) => [u.id, u]));
  const progressByUnit = new Map((progressRes.data ?? []).map((p) => [p.unit_id, p]));
  const sheetToUnit = new Map((sheetsRes.data ?? []).map((s) => [s.id, s.unit_id as string]));

  // 단원별 문제풀이 점수(%) 목록
  const scoresByUnit = new Map<string, number[]>();
  for (const at of attemptsRes.data ?? []) {
    const unitId = sheetToUnit.get(at.sheet_id);
    if (!unitId || !at.total_questions) continue;
    const pct = Math.round((at.score / at.total_questions) * 100);
    if (!scoresByUnit.has(unitId)) scoresByUnit.set(unitId, []);
    scoresByUnit.get(unitId)!.push(pct);
  }

  // 단원별 오답 집계
  const wrongByUnit = new Map<string, { total: number; unresolved: number }>();
  for (const w of wrongsRes.data ?? []) {
    if (!w.unit_id) continue;
    const e = wrongByUnit.get(w.unit_id) ?? { total: 0, unresolved: 0 };
    e.total++;
    if (!w.resolved) e.unresolved++;
    wrongByUnit.set(w.unit_id, e);
  }

  return assignments.map((a) => {
    const unitIds = ((a.unit_ids as string[] | null) ?? []).filter((uid) => unitInfo.has(uid));
    const units = unitIds
      .map((uid) => unitInfo.get(uid)!)
      .sort((x, y) => x.unit_number - y.unit_number)
      .map((u) => ({ id: u.id as string, unitNumber: u.unit_number as number, title: u.title as string }));

    let unitsCompleted = 0;
    let unitsStarted = 0;
    const scores: number[] = [];
    let wrongTotal = 0;
    let wrongUnresolved = 0;

    for (const uid of unitIds) {
      const p = progressByUnit.get(uid);
      if (p) {
        unitsStarted++;
        // 오답 아카이브와 같은 기준: 문제풀이 + 모의고사 완료 = 단원 완료
        if (p.problem_completed && p.mock_exam_completed) unitsCompleted++;
      }
      scores.push(...(scoresByUnit.get(uid) ?? []));
      const w = wrongByUnit.get(uid);
      if (w) { wrongTotal += w.total; wrongUnresolved += w.unresolved; }
    }

    return {
      textbookName: textbookName.get(a.textbook_id) ?? '',
      examRound: a.exam_round as number,
      examLabel: (a.exam_label as string | null) ?? null,
      examDate: (a.exam_date as string | null) ?? null,
      units,
      unitsStarted,
      unitsCompleted,
      problemAttempts: scores.length,
      problemAvgScore: scores.length > 0 ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : null,
      wrongTotal,
      wrongUnresolved,
    };
  });
}
