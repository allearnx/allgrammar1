/**
 * 학습 단계(단어·지문·대화) 오답노트 정리 규칙
 *
 * 1) 빈 답 제외 — 학생이 아무것도 안 쓰고(또는 "." 같은 구두점만 찍고) 제출한 항목은
 *    "모르는 것"이 아니라 "안 푼 것"이라 오답노트를 채우기만 한다 (빈칸 채우기 54칸 빈 채
 *    제출, 대화 영작 "." 제출 실사례).
 * 2) 같은 문항은 최신 1건만 — 재도전할 때마다 같은 문항이 누적되지 않게 한다.
 *
 * ⚠️ 문제 시트(problem/mockExam/external_passage) 경로에는 적용하지 않는다:
 *    - 시트 제출은 이미 시트 단위로 지우고 다시 넣어 중복이 없다.
 *    - 시험에서 건너뛴 문항은 실제 오답이고, 시도 JSONB↔오답 테이블 건수 동기화
 *      (health-check WRONG_ANSWER_SYNC, backfill)가 걸려 있어 걸러내면 어긋난다.
 */

type QD = Record<string, unknown>;

const BLANK_RE = /^[\s.\-_?,!·…~]*$/;

function isBlankText(v: unknown): boolean {
  if (v == null) return true;
  if (Array.isArray(v)) return v.every(isBlankText);
  return BLANK_RE.test(String(v));
}

/** userAnswer 필드가 있는 유형에서만 판단. (ordering/vocab_quiz/grammar_vocab는 필드가 없음 → 빈 답 아님) */
export function isBlankWrongAnswer(qd: unknown): boolean {
  if (!qd || typeof qd !== 'object') return false;
  const q = qd as QD;
  if (!('userAnswer' in q)) return false;
  return isBlankText(q.userAnswer);
}

/** 같은 문항 판정 키. 유형별 식별 필드가 없으면 문항 텍스트 → 전체 JSON 순으로 폴백. */
export function wrongAnswerKey(qd: unknown): string {
  if (!qd || typeof qd !== 'object') return `raw:${JSON.stringify(qd)}`;
  const q = qd as QD;
  switch (q.type) {
    case 'fill_blank':
      return `fb:${q.difficulty ?? ''}:${q.blankIndex ?? ''}:${q.correctAnswer ?? ''}`;
    case 'vocab_spelling':
    case 'vocab_quiz':
      return `v:${q.front_text ?? ''}`;
    case 'grammar_vocab':
      return `gv:${q.cpIdx ?? ''}:${q.itemIdx ?? ''}`;
    case 'ordering':
      return `ord:${q.correctOrder ?? ''}`;
    case 'translation':
    case 'first_letter':
      return `k:${q.koreanText ?? ''}`;
    default: {
      const text = q.question ?? q.koreanText ?? q.front_text ?? q.correctAnswer;
      return text != null ? `t:${String(text)}` : `raw:${JSON.stringify(q)}`;
    }
  }
}

/**
 * 빈 답 제거 + 같은 키는 마지막 항목만 남김 (입력 순서 유지).
 */
export function cleanWrongAnswers<T>(items: T[], pick: (item: T) => unknown = (i) => i): T[] {
  const lastIndex = new Map<string, number>();
  items.forEach((item, i) => {
    const qd = pick(item);
    if (isBlankWrongAnswer(qd)) return;
    lastIndex.set(wrongAnswerKey(qd), i);
  });
  const keep = new Set(lastIndex.values());
  return items.filter((_, i) => keep.has(i));
}
