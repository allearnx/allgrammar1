import { describe, it, expect } from 'vitest';
import {
  getStepsDone, getRound2StepsDone, buildProgressMap, isBookRound1Complete, resolveBookRound,
  countCompletedDays, dayRowStatus, expiryInfo,
} from '@/lib/voca/home-progress';
import type { VocaDay, VocaStudentProgress } from '@/types/voca';

const prog = (dayId: string, o: Partial<VocaStudentProgress> = {}): VocaStudentProgress => ({
  id: 'p-' + dayId, student_id: 's1', day_id: dayId,
  flashcard_completed: false, quiz_score: null, spelling_score: null, exam_score: null,
  matching_score: null, matching_attempt: 0, matching_completed: false,
  round2_flashcard_completed: false, round2_quiz_score: null, round2_matching_score: null,
  round2_matching_attempt: 0, round2_matching_completed: false,
  created_at: '', updated_at: '', ...o,
});
const R1 = { flashcard_completed: true, quiz_score: 90, spelling_score: 85, matching_completed: true };
const R2 = { round2_flashcard_completed: true, round2_quiz_score: 80, round2_matching_completed: true };
const days = ['d1', 'd2', 'd3', 'd4', 'd5'].map((id, i) => ({ id, book_id: 'b', day_number: i + 1, title: `Day ${i + 1}` } as unknown as VocaDay));
const book = { roundMode: 'book' as const, round2Locked: false, round2Forced: false };

describe('단계 수', () => {
  it('1회독 4단계 — 종합/스펠링은 80점부터 인정', () => {
    expect(getStepsDone(undefined)).toBe(0);
    expect(getStepsDone(prog('d', { flashcard_completed: true, quiz_score: 79, spelling_score: 80 }))).toBe(2);
    expect(getStepsDone(prog('d', R1))).toBe(4);
  });
  it('2회독 3단계', () => {
    expect(getRound2StepsDone(prog('d', { round2_quiz_score: 80 }))).toBe(1);
    expect(getRound2StepsDone(prog('d', R2))).toBe(3);
  });
});

describe('isBookRound1Complete', () => {
  it('무료 체험(3 Day)은 앞 3개만 다 돌면 완료', () => {
    const map = buildProgressMap([prog('d1', R1), prog('d2', R1), prog('d3', R1)]);
    expect(isBookRound1Complete(days, map, 3)).toBe(true);
    expect(isBookRound1Complete(days, map, 0)).toBe(false); // 전체 기준이면 d4·d5 남음
  });
  it('Day가 없으면 완료 아님', () => {
    expect(isBookRound1Complete([], new Map(), 0)).toBe(false);
  });
});

describe('resolveBookRound', () => {
  it('잠금이면 면제·완료와 무관하게 1회독', () => {
    expect(resolveBookRound({ round2Locked: true, round2Forced: true, bookRound1Complete: true })).toBe('1');
  });
  it('면제(관리자 2회독 토글)면 1회독을 안 돌았어도 2회독', () => {
    expect(resolveBookRound({ round2Locked: false, round2Forced: true, bookRound1Complete: false })).toBe('2');
  });
  it('1회독 완료 → 2회독, 아니면 1회독', () => {
    expect(resolveBookRound({ round2Locked: false, round2Forced: false, bookRound1Complete: true })).toBe('2');
    expect(resolveBookRound({ round2Locked: false, round2Forced: false, bookRound1Complete: false })).toBe('1');
  });
});

describe('countCompletedDays', () => {
  const map = buildProgressMap([prog('d1', { ...R1, ...R2 }), prog('d2', R1), prog('d3', R2)]);
  it('책 모드 1회독: 1회독 완료 Day 수', () => {
    expect(countCompletedDays(days, map, 0, { ...book, bookCurrentRound: '1' })).toBe(2);
  });
  it('책 모드 2회독: 2회독 완료 Day 수', () => {
    expect(countCompletedDays(days, map, 0, { ...book, bookCurrentRound: '2' })).toBe(2);
  });
  it('Day 모드: 1+2회독 모두 완료한 Day만', () => {
    expect(countCompletedDays(days, map, 0, { ...book, roundMode: 'day', bookCurrentRound: '1' })).toBe(1);
  });
  it('Day 모드 + 1회독 면제: 2회독만 보면 됨 / + 잠금: 1회독만', () => {
    expect(countCompletedDays(days, map, 0, { roundMode: 'day', bookCurrentRound: '2', round2Locked: false, round2Forced: true })).toBe(2);
    expect(countCompletedDays(days, map, 0, { roundMode: 'day', bookCurrentRound: '1', round2Locked: true, round2Forced: false })).toBe(2);
  });
  it('무료 한도는 앞 N개만 센다', () => {
    expect(countCompletedDays(days, map, 1, { ...book, bookCurrentRound: '1' })).toBe(1);
  });
});

