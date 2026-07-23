/**
 * 공유 링크에 날짜 버전 파라미터(v=YYYYMMDD)를 붙인다 — 카톡 미리보기 캐시 대응.
 *
 * 카카오는 URL 단위로 미리보기(OG)를 캐시하고 실패까지 오래 기억한다.
 * 배포가 갈리는 순간에 긁히면 "이미지 없음"이 캐시되어, 서버가 정상이어도
 * 그 링크는 계속 깨져 보인다 (2026-07-23 /allkill 사례). 날짜 버전을 붙이면
 * 날이 바뀔 때 새 URL로 인식되어 나쁜 캐시가 하루 안에 자가 치유되고,
 * 같은 날 복사본은 같은 URL이라 불필요한 재수집도 없다.
 */
export function withShareVersion(url: string): string {
  const now = new Date();
  const v = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  return `${url}${url.includes('?') ? '&' : '?'}v=${v}`;
}
