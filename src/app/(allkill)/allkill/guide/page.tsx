import type { Metadata } from 'next';
import GuideSection from '../_sections/GuideSection';

export const metadata: Metadata = {
  title: '올킬보카 이용 가이드 | 결제 후 시작하기',
  description: '올킬보카 결제 후 로그인부터 학습 시작까지, 4단계로 안내합니다.',
  robots: { index: false }, // 구매자 안내 페이지 — 검색 유입 불필요
};

/** 결제 완료자용 이용 안내 — 랜딩(판매 페이지)에서 분리해 이곳으로 이사 */
export default function AllkillGuidePage() {
  return <GuideSection />;
}
