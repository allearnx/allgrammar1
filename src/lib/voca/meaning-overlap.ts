/**
 * 뜻(back_text) 의미 겹침 판정 — 4지선다 보기 생성용.
 *
 * 배경: 한 Day 안에 뜻이 사실상 같은 단어가 흔하다
 * (bred=새끼를 낳다·기르다 / nurture=양육하다·키우다 / bring up=기르다·양육하다).
 * 보기 제외를 "정답과 완전히 같은 문자열"로만 하면 이런 유의어 뜻이 보기로
 * 섞여 들어와 정답이 두 개인 문제가 된다 → 뜻을 토큰 단위로 쪼개 하나라도
 * 겹치면 보기 후보에서 제외한다.
 */

/** 품사 태그·구두점을 걷어내고 의미 토큰 집합으로 분해 */
export function meaningTokens(backText: string): Set<string> {
  return new Set(
    backText
      .replace(/\[[^\]]*\]/g, ' ')   // [동], [명] 등 품사 태그 제거
      .replace(/[()~·;/]/g, ' ')     // 구두점 → 공백
      .split(/[,\s]+/)
      .map((t) => t.trim().replace(/^[을를이가은는~]+/, ''))
      .filter((t) => t.length >= 2),
  );
}

/** 두 뜻이 의미 토큰을 공유하는가 (예: "기르다" 공유 → true) */
export function hasMeaningOverlap(a: string, b: string): boolean {
  const ta = meaningTokens(a);
  if (ta.size === 0) return false;
  for (const tok of meaningTokens(b)) {
    if (ta.has(tok)) return true;
  }
  return false;
}
