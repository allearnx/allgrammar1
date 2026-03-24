'use client';

import { useState } from 'react';

const grammarCurriculum = [
  {
    level: '초등',
    color: 'bg-violet-400',
    gradeColor: 'bg-violet-100',
    courseBg: 'bg-violet-50/50',
    grades: [
      {
        grade: '초5~6',
        courses: [
          { name: '구해영 중학 영문법', detail: '레벨 0' },
          { name: '구해영 중학 영문법', detail: '레벨 1' },
        ],
      },
    ],
  },
  {
    level: '중등',
    color: 'bg-purple-500',
    gradeColor: 'bg-purple-100',
    courseBg: 'bg-purple-50/50',
    grades: [
      {
        grade: '중1',
        courses: [
          { name: '해커스 중학영문법', detail: '중1' },
          { name: '중학영문법 3800제', detail: '중1' },
        ],
      },
      {
        grade: '중2',
        courses: [
          { name: '해커스 중학영문법', detail: '중2' },
          { name: '중학영문법 3800제', detail: '중2' },
        ],
      },
      {
        grade: '중3',
        courses: [
          { name: '해커스 중학 영문법', detail: '중3' },
          { name: '중학영문법 3800제', detail: '중3' },
        ],
      },
    ],
  },
  {
    level: '고등',
    color: 'bg-indigo-500',
    gradeColor: 'bg-indigo-100',
    courseBg: 'bg-indigo-50/50',
    grades: [
      {
        grade: '고1',
        courses: [
          { name: 'Grammar Zone', detail: '고교 기본' },
          { name: 'Grammar Zone', detail: '고교 필수' },
        ],
      },
    ],
  },
];

const tabs = [
  { id: 'grammar', label: '문법', comingSoon: false },
  { id: 'vocabulary', label: '단어', comingSoon: true },
  { id: 'reading', label: '리딩', comingSoon: true },
];

export default function CurriculumPage() {
  const [activeTab, setActiveTab] = useState('grammar');

  return (
    <>
      {/* 히어로 섹션 */}
      <section className="pt-36 pb-8 px-4 bg-gradient-to-b from-violet-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-black text-[#1d1d1f] mb-6 tracking-tight">
            올라영 <span className="bg-gradient-to-r from-violet-600 via-purple-500 to-cyan-400 bg-clip-text text-transparent">커리큘럼</span>
          </h1>
          <p className="text-xl text-[#86868b] leading-relaxed">
            체계적인 단계별 학습으로 영어 실력을 완성하세요
          </p>
        </div>
      </section>

      {/* 탭 네비게이션 */}
      <section className="py-8 px-4 bg-white sticky top-20 z-40 border-b border-gray-100">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => !tab.comingSoon && setActiveTab(tab.id)}
                className={`px-6 py-3 rounded-full font-bold text-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-300/30'
                    : tab.comingSoon
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-100 text-[#424245] hover:bg-gray-200'
                }`}
                disabled={tab.comingSoon}
              >
                {tab.label}
                {tab.comingSoon && <span className="ml-2 text-xs">(준비중)</span>}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 문법 커리큘럼 */}
      {activeTab === 'grammar' && (
        <section className="py-16 px-4">
          <div className="max-w-[700px] mx-auto">
            <div className="text-center mb-12">
              <p className="text-[#86868b] text-lg mb-2">Grammar Curriculum</p>
              <h2 className="text-3xl md:text-4xl font-black text-[#1d1d1f] tracking-tight">
                문법 커리큘럼
              </h2>
            </div>

            <div className="rounded-3xl overflow-hidden border border-gray-200 shadow-lg">
              {grammarCurriculum.map((levelData) => (
                <div key={levelData.level} className="flex border-b border-gray-100 last:border-b-0">
                  <div className={`${levelData.color} text-white font-bold text-xl w-20 md:w-24 flex items-center justify-center`}>
                    {levelData.level}
                  </div>
                  <div className="flex-1">
                    {levelData.grades.map((gradeData, gradeIndex) => (
                      <div
                        key={gradeData.grade}
                        className={`flex ${gradeIndex !== levelData.grades.length - 1 ? 'border-b border-gray-100' : ''}`}
                      >
                        <div className={`${levelData.gradeColor} text-gray-700 font-bold text-lg w-20 md:w-28 flex items-center justify-center py-6`}>
                          {gradeData.grade}
                        </div>
                        <div className={`flex-1 ${levelData.courseBg}`}>
                          {gradeData.courses.map((course, courseIndex) => (
                            <div
                              key={`${course.name}-${course.detail}`}
                              className={`flex items-center px-6 py-5 ${courseIndex !== gradeData.courses.length - 1 ? 'border-b border-gray-50' : ''}`}
                            >
                              <div className="flex-1">
                                <p className="text-[#1d1d1f] font-medium text-lg">{course.name}</p>
                                <p className="text-violet-600 font-bold">{course.detail}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 문법 수업 특징 */}
          <div className="mt-32 px-4">
            <h3 className="text-3xl md:text-4xl font-black text-[#1d1d1f] text-center mb-12">
              올라영 문법 수업의 <span className="text-violet-600">특징</span>
            </h3>
            <div className="max-w-[1400px] mx-auto grid md:grid-cols-3 gap-6">
              <div className="bg-[#f5f5f7] rounded-3xl p-10 md:p-12">
                <h4 className="text-xl md:text-2xl font-bold text-[#1d1d1f] mb-4">단계별 체계적 학습</h4>
                <p className="text-[#86868b] text-base md:text-lg leading-relaxed">학년과 수준에 맞는 교재로 기초부터 심화까지</p>
              </div>
              <div className="bg-[#f5f5f7] rounded-3xl p-10 md:p-12">
                <h4 className="text-xl md:text-2xl font-bold text-[#1d1d1f] mb-4">검증된 베스트셀러 교재</h4>
                <p className="text-[#86868b] text-base md:text-lg leading-relaxed">구해영, 해커스, Grammar Zone 등 검증된 교재 사용</p>
              </div>
              <div className="bg-[#f5f5f7] rounded-3xl p-10 md:p-12">
                <h4 className="text-xl md:text-2xl font-bold text-[#1d1d1f] mb-4">내신 + 수능 동시 대비</h4>
                <p className="text-[#86868b] text-base md:text-lg leading-relaxed">개념 이해부터 문제 풀이 전략까지 균형있게</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Coming Soon */}
      {(activeTab === 'vocabulary' || activeTab === 'reading') && (
        <section className="py-32 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-[#1d1d1f] mb-4">준비 중입니다</h2>
            <p className="text-[#86868b]">곧 업데이트될 예정입니다!</p>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-20 px-4 bg-[#f5f5f7]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1d1d1f] mb-6">
            어떤 강의가 맞는지 모르겠다면?
          </h2>
          <p className="text-lg text-[#86868b] mb-8">
            무료 레벨테스트로 딱 맞는 강의를 추천받으세요!
          </p>
          <a
            href="/#consultation-form"
            className="inline-block px-8 py-4 text-lg font-bold text-white bg-gradient-to-r from-violet-400 to-purple-400 hover:from-violet-500 hover:to-purple-500 rounded-full transition-all shadow-lg shadow-violet-300/30"
          >
            무료 상담 신청하기
          </a>
        </div>
      </section>
    </>
  );
}
