/**
 * 2회독 표제어 시험 — 유의어·반의어 문항 생성 + 채점 (순수 로직, 서버·클라 공용).
 *
 * 2회독에서 배운 유의어/반의어를 시험한다. 정답은 "플래시카드에서 보여준 그 값"만 인정
 * (voca_vocabulary.synonyms / antonyms 필드) — 여러 개면 그중 하나만 맞아도 정답.
 * 문항 유형은 스펠링(직접 입력)과 4지선다를 섞고, 총 문항 수로 난이도를 조절한다
 * (표제어 20개 → 30문항처럼 유의어·반의어를 골라 추가).
 */

export interface Round2Vocab {
  id: string;
  front_text: string;
  back_text: string;
  synonyms: string | null;
  antonyms: string | null;
}

export type Relation = 'synonym' | 'antonym';
export type ExamFormat = 'spelling' | 'choice';

export interface Round2ExamQuestion {
  vocabId: string;
  relation: Relation;
  /** 제시어 (표제어) */
  prompt: string;
  /** 표제어 뜻 (힌트) */
  promptKo: string;
  format: ExamFormat;
  /** 정답 후보 — 플래시카드에서 보여준 값. 하나라도 맞으면 정답 */
  answers: string[];
  /** 4지선다 보기 (choice일 때만). 정답 1 + 오답 3, 셔플됨 */
  options?: string[];
}

/** 쉼표 구분 필드를 값 배열로 (구/숙어는 통째로 한 답) */
export function parseRelated(field: string | null): string[] {
  if (!field) return [];
  return field
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/** 채점용 정규화 — 소문자, 앞뒤·중복 공백 정리 */
export function normalizeRelated(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** 답이 정답 후보 중 하나와 일치하는가 */
export function isRelatedCorrect(input: string, answers: string[]): boolean {
  const n = normalizeRelated(input);
  if (!n) return false;
  return answers.some((a) => normalizeRelated(a) === n);
}

interface Candidate {
  vocabId: string;
  relation: Relation;
  prompt: string;
  promptKo: string;
  answers: string[];
}

/** 각 단어에서 유의어·반의어 문항 후보를 뽑는다 (데이터 있는 것만) */
export function buildCandidates(vocab: Round2Vocab[]): Candidate[] {
  const out: Candidate[] = [];
  for (const v of vocab) {
    const syn = parseRelated(v.synonyms);
    const ant = parseRelated(v.antonyms);
    if (syn.length) out.push({ vocabId: v.id, relation: 'synonym', prompt: v.front_text, promptKo: v.back_text, answers: syn });
    if (ant.length) out.push({ vocabId: v.id, relation: 'antonym', prompt: v.front_text, promptKo: v.back_text, answers: ant });
  }
  return out;
}

export interface BuildOptions {
  /** 총 문항 수 (난이도). 후보가 부족하면 있는 만큼 */
  totalCount: number;
  /** 4지선다 비율 0~1 (나머지는 스펠링). 기본 0.5 */
  choiceRatio?: number;
  /** 셔플 함수 (테스트 주입용). 기본 무작위 */
  shuffle?: <T>(a: T[]) => T[];
}

const defaultShuffle = <T>(a: T[]): T[] => {
  const arr = [...a];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

/**
 * 문항 생성. 후보를 셔플해 totalCount개 뽑고, choiceRatio만큼 4지선다로.
 * 4지선다 오답은 다른 후보의 답에서 뽑아 정답과 겹치지 않게 채운다.
 */
export function buildRound2ExamQuestions(vocab: Round2Vocab[], opts: BuildOptions): Round2ExamQuestion[] {
  const shuffle = opts.shuffle ?? defaultShuffle;
  const choiceRatio = opts.choiceRatio ?? 0.5;
  const candidates = shuffle(buildCandidates(vocab));
  const picked = candidates.slice(0, Math.max(0, opts.totalCount));

  // 오답 풀 — 모든 후보 답을 모아 중복 제거 (구/숙어 포함)
  const distractorPool = [...new Set(candidates.flatMap((c) => c.answers).map((a) => a.trim()).filter(Boolean))];

  const choiceCutoff = Math.round(picked.length * choiceRatio);
  return picked.map((c, i) => {
    const format: ExamFormat = i < choiceCutoff ? 'choice' : 'spelling';
    if (format !== 'choice') {
      return { vocabId: c.vocabId, relation: c.relation, prompt: c.prompt, promptKo: c.promptKo, format, answers: c.answers };
    }
    const correct = c.answers[0];
    const answerSet = new Set(c.answers.map(normalizeRelated));
    const distractors: string[] = [];
    for (const d of shuffle(distractorPool)) {
      if (distractors.length >= 3) break;
      if (answerSet.has(normalizeRelated(d))) continue;
      if (distractors.some((x) => normalizeRelated(x) === normalizeRelated(d))) continue;
      distractors.push(d);
    }
    const options = shuffle([correct, ...distractors]);
    return { vocabId: c.vocabId, relation: c.relation, prompt: c.prompt, promptKo: c.promptKo, format, answers: c.answers, options };
  });
}
