/**
 * 줄바꿈으로 구분된 정답 텍스트를 파싱한다.
 * (2), (3), (b), (c) 등 소문항 번호로 시작하는 줄은 이전 줄에 합친다.
 *
 * 예시 입력:
 *   3
 *   1
 *   (1) Tell me what you did yesterday.
 *   (2) This is not what I expected!
 *   5
 *
 * 결과: ["3", "1", "(1) Tell me what you did yesterday. (2) This is not what I expected!", "5"]
 */
export function parseAnswerLines(text: string): string[] {
  const lines = text.split('\n').map((s) => s.trim()).filter(Boolean);
  const result: string[] = [];

  for (const line of lines) {
    // (2)~(99), (b)~(z), (B)~(Z), ②~⑳ 로 시작하면 이전 답의 연속
    const isContinuation =
      /^\(([2-9]\d?|[b-zB-Z])\)/.test(line) ||
      /^[②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳]/.test(line);

    if (isContinuation && result.length > 0) {
      result[result.length - 1] += ' ' + line;
    } else {
      result.push(line);
    }
  }

  return result;
}
