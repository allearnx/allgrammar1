'use client';

import { useState } from 'react';
import Link from 'next/link';
import ConsultationLink from '@/components/public/consultation-link';
import { DIAGNOSTIC_LINEUP } from '@/lib/voca/diagnostic-lineup';

// 색 규칙: 올킬보카 구글 톤 (#1A73E8 블루 축, 보라 금지 — 2026-07-27 사장님 "보라색 싫어")
const grammarCurriculum = [
  {
    level: '초등',
    color: 'bg-[#669DF6]',
    gradeColor: 'bg-[#E8F0FE]',
    courseBg: 'bg-[#F8FBFF]',
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
    color: 'bg-[#1A73E8]',
    gradeColor: 'bg-[#E8F0FE]',
    courseBg: 'bg-[#F8FBFF]',
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
    color: 'bg-[#174EA6]',
    gradeColor: 'bg-[#E8F0FE]',
    courseBg: 'bg-[#F8FBFF]',
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
  { id: 'vocabulary', label: '단어', comingSoon: false },
  { id: 'reading', label: '리딩', comingSoon: true },
];

/**
 * 단어 커리큘럼 = 진단 결과의 교재 라인업(DIAGNOSTIC_LINEUP)과 한 소스.
 * 라인업이 바뀌면 여기도 자동 반영된다. 디자인은 올킬보카 구글 톤(#1A73E8, 보라 금지) —
 * 홍보 페이지 전체가 이 톤으로 전환 예정(2026-07-27 사장님 결정)이라 새 섹션부터 적용.
 */
const vocaBands = [
  { level: '중등', levelBg: '#1A73E8', columns: DIAGNOSTIC_LINEUP.filter((c) => c.key.startsWith('m')) },
  { level: '고등', levelBg: '#174EA6', columns: DIAGNOSTIC_LINEUP.filter((c) => c.key.startsWith('h')) },
];

export default function CurriculumPage() {
  const [activeTab, setActiveTab] = useState('grammar');

  return (
    <>
      {/* 히어로 섹션 */}
      <section className="pt-36 pb-8 px-4 bg-gradient-to-b from-[#E8F0FE] to-white">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-black text-[#1F1F1F] mb-6 tracking-tight">
            올라영 <span className="text-[#1A73E8]">커리큘럼</span>
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
                    ? 'bg-[#1A73E8] text-white shadow-lg shadow-blue-300/30'
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
                                <p className="text-[#1A73E8] font-bold">{course.detail}</p>
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
              올라영 문법 수업의 <span className="text-[#1A73E8]">특징</span>
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

      {/* 단어 커리큘럼 — 진단 교재 라인업과 동일 데이터, 올킬보카 구글 톤 */}
      {activeTab === 'vocabulary' && (
        <section className="py-16 px-4">
          <div className="max-w-[700px] mx-auto">
            <div className="text-center mb-12">
              <p className="text-[#86868b] text-lg mb-2">Vocabulary Curriculum</p>
              <h2 className="text-3xl md:text-4xl font-black text-[#1F1F1F] tracking-tight">
                단어 커리큘럼
              </h2>
              <p className="mt-4 text-[#3C4043]" style={{ wordBreak: 'keep-all' }}>
                시중 베스트셀러 교재 실명 그대로 — 내 시작 칸에서 한 칸씩 올라갑니다
              </p>
            </div>

            <div className="rounded-3xl overflow-hidden border border-[#E8EAED] shadow-lg">
              {vocaBands.map((band) => (
                <div key={band.level} className="flex border-b border-[#E8EAED] last:border-b-0">
                  <div
                    className="text-white font-bold text-xl w-20 md:w-24 flex items-center justify-center"
                    style={{ background: band.levelBg }}
                  >
                    {band.level}
                  </div>
                  <div className="flex-1">
                    {band.columns.map((column, colIndex) => (
                      <div
                        key={column.key}
                        className={`flex ${colIndex !== band.columns.length - 1 ? 'border-b border-[#E8EAED]' : ''}`}
                      >
                        <div className="bg-[#E8F0FE] text-[#174EA6] font-bold text-lg w-20 md:w-28 flex items-center justify-center py-6">
                          {column.gradeLabel}
                        </div>
                        <div className="flex-1 bg-white">
                          {column.bookTitles.map((title, bookIndex) => (
                            <div
                              key={title}
                              className={`flex items-center gap-3 px-6 py-4 ${bookIndex !== column.bookTitles.length - 1 ? 'border-b border-gray-50' : ''}`}
                            >
                              <p className="text-[#1F1F1F] font-medium text-base md:text-lg flex-1" style={{ wordBreak: 'keep-all' }}>
                                {title}
                              </p>
                              {bookIndex === 0 && (
                                <span className="shrink-0 rounded-full bg-[#E8F0FE] px-2.5 py-0.5 text-xs font-bold text-[#174EA6]">
                                  대표
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* 초등 칸은 기획상 없음 — 선행 긍정 프레임 안내 (천일문×중1 40%는 커버리지 분석 근거) */}
            <div className="mt-4 flex items-start gap-2 rounded-2xl bg-[#E8F0FE] px-5 py-4">
              <span className="text-lg">🎒</span>
              <p className="text-sm md:text-base text-[#3C4043] leading-relaxed" style={{ wordBreak: 'keep-all' }}>
                초등학생은 <b className="text-[#1F1F1F]">중1 교재(천일문 보카 중등 스타트)부터 선행</b>으로
                시작해요 — 이 교재에는 <b className="text-[#1A73E8]">중1 교과서 단어의 40%</b>가 담겨 있어요.
              </p>
            </div>

            {/* 진단 퍼널 연결 — 어느 칸에서 시작할지는 5분 진단이 정해준다 */}
            <div className="mt-10 text-center">
              <Link
                href="/level-test"
                className="inline-block rounded-full bg-[#1A73E8] px-8 py-4 text-lg font-bold text-white shadow-lg shadow-blue-300/30 transition-opacity hover:opacity-90"
              >
                5분 진단으로 내 시작 교재 찾기
              </Link>
              <p className="mt-3 text-sm text-[#86868b]">가입 없이 시작 · 결과에서 시작할 교재를 바로 추천해드려요</p>
            </div>
          </div>
        </section>
      )}

      {/* Coming Soon */}
      {activeTab === 'reading' && (
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
          <ConsultationLink
            className="inline-block px-8 py-4 text-lg font-bold text-white bg-[#1A73E8] hover:bg-[#174EA6] rounded-full transition-all shadow-lg shadow-blue-300/30"
          >
            무료 상담 신청하기
          </ConsultationLink>
        </div>
      </section>
    </>
  );
}
