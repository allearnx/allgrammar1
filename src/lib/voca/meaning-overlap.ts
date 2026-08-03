/**
 * 뜻(back_text) 의미 겹침 판정 — 4지선다 보기 생성용.
 *
 * 배경: 한 Day 안에 뜻이 사실상 같은 단어가 흔하다
 * (bred=새끼를 낳다·기르다 / nurture=양육하다·키우다 / bring up=기르다·양육하다).
 * 보기 제외를 "정답과 완전히 같은 문자열"로만 하면 이런 유의어 뜻이 보기로
 * 섞여 들어와 정답이 두 개인 문제가 된다 → 뜻을 토큰 단위로 쪼개 하나라도
 * 겹치면 보기 후보에서 제외한다.
 */

/**
 * 품사 태그·구두점을 걷어내고 의미 토큰 집합으로 분해.
 *
 * 한글은 한 글자 토큰도 남긴다 — 초등 어휘는 뜻이 한 글자인 경우가 흔하다
 * (big·large·great·tall = "큰", road·way·track = "길", ship·boat = "배").
 * 두 글자 이상만 보던 시절엔 이런 뜻이 통째로 버려져 유의어가 보기로 섞였다.
 * 조사만 남은 토큰은 위 replace로 빈 문자열이 되어 자연히 걸러진다.
 *
 * 영문 한 글자는 버린다 — 영영 교재(Vocabulary Workshop B)는 뜻이 영어 정의라
 * 관사 "a"까지 토큰이 되면 서로 다른 뜻이 전부 겹침으로 잡힌다.
 * 실측: 무조건 1자 허용 시 이 교재에서 보기 후보 부족 3건 발생 → 한글로 한정하면 0건.
 */
export function meaningTokens(backText: string): Set<string> {
  return new Set(
    backText
      .replace(/\[[^\]]*\]/g, ' ')   // [동], [명] 등 품사 태그 제거
      .replace(/[()~·;/]/g, ' ')     // 구두점 → 공백
      .split(/[,\s]+/)
      .map((t) => t.trim().replace(/^~+/, ''))
      .filter((t) => t.length > 0 && !KO_PARTICLES.has(t) && (t.length >= 2 || /[가-힣]/.test(t))),
  );
}

/**
 * 토큰 전체가 이것이면 버린다 — "~을 기르다"의 "을" 같은 홀로 선 조사.
 *
 * ⚠️ 접두 제거(`^[을를이가은는]+`)로 하면 안 된다. 진짜 단어까지 깎여서
 * 가방→방, 가족→족, 은행→행, 이름→름이 된다. 예전엔 결과가 한 글자라
 * 길이 필터에 걸려 조용히 버려졌지만, 한 글자를 허용하는 순간
 * bag(가방)이 room(방)과 겹친다고 나온다.
 *
 * 뜻이 될 수 있는 글자(등=back, 도=degree, 만=bay)는 일부러 넣지 않았다.
 */
const KO_PARTICLES = new Set([
  '을', '를', '이', '가', '은', '는',
  '와', '과', '에', '의', '로', '서', '며', '랑', '및', '수',
]);

/** 두 뜻이 의미 토큰을 공유하는가 (예: "기르다" 공유 → true) */
export function hasMeaningOverlap(a: string, b: string): boolean {
  const ta = meaningTokens(a);
  if (ta.size === 0) return false;
  for (const tok of meaningTokens(b)) {
    if (ta.has(tok)) return true;
  }
  return false;
}
