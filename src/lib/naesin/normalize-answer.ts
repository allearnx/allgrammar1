/** 정규화: 대소문자 무시, 앞뒤 공백, 끝 마침표, 연속 공백 → 단일 공백 */
export function normalize(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\.+\s*$/, '')
    .replace(/\s+/g, ' ');
}
