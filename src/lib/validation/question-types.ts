// 문제 타입 모델 — 목표 스키마 + 분류기.
// 설계: docs/question-type-model.md. Phase 1(타입 백필)용. 아직 채점/저장 경로에서 안 씀(non-breaking).
import type { NaesinProblemQuestion } from '@/types/naesin';

// ── 구조 타입 (5개) ──
export type QuestionType =
  | 'single_choice' // 단일 객관식 (+ 인라인마커 flag, + 괄호선택)
  | 'multi_choice'  // 복수정답 (value: number[])
  | 'short_answer'  // 단어/짧은 답
  | 'sentence'      // 영작·오류수정·단어배열·문장 (AI 채점)
  | 'multi_part';   // 복합 (subParts)

// ── 목표 스키마 (Phase 2~ 에서 채점/저장이 이걸로 전환) ──
export interface QuestionBase {
  number: number;
  question: string;
  type: QuestionType;
  tag?: string;        // 교육적 분류 (영작/빈칸/오류수정/괄호선택/인라인마커…) — 채점 무관 메타
  imageUrl?: string;   // 실제 사진만 (인라인 '(그림:설명)'은 question 텍스트)
  explanation?: string;
}
export interface SingleChoiceQ extends QuestionBase {
  type: 'single_choice';
  options: string[];
  choicesAreMarkers?: boolean; // 보기가 지문 속 ⓐ~ⓔ 밑줄을 가리킴 (렌더/작성 힌트, 채점 동일)
  answer: { value: number };
}
export interface MultiChoiceQ extends QuestionBase {
  type: 'multi_choice';
  options: string[];
  answer: { value: number[] };
}
export interface ShortAnswerQ extends QuestionBase {
  type: 'short_answer';
  answer: { value: string; accepted?: string[] };
}
export interface SentenceQ extends QuestionBase {
  type: 'sentence';
  answer: { value: string; accepted?: string[]; aiGraded?: boolean };
}
export interface MultiPartQ extends QuestionBase {
  type: 'multi_part';
  parts: { label: string; value: string; accepted?: string[] }[];
}
export type TypedQuestion = SingleChoiceQ | MultiChoiceQ | ShortAnswerQ | SentenceQ | MultiPartQ;

// ── 분류기 (현재 flat 문항 → 타입 추론) ──
export interface ClassifyResult {
  type: QuestionType;
  tag?: string;
  choicesAreMarkers?: boolean;
  /** options 추출 등 후속 변환 필요 (괄호선택) */
  needsOptionExtraction?: boolean;
  /** 분류 자신 없음 → Phase 1 step 4 수동 리뷰 대상 */
  uncertain?: boolean;
}

const MARKER = /^[ⓐⓑⓒⓓⓔ①②③④⑤⑥⑦⑧⑨⑩]$/;
const wordCount = (s: unknown) => String(s).trim().split(/\s+/).filter(Boolean).length;

export function classifyQuestionType(q: Partial<NaesinProblemQuestion>): ClassifyResult {
  const opts = Array.isArray(q.options) ? q.options : null;
  const hasOpts = !!opts && opts.length > 0;
  const a = String(q.answer ?? '').trim();
  const qt = String(q.question ?? '');

  // multi_part — 가장 명확
  if (Array.isArray(q.subParts) && q.subParts.length) {
    return { type: 'multi_part', tag: 'subParts' };
  }

  // 객관식 계열 (options 있음)
  if (hasOpts) {
    const allMarker = opts!.every((o) => MARKER.test(String(o).trim()));
    const inlineQ = /밑줄 친.*[ⓐ①]|[ⓐ-ⓔ]\s*~\s*[ⓐ-ⓔ]|[①-⑤]\s*~\s*[①-⑤]/.test(qt);
    const multi = a.includes(',') || /모두\s*고르|[2-9]\s*개\s*고르|두\s*개\s*고르/.test(qt);
    if (multi) return { type: 'multi_choice', tag: '복수정답' };
    if (allMarker || inlineQ) return { type: 'single_choice', tag: '인라인마커', choicesAreMarkers: true };
    return { type: 'single_choice', tag: '단일' };
  }

  // 괄호선택 (A / B) → single_choice (결정1). options는 마이그레이션에서 괄호 파싱.
  const paren = qt.match(/\(([^()]*\/[^()]*)\)/);
  if (paren) {
    const choices = paren[1].split('/').map((s) => s.trim()).filter(Boolean);
    if (choices.length >= 2 && choices.some((c) => c.toLowerCase() === a.toLowerCase())) {
      return { type: 'single_choice', tag: '괄호선택', needsOptionExtraction: true };
    }
  }

  // 서술형 계열 (options 없음)
  if (/_{2,}|빈칸/.test(qt) && wordCount(a) <= 3) return { type: 'short_answer', tag: '빈칸' };
  if (/배열|<\s*보기\s*>|단어를?\s*(이용|사용)/.test(qt)) return { type: 'sentence', tag: '단어배열' };
  if (/틀린|어색한|고쳐|어법상|오류/.test(qt)) return { type: 'sentence', tag: '오류수정' };
  if (/영작|우리말|문장으로|문장을/.test(qt) || (/^[A-Z]/.test(a) && /[.?!]$/.test(a) && wordCount(a) >= 4)) {
    return { type: 'sentence', tag: '영작' };
  }
  if (wordCount(a) <= 3) return { type: 'short_answer', tag: '단어' };
  return { type: 'sentence', tag: '기타', uncertain: true };
}
