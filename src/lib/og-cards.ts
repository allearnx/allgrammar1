/**
 * 링크 공유 카드(OG 이미지) 공용 상수 — 토큰 공유 페이지들의 generateMetadata에서 사용.
 * generateMetadata의 openGraph는 루트 파일 컨벤션 이미지를 상속하지 않으므로
 * (openGraph 필드 통째 교체) 명시적으로 images를 지정해야 한다.
 * 이미지 원본 재생성: 스크래치 logogen 스크립트 (opentype.js + sharp)
 */

export const ALLKILL_SLOGAN = '영어 단어, 알아서 전부 외워집니다';
export const OLLAYOUNG_SLOGAN = '영어 실력, 알아서 오릅니다';

/** 올킬보카 4색 워드마크 카드 (1200x630) */
export const ALLKILL_OG = {
  url: 'https://www.allrounderenglish.co.kr/og-allkill.png',
  width: 1200,
  height: 630,
  alt: `올킬보카 — ${ALLKILL_SLOGAN}`,
};

/** 올라영 로고 카드 (1200x630) */
export const OLLAYOUNG_OG = {
  url: 'https://www.allrounderenglish.co.kr/og-ollayoung.png',
  width: 1200,
  height: 630,
  alt: `올라영 — ${OLLAYOUNG_SLOGAN}`,
};
