'use client';

import { useState } from 'react';
import Link from 'next/link';
import ConsultationLink from '@/components/public/consultation-link';
import { DIAGNOSTIC_LINEUP } from '@/lib/voca/diagnostic-lineup';

/**
 * 색·타이포 규칙 = 올킬보카 랜딩 문법 (2026-07-27 사장님 확정):
 * 흰 바탕 + 구글 4색 포인트(파랑 도배 금지), 큰 CTA는 노랑 pill, 제목만 GmarketSans.
 * 배지·이모지 남발 금지 — 표와 타이포로 승부 ("AI 같다" 피드백).
 */
const G = {
  ink: '#1F1F1F',
  gray: '#3C4043',
  grayLight: '#9AA0A6',
  line: '#E8EAED',
  blue: '#1A73E8',
  blueDark: '#174EA6',
  blueLight: '#E8F0FE',
  yellow: '#FDD663',
  yellowDark: '#B06000',
  yellowLight: '#FEF7E0',
  green: '#188038',
  greenDark: '#0D652D',
  greenLight: '#E6F4EA',
};

interface LevelTheme {
  solid: string;
  solidText: string;
  light: string;
  lightText: string;
}

// 학교급 색 = 구글 4색 배분: 초등 노랑 / 중등 파랑 / 고등 초록 (문법·단어 공통)
const LEVEL_THEMES: Record<string, LevelTheme> = {
  초등: { solid: G.yellow, solidText: G.ink, light: G.yellowLight, lightText: G.yellowDark },
  중등: { solid: G.blue, solidText: 'white', light: G.blueLight, lightText: G.blueDark },
  고등: { solid: G.green, solidText: 'white', light: G.greenLight, lightText: G.greenDark },
};

