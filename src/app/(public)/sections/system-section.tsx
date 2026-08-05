'use client';

import { AnimatedSection } from './animated-section';
import { G } from '../google-palette';

// 구 /about 페이지에서 이관한 "수업 이후 시스템" 콘텐츠 (랜딩과 겹치던 실시간 수업·숙제 피드백은 제외)
const systemFeatures = [
  {
    title: '수업 브리핑 자동 안내',
    description:
      '수업이 끝나면 오늘 배운 핵심 내용, 숙제, 다음 수업 안내가 학부모님께 자동으로 전달됩니다. 아이에게 "오늘 뭐 배웠어?"라고 물어볼 필요가 없어요.',
  },
  {
    title: '출석·학습 결과 누적 관리',
    description:
      '출석 기록, 숙제 완료율, 테스트 점수까지 모든 학습 데이터가 자동으로 쌓입니다. "열심히 했다"가 아니라 구체적인 숫자로 성장이 보입니다.',
  },
  {
    title: '월말 학습 리포트 자동 생성',
    description:
      '매월 말, 한 달간의 출석률·숙제 완료율·성적 변화 추이가 리포트로 정리됩니다. 한눈에 파악하고 다음 달 학습 방향을 잡을 수 있어요.',
  },
  {
    title: '정기 형성 평가 시행',
    description:
      '고등 내신 1등급, 수능 1등급 기준의 정기 평가로 현재 위치를 객관적으로 확인합니다. 목표까지 남은 거리에 맞춰 학습 방향을 정밀하게 조정합니다.',
  },
];

export function SystemSection() {
  return (
    // 커리큘럼(수업이 특별하다) 뒤에 이어지는 "수업 이후까지 관리된다" 섹션 — 시스템/기본 = 파랑
    <section className="py-24 px-4" style={{ background: G.surface }}>
      <div className="max-w-6xl mx-auto">
        <AnimatedSection className="text-center mb-16">
          <h2 className="brand-display text-4xl md:text-5xl font-bold mb-5 tracking-tight" style={{ color: G.ink, wordBreak: 'keep-all' }}>
            수업이 끝나도,<br className="md:hidden" />
            <span style={{ color: G.blue }}> 관리</span>는 계속됩니다
          </h2>
          <p className="text-lg max-w-xl mx-auto leading-relaxed" style={{ color: G.gray, wordBreak: 'keep-all' }}>
            수업 · 숙제 · 피드백 · 학습 기록이 하나의 시스템 안에서 연결됩니다
          </p>
        </AnimatedSection>

        <div className="grid md:grid-cols-2 gap-6">
          {systemFeatures.map((feature, index) => (
            <AnimatedSection key={feature.title} delay={index * 100}>
              <div
                className="h-full bg-white rounded-xl p-7 md:p-8"
                style={{
                  border: `1px solid ${G.line}`,
                  boxShadow: '0 1px 3px rgba(60,64,67,0.08)',
                }}
              >
                <div className="flex items-baseline gap-3 mb-4">
                  <span className="text-2xl font-extrabold tracking-tighter" style={{ color: G.blue, opacity: 0.45 }}>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <h3 className="text-xl font-extrabold" style={{ color: G.ink, wordBreak: 'keep-all' }}>
                    {feature.title}
                  </h3>
                </div>
                <p className="text-[15.5px] leading-[1.72]" style={{ color: G.gray, wordBreak: 'keep-all' }}>
                  {feature.description}
                </p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
