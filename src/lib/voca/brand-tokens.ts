/**
 * 올킬보카 브랜드 색 토큰 — 서버/클라이언트 공용.
 *
 * ⚠️ 'use client' 파일(voca-brand.tsx)에서 상수를 export하면 서버 컴포넌트가
 * 임포트할 때 값이 아닌 클라이언트 참조가 되어 undefined로 렌더링된다
 * (학부모 리포트 히어로 배경이 사라졌던 원인). 상수는 여기(서버 안전)에 두고
 * voca-brand.tsx가 re-export한다.
 */

// 구글 4색 (allkill _data.ts C와 동일 계열)
export const VOCA_COLORS = {
  ink: '#1F1F1F',
  gray: '#3C4043',
  sky: '#DFEFFF',
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

// 학년 카드 등 순환용 구글 4색 테마
export const VOCA_STEP_THEMES = [
  { solid: '#1A73E8', bg: '#E8F0FE', text: '#174EA6' },
  { solid: '#D93025', bg: '#FCE8E6', text: '#A50E0E' },
  { solid: '#F9AB00', bg: '#FEF7E0', text: '#B06000' },
  { solid: '#188038', bg: '#E6F4EA', text: '#0D652D' },
] as const;
