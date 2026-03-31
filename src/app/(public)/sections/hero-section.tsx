'use client';

import Image from 'next/image';
import { AnimatedSection } from './animated-section';

export function HeroSection({ onScrollToForm }: { onScrollToForm: () => void }) {
  return (
    <>
      <section className="relative min-h-[70vh] bg-white pt-32 overflow-hidden flex items-end">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 w-full">
          <div className="flex flex-col lg:flex-row items-end gap-12 lg:gap-16">
            <div className="flex-[3] text-center lg:text-left self-center pb-12">
              <AnimatedSection>
                <p className="text-[#86868b] text-2xl sm:text-3xl lg:text-4xl font-medium tracking-tight mb-8">
                  온라인 실시간 수업
                </p>
              </AnimatedSection>
              <AnimatedSection delay={100}>
                <h1 className="text-5xl sm:text-6xl lg:text-8xl font-bold tracking-tight mb-10">
                  <span className="bg-gradient-to-r from-violet-600 via-purple-500 to-cyan-400 bg-clip-text text-transparent">
                    성적의 한계를<br />뛰어넘다.
                  </span>
                </h1>
              </AnimatedSection>
              <AnimatedSection delay={150}>
                <p className="text-[#1d1d1f] text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight">
                  영어, 이제는 온라인에서 끝내세요.
                </p>
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

      {/* 플로팅 상담 버튼 */}
      <button
        onClick={onScrollToForm}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-6 py-4 bg-gradient-to-r from-violet-400 to-purple-400 hover:from-violet-500 hover:to-purple-500 text-white font-bold rounded-2xl shadow-2xl shadow-violet-300/40 hover:shadow-violet-400/50 transition-all duration-300 hover:scale-105"
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
