import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * 학생 홈 "바로 가기" — 사이드 메뉴를 못 찾는 학생을 위해 홈 맨 위에 큰 진입 버튼 2개.
 * 각 버튼은 "마지막에 하던 곳"으로 곧장 보낸다 (2026-09-21 사장님: 기본 리포트를 앱 전체로 착각).
 */
export interface QuickStartEntry {
  href: string;
  headline: string;   // 예: "5과 · 문제풀이 이어서 하기"
  sub: string | null; // 예: "내신 콕콕 1개 기다리는 중"
}
export interface QuickStart { naesin: QuickStartEntry | null; voca: QuickStartEntry | null }

const STAGE_LABEL: Record<string, string> = {
  vocab: '단어 암기', passage: '교과서 암기', dialogue: '대화문 암기', textbookVideo: '설명 영상',
  grammar: '문법 설명', problem: '문제풀이', mockExam: '예상문제', lastReview: '최종 복습',
};

export async function buildQuickStart(
  supabase: SupabaseClient,
  studentId: string,
  services: { naesin: boolean; voca: boolean },
): Promise<QuickStart> {
  const [naesin, voca] = await Promise.all([
    services.naesin ? buildNaesin(supabase, studentId) : Promise.resolve(null),
    services.voca ? buildVoca(supabase, studentId) : Promise.resolve(null),
  ]);
  return { naesin, voca };
}

async function buildNaesin(supabase: SupabaseClient, studentId: string): Promise<QuickStartEntry> {
  const [{ data: recent }, { data: kokkok }] = await Promise.all([
    supabase
      .from('naesin_student_progress')
      .select('unit_id, current_stage, updated_at, naesin_units(unit_number, title)')
      .eq('student_id', studentId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('naesin_problem_sheets')
      .select('id')
      .eq('assigned_student_id', studentId),
  ]);
  // 내신 콕콕 중 아직 안 푼 것
  let pendingKokkok = 0;
  if (kokkok && kokkok.length > 0) {
    const { data: done } = await supabase
      .from('naesin_problem_attempts')
      .select('sheet_id')
      .eq('student_id', studentId)
      .in('sheet_id', kokkok.map((k) => k.id));
    const doneSet = new Set((done ?? []).map((d) => d.sheet_id));
    pendingKokkok = kokkok.filter((k) => !doneSet.has(k.id)).length;
  }
  const sub = pendingKokkok > 0 ? `내신 콕콕 ${pendingKokkok}개 기다리는 중` : null;

  if (recent?.unit_id) {
    const unit = recent.naesin_units as unknown as { unit_number: number; title: string } | null;
    const stage = (recent.current_stage as string | null) ?? 'vocab';
    const unitLabel = unit ? `${unit.unit_number}과` : '단원';
    return {
      href: `/student/naesin/${recent.unit_id}/${stage}`,
      headline: `${unitLabel} · ${STAGE_LABEL[stage] ?? stage} 이어서 하기`,
      sub,
    };
  }
  return { href: '/student/naesin', headline: '내신 대비 시작하기', sub };
}

async function buildVoca(supabase: SupabaseClient, studentId: string): Promise<QuickStartEntry> {
  const [{ data: recent }, { data: asgs }] = await Promise.all([
    supabase
      .from('voca_student_progress')
      .select('day_id, updated_at, flashcard_completed, quiz_score, spelling_score, matching_completed, voca_days(day_number, title)')
      .eq('student_id', studentId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from('voca_exam_assignments').select('id').eq('student_id', studentId),
  ]);
  let pendingExams = 0;
  if (asgs && asgs.length > 0) {
    const { data: results } = await supabase
      .from('voca_exam_results')
      .select('assignment_id')
      .eq('student_id', studentId)
      .in('assignment_id', asgs.map((a) => a.id));
    const done = new Set((results ?? []).map((r) => r.assignment_id));
    pendingExams = asgs.filter((a) => !done.has(a.id)).length;
  }
  const sub = pendingExams > 0 ? `올킬시험 ${pendingExams}개 기다리는 중` : null;

  if (recent?.day_id) {
    const day = recent.voca_days as unknown as { day_number: number; title: string } | null;
    const doneCount = [recent.flashcard_completed, recent.quiz_score != null, recent.spelling_score != null, recent.matching_completed].filter(Boolean).length;
    const dayLabel = day ? `Day ${day.day_number}` : 'Day';
    return {
      href: `/student/voca/${recent.day_id}`,
      headline: doneCount >= 4 ? `${dayLabel} 완료 · 다음 Day 하기` : `${dayLabel} 이어서 하기 (${doneCount}/4 단계)`,
      sub,
    };
  }
  return { href: '/student/voca', headline: '단어 학습 시작하기', sub };
}
