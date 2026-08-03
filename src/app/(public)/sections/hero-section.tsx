'use client';

import Image from 'next/image';
import { AnimatedSection } from './animated-section';
import { G } from '../google-palette';

export function HeroSection({ onScrollToForm }: { onScrollToForm: () => void }) {
  return (
    <>
      <section className="relative bg-white pt-32 overflow-hidden flex items-end">
        {/* 대형 알파벳 포인트 — 배경 전면 패턴 대신 히어로에만, 연한 4색. 모바일에선 숨긴다. */}
        <span aria-hidden className="brand-display absolute hidden md:block select-none pointer-events-none"
          style={{ color: G.blueLight, fontSize: 200, lineHeight: 1, left: '1%', top: 56, transform: 'rotate(-8deg)' }}>A</span>
        <span aria-hidden className="brand-display absolute hidden md:block select-none pointer-events-none"
          style={{ color: G.yellowLight, fontSize: 150, lineHeight: 1, left: '27%', top: 26, transform: 'rotate(9deg)' }}>b</span>
        <span aria-hidden className="brand-display absolute hidden lg:block select-none pointer-events-none"
          style={{ color: G.greenLight, fontSize: 170, lineHeight: 1, left: '47%', top: 74, transform: 'rotate(-4deg)' }}>Z</span>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 w-full">
          <div className="flex flex-col lg:flex-row items-end gap-12 lg:gap-16">
            <div className="flex-[3] text-center lg:text-left self-center pb-4">
              <AnimatedSection>
                <p className="text-lg sm:text-xl lg:text-2xl font-medium tracking-tight mb-6" style={{ color: G.grayLight }}>
                  특목고 입시 전문 · 25년 입시 노하우
                </p>
              </AnimatedSection>
              <AnimatedSection delay={100}>
                {/* 그라데이션 대신 먹색 — 파랑은 마침표 하나로만 (파랑 도배 금지) */}
                <h1 className="brand-display text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-8" style={{ color: G.ink }}>
                  중3까지 영어를<br />끝내보세요<span style={{ color: G.blue }}>.</span>
                </h1>
              </AnimatedSection>
              <AnimatedSection delay={150}>
                <p className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight mb-4" style={{ color: G.ink }}>
                  내신 1등급, 수능 1등급. 대학이 바뀝니다.
                </p>
              </AnimatedSection>
              <AnimatedSection delay={250}>
                <p className="text-base sm:text-lg lg:text-xl tracking-tight" style={{ color: G.gray }}>
                  내 아이의 빈틈을 시스템으로 메우세요.
                </p>
              </AnimatedSection>
              <AnimatedSection delay={300}>
                <button
                  onClick={onScrollToForm}
                  className="mt-8 inline-flex items-center justify-center rounded-full px-9 py-4 text-lg font-extrabold transition-transform duration-150 hover:-translate-y-0.5"
                  style={{ background: G.yellow, color: G.ink }}
                >
                  상담 신청하기
                </button>
              </AnimatedSection>
            </div>
            <AnimatedSection delay={200} className="flex-[2] flex justify-center lg:justify-end">
              <div className="w-full max-w-md lg:max-w-lg">
                <Image
                  src="/hero-teacher.png"
                  alt="올라운더 영어 선생님"
                  width={600}
                  height={750}
                  className="w-full h-auto object-cover"
                  priority
                />
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* 플로팅 상담 버튼 — 히어로의 노랑 CTA와 경쟁하지 않도록 흰 바탕 + 먹색 테두리로 절제 */}
      <button
        onClick={onScrollToForm}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-6 py-4 bg-white font-bold rounded-full border transition-colors duration-200"
        style={{ color: G.ink, borderColor: G.ink, boxShadow: '0 2px 10px rgba(32,33,36,0.14)' }}
        aria-label="상담 신청하기"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <span className="hidden sm:inline">상담 신청</span>
      </button>
    </>
  );
}
