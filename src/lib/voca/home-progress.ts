/**
 * 학생 보카 홈의 진도 계산 — 화면(student/voca/client.tsx)에서 떼어낸 순수 함수.
 * 1회독 완료 판정 자체는 lib/dashboard/voca-helpers의 isR1Complete/isR2Complete를 따른다.
 *
 * 규칙 요약 (사장님 확정 이력):
 * - 무료 체험은 앞 freeDayLimit개 Day만 대상 (0 = 제한 없음)
 * - 관리자 '2회독' 토글(round2Forced) = 1회독 면제 → 바로 2회독
 * - round2Locked(무료)면 2회독은 없는 것으로 계산 — 단 앞 round2FreeDays개 Day는 무료로 2회독까지 열림
 */
import { isR1Complete, isR2Complete } from '@/lib/dashboard/voca-helpers';
import type { VocaDay, VocaStudentProgress } from '@/types/voca';

export type RoundMode = 'book' | 'day';
export type ProgressMap = Map<string, VocaStudentProgress>;

/** 1회독 4단계 중 끝낸 수 (카드·종합 80↑·스펠링 80↑·매칭) */
export function getStepsDone(prog: VocaStudentProgress | undefined): number {
  if (!prog) return 0;
  let done = 0;
  if (prog.flashcard_completed) done++;
  if ((prog.quiz_score ?? 0) >= 80) done++;
  if ((prog.spelling_score ?? 0) >= 80) done++;
  if (prog.matching_completed) done++;
  return done;
}

/** 2회독 3단계 중 끝낸 수 (카드·종합 80↑·매칭) */
export function getRound2StepsDone(prog: VocaStudentProgress | undefined): number {
  if (!prog) return 0;
  let done = 0;
  if (prog.round2_flashcard_completed) done++;
  if ((prog.round2_quiz_score ?? 0) >= 80) done++;
  if (prog.round2_matching_completed) done++;
  return done;
}

export function buildProgressMap(progressList: VocaStudentProgress[]): ProgressMap {
  const map: ProgressMap = new Map();
  progressList.forEach((p) => map.set(p.day_id, p));
  return map;
}

/** 진도 계산 대상 Day — 무료 체험이면 앞 freeDayLimit개만 */
export function targetDays(days: VocaDay[], freeDayLimit: number): VocaDay[] {
  return freeDayLimit > 0 ? days.slice(0, freeDayLimit) : days;
}

/** 책 단위: 대상 Day 전부 1회독 완료 → 2회독으로 넘어갈 수 있음 */
export function isBookRound1Complete(days: VocaDay[], progressMap: ProgressMap, freeDayLimit: number): boolean {
  const target = targetDays(days, freeDayLimit);
  return target.length > 0 && target.every((d) => isR1Complete(progressMap.get(d.id) ?? null));
}

/** 책 단위 모드의 현재 회독 — 전부 잠금이면 항상 1, 면제거나 1회독을 다 돌았으면 2 */
export function resolveBookRound(opts: { round2Locked: boolean; round2Forced: boolean; bookRound1Complete: boolean; round2FreeDays?: number }): '1' | '2' {
  const fullyLocked = opts.round2Locked && !(opts.round2FreeDays && opts.round2FreeDays > 0);
  return (!fullyLocked && (opts.round2Forced || opts.bookRound1Complete)) ? '2' : '1';
}

export interface RoundRules {
  roundMode: RoundMode;
  bookCurrentRound: '1' | '2';
  round2Locked: boolean;
  round2Forced: boolean;
  /** 잠금(무료)이어도 2회독이 열리는 앞 Day 수 (0 = 예외 없음) */
  round2FreeDays?: number;
}

/** 교재 안 index번째 Day의 2회독이 잠겼는지 — 무료라도 앞 round2FreeDays개는 열림 */
export function isRound2LockedAt(rules: Pick<RoundRules, 'round2Locked' | 'round2FreeDays'>, index: number): boolean {
  return rules.round2Locked && index >= (rules.round2FreeDays ?? 0);
}

