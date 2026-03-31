'use client';

import { AnimatedSection } from './animated-section';

const curriculumData = [
  {
    title: '실시간 수업',
    shortDesc: '실시간 수업으로 학생의\n수업 참여도+ 집중력 UP',
    detailTitle: '실시간 수업으로 학생의\n수업 참여도+ 집중력 UP',
    detailDesc: '듣기만 하는 인강은 가라~ 인강은 귀찮기도 하고.. 자꾸 딴 생각이 나기도 하고... 선생님과 다른 학생들과의 실시간 수업은 그럴 시간이 없어요! 철저한 개념 이해를 위한 실시간 필기와 질문과 대답을 통한 소통이 수업의 몰입도를 올려 줍니다.',
    icon: '🎥',
  },
  {
    title: '1:1 피드백',
    shortDesc: '숙제와 오답 1:1 피드백으로\n진짜 영어실력을 올리세요!',
    detailTitle: '숙제와 오답 1:1 피드백\n으로 진짜 영어 실력을\n올리세요.',
    detailDesc: '매주 수업 후 내주는 숙제는 많은 부모님들이 정말 왜 올라영으로 문법이 끝날 수 있는지 알겠다고 입모아 말씀하세요. 게다가 오답은 피드백 설명이 제공됩니다. 다음 수업 전까지 오답 설명까지 완료! 아이들이 모르는 것을 다 해결하고 다음 수업을 들을 수 있어 수업의 효과를 최대로 끌어 올릴 수 있어요!',
    icon: '💡',
  },
  {
    title: '실력&점수 UP',
    shortDesc: '실력만큼 점수도 올리세요!',
    detailTitle: '실력만큼 점수도\n올리세요!',
    detailDesc: '실력은 올라갔다는데 점수는 안 오른다?? 실력만큼 내신 점수가 나오지 않는다면 안되겠죠? 올라영은 성취감에서 자신감이 나온다고 믿습니다. 한번이라도 점수가 오른 아이들은 눈빛이 다르거든요!',
    icon: '🏆',
  },
];

export function CurriculumSection() {
  return (
    <section className="py-24 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <AnimatedSection className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold text-[#1d1d1f] mb-5 tracking-tight">
            올라영만의<br className="md:hidden" />
            <span className="bg-gradient-to-r from-violet-600 to-purple-500 bg-clip-text text-transparent"> 특별한</span> 3가지
          </h2>
          <p className="text-[#86868b] text-lg max-w-xl mx-auto leading-relaxed">
            올라영이 특별한 이유, 직접 확인해보세요
          </p>
        </AnimatedSection>

        <div className="grid md:grid-cols-3 gap-8">
          {curriculumData.map((item, index) => (
            <AnimatedSection key={index} delay={index * 100}>
              <div className="group h-[480px] cursor-pointer" style={{ perspective: '1000px' }}>
                <div
                  className="relative w-full h-full transition-transform duration-700 ease-out group-hover:[transform:rotateY(180deg)]"
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  <div
                    className="absolute inset-0 bg-white rounded-[44px] p-8 flex flex-col items-center text-center justify-center"
                    style={{
                      backfaceVisibility: 'hidden',
                      boxShadow: '0 0 0 2px #1d1d1f, 0 0 0 6px #a1a1aa, 0 25px 50px -12px rgba(0,0,0,0.15)'
                    }}
                  >
                    <div className="text-[120px] mb-6 leading-none">{item.icon}</div>
                    <h3 className="text-4xl md:text-5xl font-black text-[#1d1d1f] mb-4 tracking-tight leading-tight">{item.title}</h3>
                    <p className="text-[#424245] text-xl md:text-2xl font-bold leading-snug px-2 whitespace-pre-line">{item.shortDesc}</p>
                  </div>
                  <div
                    className="absolute inset-0 bg-violet-50 rounded-[44px] p-6 md:p-8 flex flex-col justify-center"
                    style={{
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
                      boxShadow: '0 0 0 2px #1d1d1f, 0 0 0 6px #a1a1aa, 0 25px 50px -12px rgba(0,0,0,0.15)'
                    }}
                  >
                    <h4 className="text-2xl md:text-3xl font-black mb-4 leading-tight whitespace-pre-line text-[#424245]">{item.detailTitle}</h4>
                    <p className="text-[#424245] text-lg md:text-xl font-semibold leading-relaxed">{item.detailDesc}</p>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
