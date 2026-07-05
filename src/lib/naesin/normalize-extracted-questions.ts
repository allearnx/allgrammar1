import { isUnanswerableImageQuestion, backfillSharedPassages } from '@/lib/validation/problem-validator';
import type { NaesinProblemQuestion } from '@/types/naesin';

/**
 * AI 추출 결과 정규화 파이프라인 — extract-pdf / extract-images 라우트 공용.
 * 순수 함수: 정답표 머지 → 원문자 정규화/옵션 평탄화 → 정렬·중복 제거
 * → 공통 지문 복제 → 그림 의존 문항 제거 → 번호 재정리.
 */

export type ExtractedQuestion = Record<string, unknown>;

/** 정답표 결과를 추출된 문제에 머지. 정답표 답이 우선. 머지된 개수 반환. */
export function mergeAnswerKey(
  questions: ExtractedQuestion[],
  answerKey: Record<string, string>,
): number {
  const keyCount = Object.keys(answerKey).length;
  if (keyCount === 0) return 0;

  let merged = 0;
  for (const q of questions) {
    const num = String(q.number);
    if (num in answerKey && answerKey[num] !== '') {
      q.answer = answerKey[num];
      merged++;
    }
  }
  return merged;
}

export interface NormalizeResult {
  questions: ExtractedQuestion[];
  /** 정답표 항목 수 (0이면 정답표 없음) */
  answerKeyCount: number;
  /** 정답표에서 문제로 머지된 답 개수 */
  mergedCount: number;
  /** 그림 의존으로 제거된 문항 수 (UI가 "N개 제외" 안내) */
  removedImageCount: number;
}

export function normalizeExtractedQuestions(
  allQuestions: ExtractedQuestion[],
  answerKey: Record<string, string> = {},
): NormalizeResult {
  // 정답표에서 가져온 답을 문제에 머지 (정답표가 source of truth)
  const answerKeyCount = Object.keys(answerKey).length;
  const mergedCount = mergeAnswerKey(allQuestions, answerKey);

  // 정답 원문자(①→1) 정규화 + 중첩 배열 옵션 평탄화
  const circledToDigit: Record<string, string> = { '①': '1', '②': '2', '③': '3', '④': '4', '⑤': '5', '⑥': '6' };
  for (const q of allQuestions) {
    if (typeof q.answer === 'string' && circledToDigit[q.answer]) {
      q.answer = circledToDigit[q.answer];
    }
    if (Array.isArray(q.options)) {
      q.options = (q.options as unknown[]).map((opt) =>
        Array.isArray(opt) ? opt.map((item: unknown, i: number) => `(${String.fromCharCode(65 + i)}) ${item}`).join(' — ') : String(opt),
      );
    }
  }

  // 문제 번호순 정렬 + 중복 제거
  const seen = new Set<number>();
  const dedup = allQuestions
    .sort((a, b) => (Number(a.number) || 0) - (Number(b.number) || 0))
    .filter((q) => {
      const num = Number(q.number);
      if (seen.has(num)) return false;
      seen.add(num);
      return true;
    });

  // 공통 지문 자동 복제: "위 글/위 대화" 후속 문항에 앞 지문을 복사(Haiku가 지문을 첫 문항에만 넣는 경우 보정).
  const passaged = backfillSharedPassages(dedup as unknown as NaesinProblemQuestion[]) as unknown as ExtractedQuestion[];

  // 그림·사진·지도·그래프 의존 문항은 미리보기에 노출하지 않고 추출 단계에서 제거(표는 마크다운 재현되어 유지).
  const before = passaged.length;
  const questions = passaged.filter((q) => !isUnanswerableImageQuestion(String(q.question ?? '')));
  questions.forEach((q, i) => { q.number = i + 1; });
  const removedImageCount = before - questions.length;

  return { questions, answerKeyCount, mergedCount, removedImageCount };
}
