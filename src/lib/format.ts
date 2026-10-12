/**
 * 표시용 포맷 헬퍼 — 날짜·파일 크기.
 * 화면마다 formatDate/formatFileSize를 따로 정의하던 것(7곳·3곳)을 한 곳으로 모음 (2026-10-12).
 */

export type DateStyle = 'short' | 'long' | 'datetime';

const DATE_OPTIONS: Record<DateStyle, Intl.DateTimeFormatOptions> = {
  /** 2026년 3월 5일 */
  short: { year: 'numeric', month: 'short', day: 'numeric' },
  /** 2026년 3월 5일 (month: long — ko 로캘에서는 short와 같게 보이지만 호출처 의도를 남겨 둠) */
  long: { year: 'numeric', month: 'long', day: 'numeric' },
  /** 2026. 03. 05. 오후 02:07 */
  datetime: { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' },
};

/** ISO 문자열을 한국어 날짜로. null/undefined/빈 문자열이면 '' */
export function formatDateKo(iso: string | null | undefined, style: DateStyle = 'short'): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('ko-KR', DATE_OPTIONS[style]);
}

/** 바이트 → "512 B" / "12.3 KB" / "4.0 MB" */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
