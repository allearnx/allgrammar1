import type { GradingItem, GradingResult, RubricAdapter } from '../types';
import { parseJsonArrayResponse, snapScore } from '../engine';
// normalize-answer는 순수 함수 모음 — 코어의 "DB·UI 의존 금지" 원칙에 어긋나지 않는다.
import { normalize, normalizeSeparators, isSubstringMatch } from '@/lib/naesin/normalize-answer';

/**
 * 내신 정답키 루브릭 — 모범 답안(+인정 답안)과 비교하는 채점.
 *
 * 빠른 경로는 기존 grade-subjective 라우트·submit 재채점과 동일한 규칙
 * (정규화 일치 → 구분자 무시 → 배열 문제 부분 일치)이라 채점 결과가
 * 라이브/재채점 간에 어긋나지 않는다. 불일치 시에만 AI가 의미 기반으로 판정한다.
 */
export const naesinAnswerKeyAdapter: RubricAdapter = {
  id: 'naesin-answer-key',

  fastPath(item: GradingItem): GradingResult | null {
    const candidates = [item.referenceAnswer, ...(item.acceptedAnswers ?? [])];
    const studentNorm = normalize(item.studentAnswer);
    const isExact =
      candidates.some((c) => normalize(c) === studentNorm) ||
      candidates.some((c) => normalizeSeparators(c) === normalizeSeparators(item.studentAnswer)) ||
      candidates.some((c) => isSubstringMatch(item.studentAnswer, c));
    return isExact ? { id: item.id, score: 100, method: 'exact' } : null;
  },

  buildPrompt(items: GradingItem[]): string {
    const blocks = items
      .map((item, i) => {
        const accepted = item.acceptedAnswers?.length
          ? `\nAlso accepted: ${item.acceptedAnswers.map((a) => `"${a}"`).join(', ')}`
          : '';
        return `[${i + 1}] id: "${item.id}"
Question: "${item.prompt}"
Answer key: "${item.referenceAnswer}"${accepted}
Student: "${item.studentAnswer}"`;
      })
      .join('\n\n');

    return `You are grading subjective (written-response) answers on a Korean middle/high school English exam. Each item has an answer key. String comparison already failed, so decide whether the student's answer is still acceptable.

Scoring rules:
- 100: The student's answer is equivalent to the answer key — same meaning AND grammatically correct. Accept differences in contractions, spacing, punctuation, or equally correct wording.
- 50: Partially correct — the core idea or structure matches the answer key but there is a grammar/spelling error, a missing element, or only part of a multi-part answer is right.
- 0: Wrong — different meaning, wrong grammar pattern, or does not answer the question.
- STRICT conditions: if the question states conditions (word count, given words to use, a required form/pattern, "※ ..." format instructions), the student must satisfy them for 100. Violating an explicit condition caps the score at 50.
- Do NOT award 100 generously. When unsure whether the answer truly matches the answer key, give 50, not 100.

For each item return:
- "score": 100, 50, or 0
- "feedback": very short Korean feedback for the student (max 40 characters, e.g. "시제가 달라요 — 과거형으로 써야 해요")
- "correctedAnswer": the student's answer corrected to match the answer key (omit if score is 100)

${blocks}

Return ONLY a JSON array with exactly ${items.length} objects:
[
  { "id": "<id>", "score": <100|50|0>, "feedback": "<Korean>", "correctedAnswer": "<English or omit>" }
]`;
  },

  parseResponse(text: string, items: GradingItem[]): GradingResult[] {
    const validIds = new Set(items.map((i) => i.id));
    const results: GradingResult[] = [];
    for (const r of parseJsonArrayResponse(text)) {
      const id = r.id;
      if (typeof id !== 'string' || !validIds.has(id)) continue;
      results.push({
        id,
        score: snapScore(r.score),
        feedback: typeof r.feedback === 'string' && r.feedback ? r.feedback : undefined,
        correctedAnswer:
          typeof r.correctedAnswer === 'string' && r.correctedAnswer ? r.correctedAnswer : undefined,
        method: 'ai',
      });
    }
    return results;
  },
};
