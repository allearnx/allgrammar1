/**
 * 어휘 레벨 진단 — 제출 라운드 서버 재채점 (공용).
 * 인증 제출(/api/voca/diagnostic/submit)과 비로그인 완주(/api/public/diagnostic/*)가 같이 쓴다.
 * 정오는 클라이언트 값을 믿지 않고 선택 보기 vocabId === 문항 vocabId로 재계산한다.
 */
import { resolveFinalLevel, type BandKey, type FinalLevel, type RoundSummary } from './diagnostic-bands';

export interface SubmittedItem {
  vocabId: string;
  front_text: string;
  back_text: string;
  chosenVocabId: string | null;
}

export interface SubmittedRound {
  band: BandKey;
  items: SubmittedItem[];
}

export interface ScoredRound {
  band: BandKey;
  total: number;
  correct: number;
  unknown: number;
  items: { vocabId: string; front_text: string; back_text: string; result: 'correct' | 'wrong' | 'unknown' }[];
}

export interface DiagnosticScore {
  rounds: ScoredRound[];
  level: FinalLevel;
  startBand: BandKey;
  /** 시작(학년) 밴드 누적 정답률 — "○○ 단어를 N% 알고 있어요" */
  coverageScore: number;
}

export function scoreDiagnosticRounds(
  submitted: SubmittedRound[],
  activeBands: BandKey[],
): DiagnosticScore {
  const rounds: ScoredRound[] = submitted.map((r) => {
    const items = r.items.map((it) => ({
      vocabId: it.vocabId,
      front_text: it.front_text,
      back_text: it.back_text,
      result: (it.chosenVocabId === null ? 'unknown' : it.chosenVocabId === it.vocabId ? 'correct' : 'wrong') as
        | 'correct'
        | 'wrong'
        | 'unknown',
    }));
    return {
      band: r.band,
      total: items.length,
      correct: items.filter((i) => i.result === 'correct').length,
      unknown: items.filter((i) => i.result === 'unknown').length,
      items,
    };
  });

  const summaries: RoundSummary[] = rounds.map((r) => ({ band: r.band, correct: r.correct, total: r.total }));
  const level = resolveFinalLevel(summaries, activeBands.length ? activeBands : [rounds[0].band]);

  const startBand = rounds[0].band;
  const startRounds = rounds.filter((r) => r.band === startBand);
  const cumCorrect = startRounds.reduce((s, r) => s + r.correct, 0);
  const cumTotal = startRounds.reduce((s, r) => s + r.total, 0);
  const coverageScore = Math.round((cumCorrect / cumTotal) * 100);

  return { rounds, level, startBand, coverageScore };
}
