// youtu.be/ID, watch?v=ID, embed/ID, shorts/ID, live/ID 모두 지원.
// id는 영숫자·_·- 11자만 캡처(뒤의 ?si=, &t= 등 추적/타임스탬프 파라미터 제외).
export function extractVideoId(url: string): string | null {
  if (!url) return null;
  const match = url.match(
    /(?:youtu\.be\/|\/embed\/|\/shorts\/|\/live\/|[?&]v=)([A-Za-z0-9_-]{11})/
  );
  return match ? match[1] : null;
}
