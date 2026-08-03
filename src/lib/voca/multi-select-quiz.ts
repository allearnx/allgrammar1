/**
 * 복수 선택 퀴즈 문제 생성 — 초등 어휘(주제별 교재)용 4지선다 대체.
 *
 * 형식: 뜻 하나 제시 → 해당하는 단어를 "모두" 고르기. 정답 개수는 알려주지 않는다.
 * 4지선다는 넷 중 제일 그럴듯한 하나를 고르면 되지만(소거법 통함), 개수 미공개
 * 복수 선택은 보기 하나하나를 O/X 판정해야 한다 — 정답이 1개인 문제도 찍기가
 * 안 통한다 (보기 5개면 우연히 맞출 확률 1/32).
 *
 * 주제별 교재는 뜻이 같은 단어가 한 Day에 모인다(big·large·tall·great="큰").
 * 4지선다에서는 정답이 여럿이 되는 결함이었던 게, 여기서는 "다 골라야 정답"인
 * 문제 재료가 된다.
 *
 * 보기 구성 3단계 — hasMeaningOverlap은 "빼는 용도"로는 안전하지만 "넣는
 * 용도"로는 위험하다 (finest·simplest가 "가장" 공유로 겹침 판정됨):
 *   정답   = 제시된 뜻의 토큰을 전부 포함하는 단어 (엄격한 상위집합)
 *   오답   = 토큰이 하나도 안 겹치는 단어 (기존 함수 그대로)
 *   중간지대 = 일부만 겹치는 단어 → 보기에서 아예 제외 ("이것도 맞잖아" 차단)
 */

import { shuffle } from '@/lib/utils';
import { meaningTokens, hasMeaningOverlap } from '@/lib/voca/meaning-overlap';

export interface MultiSelectSource {
  front_text: string;
  back_text: string;
}

export interface MultiSelectQuestion {
  /** 화면에 제시하는 뜻 (출제 기준 단어의 back_text 원문) */
  prompt: string;
  /** 보기로 깔리는 단어들 (정답 + 오답, 섞인 순서) */
  options: string[];
  /** 정답 단어 집합 — options의 부분집합 */
  answers: string[];
  /** 출제 기준 단어 (오답 기록·결과 화면용) */
  front_text: string;
  back_text: string;
}

/** 오답 보기 최소 개수 — 이만큼도 못 채우면 그 단어는 출제하지 않는다 */
const MIN_DISTRACTORS = 2;
/** 목표 보기 개수 (정답이 많으면 그만큼 늘어난다) */
const TARGET_OPTIONS = 6;
const MAX_DISTRACTORS = 4;

/** a ⊆ b */
function isSubset(a: Set<string>, b: Set<string>): boolean {
  for (const t of a) if (!b.has(t)) return false;
  return true;
}

export function generateMultiSelectQuestions(vocabulary: MultiSelectSource[]): MultiSelectQuestion[] {
  const tokenCache = new Map<string, Set<string>>();
  const tokensOf = (v: MultiSelectSource) => {
    let t = tokenCache.get(v.front_text);
    if (!t) {
      t = meaningTokens(v.back_text ?? '');
      tokenCache.set(v.front_text, t);
    }
    return t;
  };

  const questions: MultiSelectQuestion[] = [];
  // ship·boat처럼 뜻("배")이 완전히 같은 단어는 같은 문제를 두 번 만들게 된다
  // → 프롬프트 토큰 집합 기준으로 한 번만 출제 (정답에는 둘 다 들어간다)
  const seenPrompts = new Set<string>();

  for (const v of shuffle([...vocabulary])) {
    const promptTokens = tokensOf(v);
    if (promptTokens.size === 0) continue; // 뜻이 비었거나 태그뿐

    const promptKey = [...promptTokens].sort().join('|');
    if (seenPrompts.has(promptKey)) continue;

    const answers: string[] = [];
    const safe: MultiSelectSource[] = [];
    for (const w of vocabulary) {
      if (w.front_text === v.front_text) continue;
      if (isSubset(promptTokens, tokensOf(w))) {
        answers.push(w.front_text);
      } else if (!hasMeaningOverlap(v.back_text ?? '', w.back_text ?? '')) {
        safe.push(w);
      }
      // else: 일부만 겹침 → 중간지대, 보기 제외
    }
    answers.push(v.front_text);

    const distractorCount = Math.min(
      MAX_DISTRACTORS,
      Math.max(MIN_DISTRACTORS, TARGET_OPTIONS - answers.length),
    );
    if (safe.length < MIN_DISTRACTORS) continue; // 보기를 못 채우면 출제 안 함

    seenPrompts.add(promptKey);
    const distractors = shuffle(safe).slice(0, distractorCount).map((w) => w.front_text);
    questions.push({
      prompt: v.back_text,
      options: shuffle([...answers, ...distractors]),
      answers,
      front_text: v.front_text,
      back_text: v.back_text,
    });
  }

  return questions;
}

/** 채점: 고른 집합이 정답 집합과 완전히 일치해야 정답 (부분점수 없음) */
export function isExactMatch(selected: ReadonlySet<string>, answers: readonly string[]): boolean {
  if (selected.size !== answers.length) return false;
  for (const a of answers) if (!selected.has(a)) return false;
  return true;
}
