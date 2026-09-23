/**
 * 지문을 문장 단위로 나눈다 — AI를 거치지 않으므로 글자가 한 자도 바뀌지 않는다.
 * (2026-09-23: AI 추출이 필기에 가려진 글자를 추측해 원문을 훼손한 사고 이후, 붙여넣기 경로용으로 추가)
 *
 * 붙여넣기 현실에 맞춘 규칙 (사장님: "그냥 추출하면 내가 수정할게" — 실패 없이 무조건 내놓는다):
 * - PDF에서 복사하면 문장 중간에 줄바꿈이 들어온다 → 문단 안의 줄바꿈은 공백으로 이어 붙인다.
 * - 마침표 뒤에 공백이 없어도("sat.It was") 다음이 대문자면 문장 경계로 본다.
 * - 약어(Mr., e.g., U.S.)·소수점(3.5)에서는 자르지 않는다.
 * - 경계를 하나도 못 찾으면 통째로 한 문장으로 돌려준다 (빈 배열 금지).
 */
const ABBREV = /(?:Mr|Mrs|Ms|Dr|Prof|St|Jr|Sr|vs|etc|e\.g|i\.e|cf|approx|Inc|Ltd|Co|Fig|No|p|pp|Vol|U\.S|U\.K)\.$/i;
/** 문장 끝 부호 + 따라붙는 닫는 따옴표·괄호 */
const ENDING = /[.?!]+["'”’)\]]*/g;
/** 경계 다음에 올 수 있는 글자: 공백, 여는 따옴표/괄호 + 대문자·한글 */
const NEXT_OK = /^["'“‘(]?[A-Z가-힣]/;

function splitParagraph(text: string): string[] {
  const out: string[] = [];
  let start = 0;
  ENDING.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = ENDING.exec(text)) !== null) {
    const end = m.index + m[0].length;
    const candidate = text.slice(start, end).trim();
    const after = text.slice(end);
    // 경계 조건: 문장이 끝났고, 뒤가 비었거나 공백이거나 대문자·한글로 시작
    if (after !== '' && !/^\s/.test(after) && !NEXT_OK.test(after)) continue;
    if (!candidate) continue;
    if (ABBREV.test(candidate)) continue;      // 약어
    // 공백 없는 경계는 "U.S."·"A.M." 같은 한 글자 약어 사슬에서 오작동 → 앞뒤가 한 글자+마침표면 건너뜀
    if (after !== '' && !/^\s/.test(after) && (/(^|[^A-Za-z])[A-Z]\.$/.test(candidate) || /^[A-Z]\./.test(after))) continue;
    if (/^\d/.test(after)) continue;           // 소수점 (3.5)
    if (/^\d+\.$/.test(candidate)) continue;   // 목록 번호 ("1. Have you…")
    out.push(candidate);
    start = end;
  }
  const tail = text.slice(start).trim();
  if (tail) out.push(tail);
  return out;
}

export function splitSentences(text: string): string[] {
  const normalized = text.replace(/\r\n?/g, '\n').replace(/[ \t]+/g, ' ').trim();
  if (!normalized) return [];

  const out: string[] = [];
  // 빈 줄(= 문단 경계)로 나누고, 문단 안의 줄바꿈은 PDF 복사 줄바꿈으로 보고 공백으로 이어 붙인다
  for (const para of normalized.split(/\n\s*\n+/)) {
    const joined = para.replace(/\n+/g, ' ').replace(/ {2,}/g, ' ').trim();
    if (!joined) continue;
    out.push(...splitParagraph(joined));
  }
  // 경계를 못 찾았어도 빈 손으로 돌려보내지 않는다
  if (out.length === 0) out.push(normalized.replace(/\n+/g, ' ').trim());
  return out;
}

/** 한국어 해석도 같은 방식으로 나눈다 */
export function splitKorean(text: string): string[] {
  return splitSentences(text);
}