/** index번째 Day에 적용할 규칙 — 2회독이 잠긴 Day는 책 모드에서도 1회독 기준으로 본다 */
export function rulesForDay(rules: RoundRules, index: number): RoundRules {
  if (!isRound2LockedAt(rules, index)) return { ...rules, round2Locked: false };
  return { ...rules, round2Locked: true, bookCurrentRound: '1' };
}

/** 히어로 진행 바의 완료 Day 수 — 모드별로 "완료"의 뜻이 다르다 */
export function countCompletedDays(
  days: VocaDay[], progressMap: ProgressMap, freeDayLimit: number, rules: RoundRules,
): number {
  const target = targetDays(days, freeDayLimit);
  return target.filter((d, i) => {
    const p = progressMap.get(d.id) ?? null;
    const r = rulesForDay(rules, i);
    if (r.roundMode === 'day') {
      // Day 모드: 1회독+2회독 모두 완료 (1회독 면제 시 2회독만, 잠금 Day는 1회독만)
      return (r.round2Forced || isR1Complete(p)) && (r.round2Locked || isR2Complete(p));
    }
    return r.bookCurrentRound === '2' ? isR2Complete(p) : isR1Complete(p);
  }).length;
}

export interface DayRowStatus {
  isCompleted: boolean;
  /** 진행 바 — 끝낸 단계 / 전체 단계 (완료면 0/0) */
  stepsNow: number;
  totalSteps: number;
  /** Day 모드에서 지금 몇 회독 중인지 ('1회독' | '2회독'), 책 모드는 null */
  roundLabel: string | null;
  /** 완료 시 표시 문구 */
  completedLabel: string;
  r1Completed: boolean;
  r2Completed: boolean;
}

/** Day 한 줄의 진행 상태 */
export function dayRowStatus(prog: VocaStudentProgress | undefined, rules: RoundRules): DayRowStatus {
  const p = prog ?? null;
  const steps = getStepsDone(prog);
  const r1Completed = isR1Complete(p);
  const r2Steps = getRound2StepsDone(prog);
  const r2Completed = isR2Complete(p);
  const base = { r1Completed, r2Completed };

  if (rules.roundMode === 'day') {
    // Day별 모드: 1회독+2회독 모두 완료 = 완료 (1회독 면제 시 2회독만)
    const r1Done = rules.round2Forced || r1Completed;
    const bothDone = r1Done && (rules.round2Locked || r2Completed);
    if (!r1Done) return { ...base, isCompleted: false, stepsNow: steps, totalSteps: 4, roundLabel: '1회독', completedLabel: '1+2회독 완료' };
    if (!rules.round2Locked && !r2Completed) return { ...base, isCompleted: false, stepsNow: r2Steps, totalSteps: 3, roundLabel: '2회독', completedLabel: '1+2회독 완료' };
    return { ...base, isCompleted: bothDone, stepsNow: 0, totalSteps: 0, roundLabel: null, completedLabel: '1+2회독 완료' };
  }
  // 책 단위 모드: 현재 라운드 기준
  const r2 = rules.bookCurrentRound === '2';
  return {
    ...base,
    isCompleted: r2 ? r2Completed : r1Completed,
    stepsNow: r2 ? r2Steps : steps,
    totalSteps: r2 ? 3 : 4,
    roundLabel: null,
    completedLabel: `${rules.bookCurrentRound}회독 완료`,
  };
}

/** 이용권 만료 표시 — D-7 이내면 경고 톤. 이미 지났으면 null (조회 시점 정리 대기 중) */
export function expiryInfo(expiresAt: string | null | undefined, now = Date.now()): { label: string; urgent: boolean } | null {
  if (!expiresAt) return null;
  const exp = new Date(expiresAt);
  const daysLeft = Math.ceil((exp.getTime() - now) / 86_400_000);
  if (daysLeft < 0) return null;
  return {
    label: `${exp.getMonth() + 1}월 ${exp.getDate()}일까지${daysLeft <= 30 ? ` (D-${daysLeft})` : ''}`,
    urgent: daysLeft <= 7,
  };
}
