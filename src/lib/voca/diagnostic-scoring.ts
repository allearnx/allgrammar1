/**
 * 어휘 레벨 진단 — 검증된 라운드 채점 (공용, 서버 전용).
 * 입력은 diagnostic-token.verifyRounds()가 서명 검증을 마친 라운드다 —
 * 정오는 토큰 봉인 정보로 이미 판정돼 있어 클라이언트 주장이 끼어들 틈이 없다.
 * 인증 제출(/api/voca/diagnostic/submit)과 비로그인(/api/public/diagnostic/*)이 같이 쓴다.
 */
import { resolveFinalLevel, type BandKey, type FinalLevel, type RoundSummary } from './diagnostic-bands';
import type { VerifiedRound } from './diagnostic-token';

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
  /** 놓친 단어 (결과 화면 표시용, 최대 5개) */
  missed: { front_text: string; back_text: string }[];
  /** 놓친 단어 총 개수 — "몰랐던 단어 N개" 지표용 (missed는 5개까지만 노출) */
  missedCount: number;
}

export function scoreDiagnosticRounds(
  verified: VerifiedRound[],
  activeBands: BandKey[],
): DiagnosticScore {
  const rounds: ScoredRound[] = verified.map((r) => ({
    band: r.band,
    total: r.items.length,
    correct: r.items.filter((i) => i.result === 'correct').length,
    unknown: r.items.filter((i) => i.result === 'unknown').length,
    items: r.items,
  }));

  const summaries: RoundSummary[] = rounds.map((r) => ({ band: r.band, correct: r.correct, total: r.total }));
  const level = resolveFinalLevel(summaries, activeBands.length ? activeBands : [rounds[0].band]);

  const startBand = rounds[0].band;
  const startRounds = rounds.filter((r) => r.band === startBand);
  const cumCorrect = startRounds.reduce((s, r) => s + r.correct, 0);
  const cumTotal = startRounds.reduce((s, r) => s + r.total, 0);
  const coverageScore = Math.round((cumCorrect / cumTotal) * 100);

  const missedAll = rounds.flatMap((r) => r.items).filter((i) => i.result !== 'correct');
  const missed = missedAll.slice(0, 5).map((i) => ({ front_text: i.front_text, back_text: i.back_text }));

  return { rounds, level, startBand, coverageScore, missed, missedCount: missedAll.length };
}
