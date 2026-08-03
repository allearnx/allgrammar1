'use client';

import { useState } from 'react';
import { AnimatedSection } from './animated-section';
import { G } from '../google-palette';

const curriculumData = [
  {
    label: 'LIVE',
    title: '실시간 수업',
    detailTitle: '실시간 수업으로 학생의 수업 참여도+ 집중력 UP',
    detailDesc: '듣기만 하는 인강은 가라~ 인강은 귀찮기도 하고.. 자꾸 딴 생각이 나기도 하고... 선생님과 다른 학생들과의 실시간 수업은 그럴 시간이 없어요! 철저한 개념 이해를 위한 실시간 필기와 질문과 대답을 통한 소통이 수업의 몰입도를 올려 줍니다.',
    accent: G.blue,
    accentText: G.blueDark,
    back: G.blueLight,
  },
  {
    label: '1:1 FEEDBACK',
    title: '숙제·오답\n피드백',
    detailTitle: '숙제와 오답 1:1 피드백으로 진짜 영어 실력을 올리세요.',
    detailDesc: '매주 수업 후 내주는 숙제는 많은 부모님들이 정말 왜 올라영으로 문법이 끝날 수 있는지 알겠다고 입모아 말씀하세요. 게다가 오답은 피드백 설명이 제공됩니다. 다음 수업 전까지 오답 설명까지 완료! 아이들이 모르는 것을 다 해결하고 다음 수업을 들을 수 있어 수업의 효과를 최대로 끌어 올릴 수 있어요!',
    accent: G.yellow,
    accentText: G.yellowDark,
    back: G.yellowLight,
  },
  {
    label: 'RESULT',
    title: '실력만큼\n점수도',
    detailTitle: '실력만큼 점수도 올리세요!',
    detailDesc: '실력은 올라갔다는데 점수는 안 오른다?? 실력만큼 내신 점수가 나오지 않는다면 안되겠죠? 올라영은 성취감에서 자신감이 나온다고 믿습니다. 한번이라도 점수가 오른 아이들은 눈빛이 다르거든요!',
    accent: G.green,
    accentText: G.greenDark,
    back: G.greenLight,
  },
];

export function CurriculumSection() {
  // 호버가 없는 터치 기기에서도 뒷면을 볼 수 있어야 한다 (탭하면 고정, 다시 탭하면 복귀)
  const [pinned, setPinned] = useState<number | null>(null);

  return (
    <section className="py-24 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <AnimatedSection className="text-center mb-16">
          <h2 className="brand-display text-4xl md:text-5xl font-bold mb-5 tracking-tight" style={{ color: G.ink }}>
            올라영만의<br className="md:hidden" />
            <span style={{ color: G.blue }}> 특별한</span> 3가지
          </h2>
          <p className="text-lg max-w-xl mx-auto leading-relaxed" style={{ color: G.gray }}>
            올라영이 특별한 이유, 직접 확인해보세요
          </p>
        </AnimatedSection>

        <div className="grid md:grid-cols-3 gap-8">
          {curriculumData.map((item, index) => {
            const isPinned = pinned === index;
            const toggle = () => setPinned(isPinned ? null : index);
            return (
              <AnimatedSection key={item.title} delay={index * 100}>
                <div
                  role="button"
                  tabIndex={0}
                  aria-expanded={isPinned}
                  onClick={toggle}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggle();
                    }
                  }}
                  /* 높이는 가장 좁아지는 md 3단(카드 224px)의 최장 카드 기준 — 여기서 터지면 다 터진다 */
                  className="group h-[520px] cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-offset-2 rounded-xl"
                  style={{ perspective: '1400px', ['--tw-ring-color' as string]: item.accent }}
                >
                  <div
                    className="relative w-full h-full transition-transform duration-700 ease-out group-hover:[transform:rotateY(180deg)]"
                    style={{
                      transformStyle: 'preserve-3d',
                      transform: isPinned ? 'rotateY(180deg)' : undefined,
                    }}
                  >
                    {/* 앞면 — 요약 없이 큰 제목만. 하단 "자세히 보기"가 뒷면의 존재를 알린다 */}
                    <div
                      className="absolute inset-0 bg-white rounded-xl p-6 flex flex-col"
                      style={{
                        backfaceVisibility: 'hidden',
                        border: `1px solid ${G.line}`,
                        borderTop: `6px solid ${item.accent}`,
                        boxShadow: '0 1px 3px rgba(60,64,67,0.12), 0 6px 16px -8px rgba(60,64,67,0.2)',
                      }}
                    >
                      <div className="text-[52px] font-extrabold leading-none tracking-tighter" style={{ color: item.accent, opacity: 0.22 }}>
                        {String(index + 1).padStart(2, '0')}
                      </div>
                      <div className="mt-3 text-[11px] font-extrabold tracking-[0.06em]" style={{ color: item.accentText }}>
                        {item.label}
                      </div>
                      <h3
                        className="brand-display text-[38px] font-bold leading-[1.18] tracking-tight mt-auto whitespace-pre-line"
                        style={{ color: G.ink, wordBreak: 'keep-all' }}
                      >
                        {item.title}
                      </h3>
                      <div
                        className="mt-[18px] pt-[14px] flex items-center gap-[7px] text-[13px] font-bold transition-colors"
                        style={{ borderTop: `1px dashed ${G.line}`, color: G.grayLight }}
                      >
                        <svg
                          className="transition-transform duration-500 ease-out group-hover:rotate-180"
                          width="15" height="15" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
                        >
                          <path d="M21 12a9 9 0 1 1-2.6-6.4" />
                          <polyline points="21 3 21 9 15 9" />
                        </svg>
                        자세히 보기
                      </div>
                    </div>

                    {/* 뒷면 */}
                    <div
                      /* 넓은 화면에서는 글이 짧아 아래가 크게 빈다 — 세로 가운데 정렬로 균형을 잡는다 */
                      className="absolute inset-0 rounded-xl p-6 flex flex-col justify-center"
                      style={{
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                        background: item.back,
                        border: `1px solid ${G.line}`,
                        borderTop: `6px solid ${item.accent}`,
                        boxShadow: '0 1px 3px rgba(60,64,67,0.12), 0 6px 16px -8px rgba(60,64,67,0.2)',
                      }}
                    >
                      <h4 className="text-xl font-extrabold leading-snug" style={{ color: item.accentText, wordBreak: 'keep-all' }}>
                        {item.detailTitle}
                      </h4>
                      <p className="mt-3 text-[15.5px] leading-[1.72]" style={{ color: G.gray, wordBreak: 'keep-all' }}>
                        {item.detailDesc}
                      </p>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            );
          })}
        </div>
      </div>
    </section>
  );
}
