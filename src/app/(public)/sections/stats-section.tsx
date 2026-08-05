'use client';

import { AnimatedSection } from './animated-section';
import { G } from '../google-palette';

// 구 /about 페이지에서 이관한 성과 수치 — 성과 지표 = 초록
const achievements = [
  { number: '98%', label: '재원생 지필 시험 90점 이상' },
  { number: '97%', label: '재원생 성적 향상' },
  { number: '100%', label: '수행평가 포함 영어 A 달성 사례 다수' },
];

export function StatsSection() {
  return (
    <section className="py-24 px-4 bg-white">
      <div className="max-w-5xl mx-auto">
        <AnimatedSection className="text-center mb-16">
          <h2 className="brand-display text-4xl md:text-5xl font-bold mb-5 tracking-tight" style={{ color: G.ink, wordBreak: 'keep-all' }}>
            숫자로 증명된<br className="md:hidden" />
            <span style={{ color: G.green }}> 결과</span>
          </h2>
          <p className="text-lg max-w-xl mx-auto leading-relaxed" style={{ color: G.gray, wordBreak: 'keep-all' }}>
            공부를 더 시키는 것보다, 제대로 하게 만드는 시스템의 결과입니다
          </p>
        </AnimatedSection>

        <div className="grid md:grid-cols-3 gap-10 md:gap-8 mb-14">
          {achievements.map((item, index) => (
            <AnimatedSection key={item.number} delay={index * 100} className="text-center">
              <div className="brand-display text-6xl md:text-7xl font-bold tracking-tight mb-3" style={{ color: G.green }}>
                {item.number}
              </div>
              <p className="text-base md:text-lg" style={{ color: G.gray, wordBreak: 'keep-all' }}>
                {item.label}
              </p>
            </AnimatedSection>
          ))}
        </div>

        <AnimatedSection delay={300}>
          <p className="text-center text-base md:text-lg" style={{ color: G.grayLight, wordBreak: 'keep-all' }}>
            대치·강남은 물론 <strong style={{ color: G.gray }}>영재고·자사고·국제학교</strong> 학생들까지 검증된 결과입니다
          </p>
        </AnimatedSection>
      </div>
    </section>
  );
}