const grammarCurriculum = [
  {
    level: '초등',
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

// 단어 커리큘럼 = 진단 결과의 교재 라인업(DIAGNOSTIC_LINEUP)과 한 소스 — 라인업 변경 시 자동 반영
const vocaBands = [
  { level: '중등', columns: DIAGNOSTIC_LINEUP.filter((c) => c.key.startsWith('m')) },
  { level: '고등', columns: DIAGNOSTIC_LINEUP.filter((c) => c.key.startsWith('h')) },
];

const tabs = [
  { id: 'grammar', label: '문법', comingSoon: false },
  { id: 'vocabulary', label: '단어', comingSoon: false },
  { id: 'reading', label: '리딩', comingSoon: true },
];

export default function CurriculumPage() {
  const [activeTab, setActiveTab] = useState('grammar');

  return (
    <>
      {/* 제목 폰트 GmarketSans의 @font-face는 globals.css에 전역 선언 — 여기선 페이지 전용 클래스만 */}
      <style suppressHydrationWarning>{`
        .cr-display { font-family: 'GmarketSans', 'Pretendard', sans-serif; font-weight: 700; letter-spacing: -0.5px; word-break: keep-all; }
        .cr-btn { display: inline-flex; align-items: center; justify-content: center; padding: 18px 44px; border-radius: 100px; font-size: 17px; font-weight: 800; text-decoration: none; transition: transform 0.15s; }
        .cr-btn:hover { transform: translateY(-2px); }
        .cr-btn-primary { background: ${G.yellow}; color: ${G.ink}; box-shadow: 0 6px 20px rgba(253,214,99,0.5); }
        .cr-btn-ghost { background: white; color: ${G.ink}; border: 1.5px solid ${G.line}; }
      `}</style>

      {/* 히어로 — 흰 바탕 + 은은한 대형 알파벳 포인트 (전면 패턴 대신 히어로에만, 연한 4색) */}
      <section className="relative overflow-hidden pt-36 pb-10 px-4 bg-white">
        <span aria-hidden className="cr-display absolute hidden md:block select-none" style={{ color: G.blueLight, fontSize: 200, lineHeight: 1, left: '4%', top: 60, transform: 'rotate(-8deg)' }}>A</span>
        <span aria-hidden className="cr-display absolute hidden md:block select-none" style={{ color: G.yellowLight, fontSize: 150, lineHeight: 1, right: '14%', top: 40, transform: 'rotate(10deg)' }}>b</span>
        <span aria-hidden className="cr-display absolute hidden md:block select-none" style={{ color: G.greenLight, fontSize: 170, lineHeight: 1, right: '3%', top: 130, transform: 'rotate(-4deg)' }}>Z</span>
        <div className="relative max-w-4xl mx-auto text-center">
          <h1 className="cr-display text-4xl md:text-6xl mb-6" style={{ color: G.ink }}>
            올라영 <span style={{ color: G.blue }}>커리큘럼</span>
          </h1>
          <p className="text-xl" style={{ color: G.gray }}>
            체계적인 단계별 학습으로 영어 실력을 완성하세요
          </p>
        </div>
      </section>

      {/* 탭 네비게이션 */}
      <section className="py-8 px-4 bg-white sticky top-20 z-40 border-b" style={{ borderColor: G.line }}>
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => !tab.comingSoon && setActiveTab(tab.id)}
                className="px-6 py-3 rounded-full font-bold text-lg transition-all"
                style={
                  activeTab === tab.id
                    ? { background: G.blue, color: 'white' }
                    : tab.comingSoon
                    ? { background: '#F1F3F4', color: G.grayLight, cursor: 'not-allowed' }
                    : { background: '#F1F3F4', color: G.gray }
                }
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
        <section className="py-16 px-4 bg-white">
          <div className="max-w-[700px] mx-auto">
            <div className="text-center mb-12">
              <p className="text-lg mb-2" style={{ color: G.grayLight }}>Grammar Curriculum</p>
              <h2 className="cr-display text-3xl md:text-4xl" style={{ color: G.ink }}>
                문법 커리큘럼
              </h2>
            </div>

            <div className="rounded-3xl overflow-hidden border" style={{ borderColor: G.line }}>
              {grammarCurriculum.map((levelData) => {
                const theme = LEVEL_THEMES[levelData.level];
                return (
                  <div key={levelData.level} className="flex border-b last:border-b-0" style={{ borderColor: G.line }}>
                    <div
                      className="cr-display text-xl w-20 md:w-24 flex items-center justify-center"
                      style={{ background: theme.solid, color: theme.solidText }}
                    >
                      {levelData.level}
                    </div>
                    <div className="flex-1">
                      {levelData.grades.map((gradeData, gradeIndex) => (
                        <div
                          key={gradeData.grade}
                          className={gradeIndex !== levelData.grades.length - 1 ? 'flex border-b' : 'flex'}
                          style={{ borderColor: G.line }}
                        >
                          <div
                            className="font-bold text-lg w-20 md:w-28 flex items-center justify-center py-6"
                            style={{ background: theme.light, color: theme.lightText }}
                          >
                            {gradeData.grade}
                          </div>
                          <div className="flex-1 bg-white">
                            {gradeData.courses.map((course, courseIndex) => (
                              <div
                                key={`${course.name}-${course.detail}`}
                                className="flex items-center px-6 py-5"
                                style={courseIndex !== gradeData.courses.length - 1 ? { borderBottom: `1px solid #F8F9FA` } : undefined}
                              >
                                <div className="flex-1">
                                  <p className="font-medium text-lg" style={{ color: G.ink }}>{course.name}</p>
                                  <p className="font-bold" style={{ color: theme.lightText }}>{course.detail}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </section>
      )}

      {/* 문법 수업 특징 — 올킬보카 차별점 카드 문법: 하늘 배경 + 흰 카드 + 색 상단 보더 + 태그 */}
      {activeTab === 'grammar' && (
        <section className="py-24 px-4" style={{ background: '#DFEFFF' }}>
          <div className="max-w-[1080px] mx-auto">
            <h3 className="cr-display text-3xl md:text-4xl text-center mb-12" style={{ color: G.ink }}>
              올라영 문법 수업의 <span style={{ color: G.blue }}>특징</span>
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  tag: '단계별',
                  title: '단계별 체계적 학습',
                  body: '학년과 수준에 맞는 교재로 기초부터 심화까지 빈틈없이 올라가요.',
                  solid: G.blue, bg: G.blueLight, text: G.blueDark,
                },
                {
                  tag: '검증된 교재',
                  title: '베스트셀러 교재만',
                  body: '구해영, 해커스, Grammar Zone — 서점에서 검증된 교재로 수업해요.',
                  solid: '#D93025', bg: '#FCE8E6', text: '#A50E0E',
                },
                {
                  tag: '실전',
                  title: '내신 + 수능 동시 대비',
                  body: '개념 이해부터 문제 풀이 전략까지 균형 있게 잡아요.',
                  solid: G.green, bg: G.greenLight, text: G.greenDark,
                },
              ].map((card) => (
                <div
                  key={card.tag}
                  className="flex flex-col items-start rounded-3xl bg-white p-8 md:p-10"
                  style={{ borderTop: `6px solid ${card.solid}`, boxShadow: '0 10px 30px rgba(31,31,31,0.06)' }}
                >
                  <span className="rounded-full px-4 py-1.5 text-sm font-extrabold" style={{ background: card.bg, color: card.text }}>
                    {card.tag}
                  </span>
                  <h4 className="cr-display mt-5 mb-3 text-xl md:text-2xl" style={{ color: G.ink }}>{card.title}</h4>
                  <p className="text-base leading-relaxed" style={{ color: G.gray, wordBreak: 'keep-all' }}>{card.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 단어 커리큘럼 — 진단 교재 라인업과 동일 데이터 */}
      {activeTab === 'vocabulary' && (
        <section className="py-16 px-4 bg-white">
          <div className="max-w-[700px] mx-auto">
            <div className="text-center mb-12">
              <p className="text-lg mb-2" style={{ color: G.grayLight }}>Vocabulary Curriculum</p>
              <h2 className="cr-display text-3xl md:text-4xl" style={{ color: G.ink }}>
                단어 커리큘럼
              </h2>
              <p className="mt-4" style={{ color: G.gray, wordBreak: 'keep-all' }}>
                시중 베스트셀러 교재 실명 그대로 — 내 시작 칸에서 한 칸씩 올라갑니다
              </p>
            </div>

            <div className="rounded-3xl overflow-hidden border" style={{ borderColor: G.line }}>
              {vocaBands.map((band) => {
                const theme = LEVEL_THEMES[band.level];
                return (
                  <div key={band.level} className="flex border-b last:border-b-0" style={{ borderColor: G.line }}>
                    <div
                      className="cr-display text-xl w-20 md:w-24 flex items-center justify-center"
                      style={{ background: theme.solid, color: theme.solidText }}
                    >
                      {band.level}
                    </div>
                    <div className="flex-1">
                      {band.columns.map((column, colIndex) => (
                        <div
                          key={column.key}
                          className={colIndex !== band.columns.length - 1 ? 'flex border-b' : 'flex'}
                          style={{ borderColor: G.line }}
                        >
                          <div
                            className="font-bold text-lg w-20 md:w-28 flex items-center justify-center py-6"
                            style={{ background: theme.light, color: theme.lightText }}
                          >
                            {column.gradeLabel}
                          </div>
                          <div className="flex-1 bg-white">
                            {column.bookTitles.map((title, bookIndex) => (
                              <div
                                key={title}
                                className="flex items-baseline gap-3 px-6 py-4"
                                style={bookIndex !== column.bookTitles.length - 1 ? { borderBottom: '1px solid #F8F9FA' } : undefined}
                              >
                                <p
                                  className={bookIndex === 0 ? 'font-bold text-base md:text-lg flex-1' : 'font-medium text-base md:text-lg flex-1'}
                                  style={{ color: G.ink, wordBreak: 'keep-all' }}
                                >
                                  {title}
                                </p>
                                {bookIndex === 0 && (
                                  <span className="shrink-0 text-sm font-bold" style={{ color: theme.lightText }}>대표</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 초등 칸은 기획상 없음 — 선행 긍정 프레임 (천일문×중1 40% = 교과서 단어 교차 분석 근거) */}
            <p
              className="mt-6 pl-4 text-sm md:text-base leading-relaxed"
              style={{ borderLeft: `3px solid ${G.yellow}`, color: G.gray, wordBreak: 'keep-all' }}
            >
              초등학생은 <b style={{ color: G.ink }}>중1 교재(천일문 보카 중등 스타트)부터 선행</b>으로 시작해요.
              이 교재에는 <b style={{ color: G.blue }}>중1 교과서 단어의 40%</b>가 담겨 있어요.
            </p>

            {/* 진단 퍼널 연결 — 어느 칸에서 시작할지는 5분 진단이 정해준다 */}
            <div className="mt-12 text-center">
              <Link href="/level-test" className="cr-btn cr-btn-primary">
                5분 진단으로 내 시작 교재 찾기
              </Link>
              <p className="mt-4 text-sm" style={{ color: G.grayLight }}>
                가입 없이 시작 · 결과에서 시작할 교재를 바로 추천해드려요
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Coming Soon */}
      {activeTab === 'reading' && (
        <section className="py-32 px-4 bg-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4" style={{ color: G.ink }}>준비 중입니다</h2>
            <p style={{ color: G.grayLight }}>곧 업데이트될 예정입니다!</p>
          </div>
        </section>
      )}

      {/* 최종 CTA — 올킬보카 FinalCta 문법: 파란 섹션 + 흰 GmarketSans 카피 + 노랑 버튼 */}
      <section className="py-24 px-4 text-center" style={{ background: G.blue }}>
        <div className="max-w-[640px] mx-auto">
          <h2 className="cr-display text-3xl md:text-5xl mb-4 text-white" style={{ lineHeight: 1.35, wordBreak: 'keep-all' }}>
            어떤 강의가 맞는지<br />모르겠다면?
          </h2>
          <p className="text-base md:text-lg mb-10" style={{ color: 'rgba(255,255,255,0.8)' }}>
            무료 레벨테스트로 딱 맞는 강의를 추천받으세요
          </p>
          <div className="flex flex-wrap justify-center gap-3.5">
            <Link
              href="/level-test"
              className="cr-btn"
              style={{ background: 'rgba(255,255,255,0.14)', color: 'white', border: '1.5px solid rgba(255,255,255,0.4)' }}
            >
              5분 단어 진단
            </Link>
            <ConsultationLink className="cr-btn cr-btn-primary">
              무료 상담 신청하기
            </ConsultationLink>
          </div>
        </div>
      </section>
    </>
  );
}
