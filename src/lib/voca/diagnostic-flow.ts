/**
 * 어휘 레벨 진단 — 라운드 진행 판단 (서버 전용, 인증/공개 라우트 공용).
 * 스테어케이스(다음 밴드 결정)를 서버가 수행한다 — 클라이언트는 밴드를 지정할 수 없고,
 * 완료한 라운드(봉인 토큰 + 고른 인덱스)를 제출하면 다음 라운드 문항 또는 종료 신호를 받는다.
 */
import { getStartBand, nextStep, type BandKey, type DiagnosticGrade, type RoundSummary } from './diagnostic-bands';
import { getActiveBands, sampleDiagnosticQuestions, type DiagnosticQuestion } from './diagnostic-sampling';
import { verifyRounds, type TokenAnswer } from './diagnostic-token';

type SupabaseLike = {
  from: (table: string) => any; // eslint-disable-line @typescript-eslint/no-explicit-any
};

export type NextRoundResult =
  | { kind: 'questions'; band: BandKey; questions: DiagnosticQuestion[] }
  | { kind: 'done' }
  | { kind: 'error'; status: number; message: string };

export async function nextRoundQuestions(
  supabase: SupabaseLike,
  input: { grade: DiagnosticGrade; rounds: TokenAnswer[][]; excludeIds: string[] },
): Promise<NextRoundResult> {
  const activeBands = await getActiveBands(supabase);
  if (activeBands.length === 0) {
    return { kind: 'error', status: 404, message: '진단 준비 중입니다. 조금만 기다려주세요.' };
  }

  let band: BandKey;
  const excludeIds = [...input.excludeIds];

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

  const questions = await sampleDiagnosticQuestions(supabase, band, excludeIds.slice(0, 1500));
  if (!questions) {
    return { kind: 'error', status: 404, message: '이 레벨의 단어가 아직 준비되지 않았습니다.' };
  }
  return { kind: 'questions', band, questions };
}
