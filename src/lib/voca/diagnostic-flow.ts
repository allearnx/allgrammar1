/**
 * 어휘 레벨 진단 — 라운드 진행 판단 (서버 전용, 인증/공개 라우트 공용).
 * 스테어케이스(다음 밴드 결정)를 서버가 수행한다 — 클라이언트는 밴드를 지정할 수 없고,
 * 완료한 라운드(봉인 토큰 + 답)를 제출하면 다음 문항 배치 또는 종료 신호를 받는다.
 *
 * 라운드 내 적응 (2026-08-06 사장님 확정 — "같은 라운드 안에서"):
 * 라운드 10문항은 두 배치로 나뉜다. 앞 5문항(선다 3+타이핑 2)을 풀면 currentRound로
 * 중간 채점을 받고, 정답률 ≥80%(승급 조짐)면 뒤 5문항이 타이핑 3+선다 2로 바뀐다 —
 * 라운드 전체 타이핑 40%→50%. 정답이 클라이언트에 없으므로(봉인 토큰) 중간
 * 판단도 서버만 할 수 있다.
 */
import {
  getStartBand,
  nextStep,
  ROUND_SIZE,
  UP_RATIO,
  type BandKey,
  type DiagnosticGrade,
  type RoundSummary,
} from './diagnostic-bands';
import { getActiveBands, sampleDiagnosticQuestions, type DiagnosticQuestion } from './diagnostic-sampling';
import { verifyRounds, type TokenAnswer } from './diagnostic-token';

type SupabaseLike = {
  from: (table: string) => any; // eslint-disable-line @typescript-eslint/no-explicit-any
};

/** 라운드 앞 배치 크기 (뒤 배치 = ROUND_SIZE − HEAD) */
export const HEAD_SIZE = ROUND_SIZE / 2;
/** 앞 배치의 타이핑 문항 수 (선다 3 + 타이핑 2) */
export const HEAD_TYPING = 2;
/** 뒤 배치 기본 타이핑 문항 수 — 라운드 전체 타이핑 40% */
export const TAIL_TYPING_BASE = 2;
/** 앞 배치 ≥80%(승급 조짐) 시 뒤 배치 타이핑 문항 수 (선다 2 + 타이핑 3) — 라운드 전체 타이핑 50% */
export const TAIL_TYPING_HOT = 3;

export type NextRoundResult =
  | { kind: 'questions'; band: BandKey; questions: DiagnosticQuestion[] }
  | { kind: 'done' }
  | { kind: 'error'; status: number; message: string };

export async function nextRoundQuestions(
  supabase: SupabaseLike,
  input: {
    grade: DiagnosticGrade;
    rounds: TokenAnswer[][];
    /** 진행 중인 라운드의 앞 배치 답 — 있으면 뒤 배치(중간 채점 후 형식 결정)를 돌려준다 */
    currentRound?: TokenAnswer[];
    excludeIds: string[];
  },
): Promise<NextRoundResult> {
  const activeBands = await getActiveBands(supabase);
  if (activeBands.length === 0) {
    return { kind: 'error', status: 404, message: '진단 준비 중입니다. 조금만 기다려주세요.' };
  }

  const excludeIds = [...input.excludeIds];

  // 라운드 뒤 배치 요청 — 앞 배치를 중간 채점해 형식을 정한다
  if (input.currentRound?.length) {
    const verified = await verifyRounds([...input.rounds, input.currentRound]);
    if (!verified) {
      return { kind: 'error', status: 400, message: '유효하지 않은 진단 기록입니다. 처음부터 다시 시작해주세요.' };
    }
    const head = verified[verified.length - 1];
    const tailCount = ROUND_SIZE - head.items.length;
    if (tailCount <= 0) {
      return { kind: 'error', status: 400, message: '이미 완료된 라운드입니다.' };
    }
    const headCorrect = head.items.filter((i) => i.result === 'correct').length;
    const hot = headCorrect / head.items.length >= UP_RATIO;
    const typingCount = Math.min(hot ? TAIL_TYPING_HOT : TAIL_TYPING_BASE, tailCount);
    for (const r of verified) for (const it of r.items) excludeIds.push(it.vocabId);

    const questions = await sampleDiagnosticQuestions(
      supabase, head.band, excludeIds.slice(0, 1500), tailCount, typingCount,
    );
    if (!questions) {
      return { kind: 'error', status: 404, message: '이 레벨의 단어가 아직 준비되지 않았습니다.' };
    }
    return { kind: 'questions', band: head.band, questions };
  }

  // 새 라운드(앞 배치) 요청
  let band: BandKey;
  if (input.rounds.length === 0) {
    band = getStartBand(input.grade, activeBands);
  } else {
    const verified = await verifyRounds(input.rounds);
    if (!verified) {
      return { kind: 'error', status: 400, message: '유효하지 않은 진단 기록입니다. 처음부터 다시 시작해주세요.' };
    }
    const summaries: RoundSummary[] = verified.map((r) => ({
      band: r.band,
      correct: r.items.filter((i) => i.result === 'correct').length,
      total: r.items.length,
    }));
    const step = nextStep(summaries, activeBands);
    if (step.type === 'done') return { kind: 'done' };
    band = step.band;
    for (const r of verified) for (const it of r.items) excludeIds.push(it.vocabId);
  }

  const questions = await sampleDiagnosticQuestions(
    supabase, band, excludeIds.slice(0, 1500), HEAD_SIZE, HEAD_TYPING,
  );
  if (!questions) {
    return { kind: 'error', status: 404, message: '이 레벨의 단어가 아직 준비되지 않았습니다.' };
  }
  return { kind: 'questions', band, questions };
}
