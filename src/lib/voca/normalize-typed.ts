/**
 * 학생이 직접 타이핑한 답안의 채점용 정규화.
 *
 * 배경: 아이폰 스마트 문장부호가 '(직선)를 U+2019(곱슬)로 자동 변환해
 * "praise to one's face"를 맞게 쳐도 오답 처리됨 (능률중등고난도 Day9, 2026-08-02).
 * 내신 쪽 normalize-answer.ts(0d424e5)와 같은 계열의 수정 — 보카 채점 전 지점 공용.
 *
 * 대소문자·앞뒤/중복 공백 무시 + 유니코드 문장부호를 ASCII로 통일:
 * - 곡선 작은따옴표(U+2018/2019/02BC, 백틱, 어큐트) → '
 * - 곡선 큰따옴표(U+201C/201D) → "
 * - 엔대시/엠대시/마이너스(U+2013/2014/2212) → -
 * - 특수 공백(NBSP, U+2000~200B, 전각 공백) → 일반 공백
 */
export function normalizeTyped(s: string): string {
  return s
    .replace(/[‘’ʼ`´]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—−]/g, '-')
    .replace(/[  -​　]/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}
