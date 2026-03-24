import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google';
import HeroSection from './_sections/HeroSection';
import WhyBentoSection from './_sections/WhyBentoSection';
import VocabSection from './_sections/VocabSection';
import FlowSection from './_sections/FlowSection';
import PersonaSection from './_sections/PersonaSection';
import StatsSection from './_sections/StatsSection';
import PricingSection from './_sections/PricingSection';
import GuideSection from './_sections/GuideSection';
import FinalCtaSection from './_sections/FinalCtaSection';
import { C } from './_data';

const montserrat = Montserrat({ weight: ['700', '900'], subsets: ['latin'], preload: false });

export const metadata: Metadata = {
  title: '올킬보카 | 수능 영어 단어, 이제 올킬',
  description: '7단계 학습 시스템으로 진짜 내 단어를 만드세요. AI 영작 채점, 학부모 리포트, 틀린 단어 집중 복습.',
};

export default function AllkillPage() {
  return (
    <>
      <style suppressHydrationWarning>{`
        .allkill-montserrat { font-family: var(--font-montserrat), sans-serif; }
        .allkill-pen { font-family: 'Nanum Pen Script', cursive; }

        /* 가격 카드 반응형 */
        .allkill-price-plan-label { font-size: 16px; font-weight: 700; margin-bottom: 12px; }
        .allkill-price-amount { font-size: 52px; font-weight: 900; margin-bottom: 6px; }
        .allkill-price-amount-unit { font-size: 20px; font-weight: 500; }
        .allkill-price-discount { font-size: 15px; margin-bottom: 18px; }
        .allkill-price-notice { font-size: 14px; line-height: 1.6; padding: 12px 16px; border-radius: 10px; margin-bottom: 22px; }
        .allkill-price-feature { font-size: 16px; }
        .allkill-price-btn { width: 100%; padding: 16px; border-radius: 12px; font-size: 16px; font-weight: 700; cursor: pointer; font-family: inherit; }
        .allkill-price-subtitle { font-size: 15px; margin-bottom: 28px; }
        @media (max-width: 768px) {
          .allkill-price-plan-label { font-size: 13px; }
          .allkill-price-amount { font-size: 36px; }
          .allkill-price-amount-unit { font-size: 15px; }
          .allkill-price-discount { font-size: 13px; }
          .allkill-price-notice { font-size: 12px; padding: 10px 14px; }
          .allkill-price-feature { font-size: 14px; }
          .allkill-price-btn { padding: 14px; font-size: 14px; }
          .allkill-price-subtitle { font-size: 13px; }
        }

        /* Bento 카드 반응형 */
        .allkill-bento-body { font-size: 15px; line-height: 1.75; }
        .allkill-bento-h3-lg { font-size: 24px; font-weight: 900; color: white; margin-bottom: 10px; }
        .allkill-bento-h3-md { font-size: 22px; font-weight: 900; color: white; margin-bottom: 10px; }
        .allkill-stat-label { font-size: 14px; letter-spacing: 0.3px; padding-top: 8px; border-top: 1px solid rgba(77,217,192,0.3); margin-top: 4px; white-space: nowrap; }
        @media (max-width: 768px) {
          .allkill-bento-body { font-size: 13px; }
          .allkill-bento-h3-lg { font-size: 19px; }
          .allkill-bento-h3-md { font-size: 17px; }
          .allkill-stat-label { font-size: 11px; }
        }

        /* 학부모/학생 카드 반응형 */
        .allkill-persona-tag { font-size: 13px; font-weight: 700; padding: 5px 14px; border-radius: 100px; display: inline-block; margin-bottom: 20px; }
        .allkill-persona-title { font-size: 26px; font-weight: 900; line-height: 1.4; margin-bottom: 12px; white-space: pre-line; }
        .allkill-persona-desc { font-size: 16px; line-height: 1.8; margin-bottom: 28px; white-space: pre-line; }
        .allkill-persona-point { font-size: 16px; }
        @media (max-width: 768px) {
          .allkill-persona-tag { font-size: 11px; padding: 4px 12px; }
          .allkill-persona-title { font-size: 20px; }
          .allkill-persona-desc { font-size: 14px; }
          .allkill-persona-point { font-size: 14px; }
        }

        /* 학습 흐름 카드 반응형 */
        .allkill-flow-num { width: 52px; height: 52px; font-size: 20px; }
        .allkill-flow-step-name { font-size: 18px; font-weight: 900; margin-bottom: 10px; white-space: nowrap; }
        .allkill-flow-pass { font-size: 13px; font-weight: 700; padding: 4px 12px; border-radius: 100px; display: inline-block; margin-bottom: 10px; }
        .allkill-flow-desc { font-size: 16px; line-height: 1.8; margin-top: 16px; padding-top: 16px; text-align: center; word-break: keep-all; }
        .allkill-flow-label-title { font-size: 22px; font-weight: 900; }
        .allkill-flow-round-badge { font-size: 18px; font-weight: 900; padding: 7px 20px; border-radius: 100px; }
        @media (max-width: 768px) {
          .allkill-flow-num { width: 40px; height: 40px; font-size: 15px; }
          .allkill-flow-step-name { font-size: 14px; }
          .allkill-flow-pass { font-size: 11px; padding: 3px 10px; }
          .allkill-flow-desc { font-size: 12px; }
          .allkill-flow-label-title { font-size: 17px; }
          .allkill-flow-round-badge { font-size: 14px; padding: 5px 14px; }
        }

        /* 수록 단어 — 비주얼 사이드 */
        .allkill-vocab-visual { display: flex; flex-direction: column; gap: 8px; flex-shrink: 0; }
        .allkill-vocab-pub-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; flex-shrink: 0; min-width: 200px; }
        @media (max-width: 768px) {
          .allkill-vocab-visual { display: none; }
          .allkill-vocab-pub-grid { display: none; }
        }

        /* 수록 단어 섹션 반응형 */
        .allkill-vocab-card-heading { font-size: 24px; font-weight: 700; color: white; }
        .allkill-vocab-badge { font-size: 16px; font-weight: 900; padding: 10px 22px; border-radius: 12px; }
        .allkill-vocab-chip { font-size: 15px; font-weight: 700; padding: 9px 22px; border-radius: 100px; white-space: nowrap; }
        .allkill-vocab-grade { font-size: 16px; font-weight: 900; min-width: 28px; }
        .allkill-vocab-years { font-size: 13px; white-space: nowrap; color: rgba(255,255,255,0.4); }
        .allkill-vocab-subtitle { font-size: 20px; font-weight: 700; color: white; margin-bottom: 8px; }
        .allkill-vocab-desc { font-size: 16px; color: rgba(255,255,255,0.5); line-height: 1.7; }

        .allkill-bento { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
        .allkill-bento-span2 { grid-column: span 2; }
        .allkill-bento-span3 { grid-column: span 3; }
        .allkill-bento-card { transition: transform 0.25s, border-color 0.25s; }
        .allkill-bento-card:hover { transform: translateY(-6px); }
        .allkill-flow-1 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
        .allkill-flow-2 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        .allkill-parent-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
        .allkill-stats-inner { display: flex; align-items: center; justify-content: space-between; gap: 40px; }
        .allkill-price-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; align-items: stretch; }
        @media (max-width: 1024px) { .allkill-price-grid { grid-template-columns: repeat(2, 1fr); } }
        .allkill-vocab-bottom { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }

        .allkill-card:hover { transform: translateY(-4px); box-shadow: 0 16px 48px rgba(167,139,250,0.12); }
        .allkill-price-card:hover { transform: translateY(-4px); }
        .allkill-stat-item:hover { background: rgba(255,255,255,0.08) !important; transform: translateY(-4px); }
        .allkill-flow-card:hover { border-color: #A78BFA !important; transform: translateY(-4px); }
        .allkill-btn-white:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(0,0,0,0.18); }

        @media (max-width: 768px) {
          .allkill-hero-title { font-size: 36px !important; line-height: 1.25 !important; }
          .allkill-hero-desc { font-size: 24px !important; line-height: 1.6 !important; }
          .allkill-section { padding: 56px 16px !important; }
          .allkill-vocab-card-heading { font-size: 16px; }
          .allkill-vocab-badge { font-size: 13px; padding: 7px 14px; }
          .allkill-vocab-chip { font-size: 12px; padding: 6px 12px; }
          .allkill-vocab-grade { font-size: 13px; min-width: 24px; }
          .allkill-vocab-years { font-size: 11px; }
          .allkill-vocab-subtitle { font-size: 15px; }
          .allkill-vocab-desc { font-size: 13px; }
          .allkill-bento { grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .allkill-bento-span2, .allkill-bento-span3 { grid-column: span 2; }
          .allkill-bento-card { padding: 24px 20px !important; border-radius: 18px !important; }
          .allkill-flow-1 { grid-template-columns: repeat(2, 1fr) !important; }
          .allkill-flow-2 { grid-template-columns: 1fr 1fr !important; }
          .allkill-parent-grid { grid-template-columns: 1fr; gap: 16px; }
          .allkill-stats-inner { flex-direction: column; align-items: flex-start; }
          .allkill-stats-nums { width: 100%; justify-content: space-between; gap: 10px; }
          .allkill-stat-item { padding: 20px 12px !important; flex: 1; }
          .allkill-stat-num { font-size: 28px !important; }
          .allkill-price-grid { grid-template-columns: 1fr; max-width: 100%; }
          .allkill-price-card { padding: 28px 20px !important; }
          .allkill-vocab-bottom { grid-template-columns: 1fr; }
          .allkill-vocab-bottom > div { padding: 24px 20px !important; }
          .allkill-round-label-desc { display: none; }
          .allkill-section-title { font-size: 26px !important; }
          .allkill-final-cta { padding: 64px 20px !important; }
          .allkill-final-cta h2 { font-size: 26px !important; }
          .allkill-stats-text h2 { font-size: 22px !important; }
          .allkill-persona-title { white-space: normal !important; font-size: 18px !important; }
          .allkill-persona-desc { white-space: normal !important; font-size: 13px !important; }
          .allkill-persona-card { padding: 28px 20px !important; }
          .allkill-flow-card { padding: 20px 14px !important; }
          .allkill-flow-desc { font-size: 12px !important; line-height: 1.65 !important; }
          .allkill-flow-step-name { white-space: normal !important; font-size: 14px !important; }
        }
        @media (max-width: 600px) {
          .allkill-bento { grid-template-columns: 1fr; }
          .allkill-bento-span2, .allkill-bento-span3 { grid-column: span 1; }
        }
        @media (max-width: 480px) {
          .allkill-hero-title { font-size: 28px !important; }
          .allkill-hero-desc { font-size: 20px !important; }
          .allkill-flow-1 { grid-template-columns: 1fr !important; }
          .allkill-flow-2 { grid-template-columns: 1fr !important; }
          .allkill-flow-round-badge { font-size: 13px !important; padding: 5px 12px !important; }
          .allkill-flow-label-title { font-size: 15px !important; }
        }
        @media (max-width: 768px) {
          .allkill-vocab-card { padding: 24px 20px !important; border-radius: 18px !important; }
          .allkill-hero-section { padding: 80px 16px 48px !important; }
          .allkill-stats-section { padding: 48px 16px !important; }
          .allkill-stat-item { min-width: 0 !important; }
          .allkill-bento-report { display: none !important; }
        }
      `}</style>

      <div style={{ fontFamily: "'Pretendard', sans-serif", background: '#ffffff', color: C.gray800, overflowX: 'hidden', ['--font-montserrat' as string]: montserrat.style.fontFamily }}>
        <HeroSection />
        <WhyBentoSection />
        <VocabSection />
        <FlowSection />
        <PersonaSection />
        <StatsSection />
        <PricingSection />
        <GuideSection />
        <FinalCtaSection />
      </div>
    </>
  );
}