describe('dayRowStatus', () => {
  it('책 모드 1회독 진행 중: 끝낸 단계/4', () => {
    const s = dayRowStatus(prog('d', { flashcard_completed: true, quiz_score: 90 }), { ...book, bookCurrentRound: '1' });
    expect(s).toMatchObject({ isCompleted: false, stepsNow: 2, totalSteps: 4, roundLabel: null, completedLabel: '1회독 완료' });
  });
  it('책 모드 2회독: 2회독 단계/3, 2회독 완료면 완료', () => {
    expect(dayRowStatus(prog('d', { ...R1, round2_quiz_score: 85 }), { ...book, bookCurrentRound: '2' }))
      .toMatchObject({ isCompleted: false, stepsNow: 1, totalSteps: 3, completedLabel: '2회독 완료' });
    expect(dayRowStatus(prog('d', { ...R1, ...R2 }), { ...book, bookCurrentRound: '2' }).isCompleted).toBe(true);
  });
  it('Day 모드: 1회독 전엔 "1회독", 1회독 뒤엔 "2회독", 둘 다 끝나면 완료', () => {
    const rules = { ...book, roundMode: 'day' as const, bookCurrentRound: '1' as const };
    expect(dayRowStatus(prog('d', { quiz_score: 90 }), rules)).toMatchObject({ roundLabel: '1회독', stepsNow: 1, totalSteps: 4 });
    expect(dayRowStatus(prog('d', { ...R1, round2_flashcard_completed: true }), rules)).toMatchObject({ roundLabel: '2회독', stepsNow: 1, totalSteps: 3 });
    expect(dayRowStatus(prog('d', { ...R1, ...R2 }), rules)).toMatchObject({ isCompleted: true, stepsNow: 0, totalSteps: 0, completedLabel: '1+2회독 완료' });
  });
  it('Day 모드 + 면제: 1회독 없이 바로 2회독 진행 / + 잠금: 1회독만 끝나면 완료', () => {
    expect(dayRowStatus(prog('d'), { roundMode: 'day', bookCurrentRound: '2', round2Locked: false, round2Forced: true }))
      .toMatchObject({ roundLabel: '2회독', isCompleted: false });
    expect(dayRowStatus(prog('d', R1), { roundMode: 'day', bookCurrentRound: '1', round2Locked: true, round2Forced: false }))
      .toMatchObject({ isCompleted: true, stepsNow: 0 });
  });
  it('기록 없음: 1회독 0/4', () => {
    expect(dayRowStatus(undefined, { ...book, bookCurrentRound: '1' })).toMatchObject({ isCompleted: false, stepsNow: 0, totalSteps: 4, r1Completed: false });
  });
});

describe('expiryInfo', () => {
  // 로컬 시간 생성자로 만든 날짜 — getMonth/getDate가 실행 환경 시간대를 따르므로(CI는 UTC) ISO 문자열 고정값은 하루가 밀릴 수 있다
  const local = (m: number, d: number) => new Date(2026, m - 1, d, 12).toISOString();
  const now = new Date(2026, 9, 12, 12).getTime();
  it('없거나 지났으면 null', () => {
    expect(expiryInfo(null, now)).toBeNull();
    expect(expiryInfo(local(10, 1), now)).toBeNull();
  });
  it('7일 이내면 urgent + D-day', () => {
    expect(expiryInfo(local(10, 17), now)).toEqual({ label: '10월 17일까지 (D-5)', urgent: true });
  });
  it('30일 넘게 남으면 D-day 표기 없음', () => {
    expect(expiryInfo(local(12, 1), now)).toEqual({ label: '12월 1일까지', urgent: false });
  });
});
