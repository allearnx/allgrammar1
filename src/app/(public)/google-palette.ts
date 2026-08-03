/**
 * 홍보 페이지 공용 색 — 올킬보카 랜딩 문법 (2026-07-27 사장님 확정).
 *
 * 흰 바탕 + 구글 4색 포인트(파랑 도배 금지), 큰 CTA는 노랑 pill, 제목만 GmarketSans.
 * 배지·이모지 남발 금지 — 표와 타이포로 승부 ("AI 같다" 피드백).
 *
 * 색은 "예뻐서"가 아니라 "뜻이 있어서" 붙인다:
 *   파랑 = 중등·기본 링크 / 초록 = 고등·성과 지표 / 노랑 = 초등·주요 CTA / 빨강 = 경고·한정 안내
 */
export const G = {
  ink: '#1F1F1F',
  gray: '#3C4043',
  grayLight: '#9AA0A6',
  line: '#E8EAED',
  /** 섹션 배경 교차 리듬용 연회색 — 흰 바탕 사이에 넣어 밋밋함을 끊는다 */
  surface: '#F8F9FA',
  blue: '#1A73E8',
  blueDark: '#174EA6',
  blueLight: '#E8F0FE',
  yellow: '#FDD663',
  yellowDark: '#B06000',
  yellowLight: '#FEF7E0',
  green: '#188038',
  greenDark: '#0D652D',
  greenLight: '#E6F4EA',
  red: '#D93025',
  redLight: '#FCE8E6',
} as const;
