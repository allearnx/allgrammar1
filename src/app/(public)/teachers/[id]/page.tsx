import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ConsultationLink from '@/components/public/consultation-link';
import { CATEGORY_LABELS, COURSE_COLUMNS, TEACHER_PROFILE_COLUMNS, formatPrice, type TeacherProfile, type Course } from '@/types/public';

/**
 * 색·타이포 규칙 = 올킬보카 랜딩 문법 (2026-07-27 사장님 확정):
 * 흰 바탕 + 구글 4색 포인트(파랑 도배 금지), 큰 CTA는 노랑 pill, 제목만 GmarketSans.
 * 목록 페이지(teachers/page.tsx)·커리큘럼 페이지와 동일 문법.
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
  red: '#D93025',
  redDark: '#A50E0E',
  redLight: '#FCE8E6',
};

// 강의 카테고리 태그 — 구글 4색 배분 (연한 배경 + 진한 글자, 배지 남발 대신 소형 태그)
function getCategoryTheme(category: string): { bg: string; text: string } {
  switch (category) {
    case 'grammar': return { bg: G.blueLight, text: G.blueDark };
    case 'school_exam': return { bg: G.greenLight, text: G.greenDark };
    case 'international': return { bg: G.yellowLight, text: G.yellowDark };
    case 'voca': return { bg: G.redLight, text: G.redDark };
    default: return { bg: '#F1F3F4', text: G.gray };
  }
}

export default async function TeacherDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: teacher } = await supabase
    .from('teacher_profiles')
    .select(TEACHER_PROFILE_COLUMNS)
    .eq('id', id)
    .eq('is_visible', true)
    .single();

  if (!teacher) notFound();

  const { data: courses } = await supabase
    .from('courses')
    .select(COURSE_COLUMNS)
    .eq('teacher_id', teacher.user_id)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  const t = teacher as TeacherProfile;
  const teacherCourses = (courses || []) as Course[];

  return (
    <>
      {/* 원비온다 패밀리 제목 폰트 — 올킬보카 랜딩과 동일 (본문은 Pretendard 유지) */}
      <style suppressHydrationWarning>{`
        @font-face {
          font-family: 'GmarketSans';
          font-weight: 700;
          src: url('/fonts/GmarketSansBold.woff') format('woff');
          font-display: swap;
        }
        @font-face {
          font-family: 'GmarketSans';
          font-weight: 500;
          src: url('/fonts/GmarketSansMedium.woff') format('woff');
          font-display: swap;
        }
        .tc-display { font-family: 'GmarketSans', 'Pretendard', sans-serif; font-weight: 700; letter-spacing: -0.5px; word-break: keep-all; }
        .tc-btn { display: inline-flex; align-items: center; justify-content: center; padding: 18px 44px; border-radius: 100px; font-size: 17px; font-weight: 800; text-decoration: none; transition: transform 0.15s; }
        .tc-btn:hover { transform: translateY(-2px); }
        .tc-btn-primary { background: ${G.yellow}; color: ${G.ink}; box-shadow: 0 6px 20px rgba(253,214,99,0.5); }
      `}</style>

      {/* 프로필 섹션 — 흰 바탕, 사진 카드 + 노랑 포인트 보더 */}
      <section className="pt-36 pb-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 items-center lg:items-start">
            <div className="flex-shrink-0">
              <div
                className="w-64 h-64 lg:w-80 lg:h-80 rounded-3xl overflow-hidden border"
                style={{ borderColor: G.line, borderBottom: `6px solid ${G.yellow}`, boxShadow: '0 10px 30px rgba(31,31,31,0.08)' }}
              >
                {t.image_url ? (
                  <img
                    src={t.image_url}
                    alt={t.display_name}
                    className="w-full h-full object-cover"
                    style={{ objectPosition: t.image_position || 'center' }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ background: '#F8F9FA' }}>
                    <svg className="w-32 h-32" style={{ color: G.line }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 text-center lg:text-left">
              <h1 className="tc-display text-4xl md:text-5xl mb-6" style={{ color: G.ink }}>
                {t.display_name}
                <span className="ml-2" style={{ color: G.blue }}>선생님</span>
              </h1>
              {t.bio && (
                <div className="rounded-2xl p-6 border bg-white text-left" style={{ borderColor: G.line }}>
                  <p className="text-lg leading-relaxed whitespace-pre-line" style={{ color: G.gray, wordBreak: 'keep-all' }}>{t.bio}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 담당 강의 */}
      {teacherCourses.length > 0 && (
        <section className="py-16 px-4" style={{ background: '#F8F9FA' }}>
          <div className="max-w-5xl mx-auto">
            <h2 className="tc-display text-3xl mb-8 text-center" style={{ color: G.ink }}>
              {t.display_name} 선생님의 <span style={{ color: G.blue }}>강의</span>
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {teacherCourses.map((course) => {
                const theme = getCategoryTheme(course.category);
                return (
                  <Link
                    key={course.id}
                    href={`/courses/detail/${course.id}`}
                    className="group flex bg-white rounded-2xl overflow-hidden border hover:-translate-y-1 transition-all duration-300"
                    style={{ borderColor: G.line, boxShadow: '0 4px 14px rgba(31,31,31,0.04)' }}
                  >
                    <div className="w-32 h-32 flex-shrink-0 relative overflow-hidden" style={{ background: '#F1F3F4' }}>
                      {course.thumbnail_url ? (
                        <img
                          src={course.thumbnail_url}
                          alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-10 h-10" style={{ color: G.line }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 p-4 flex flex-col justify-center">
                      <span className="self-start rounded-full px-2.5 py-0.5 text-xs font-extrabold mb-1.5" style={{ background: theme.bg, color: theme.text }}>
                        {CATEGORY_LABELS[course.category as keyof typeof CATEGORY_LABELS] || course.category}
                      </span>
                      <h3 className="text-lg font-bold line-clamp-1" style={{ color: G.ink }}>
                        {course.title}
                      </h3>
                      {course.description && (
                        <p className="text-sm mt-1 line-clamp-1" style={{ color: G.grayLight }}>{course.description}</p>
                      )}
                      <p className="text-lg font-bold mt-2" style={{ color: G.blue }}>
                        {formatPrice(course.price)}원
                      </p>
                    </div>
                    <div className="flex items-center px-4">
                      <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" style={{ color: G.grayLight }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* 최종 CTA — 올킬보카 FinalCta 문법: 파란 섹션 + 흰 GmarketSans 카피 + 노랑 버튼 */}
      <section className="py-24 px-4 text-center" style={{ background: G.blue }}>
        <div className="max-w-[640px] mx-auto">
          <h2 className="tc-display text-3xl md:text-5xl mb-4 text-white" style={{ lineHeight: 1.35, wordBreak: 'keep-all' }}>
            {t.display_name} 선생님과<br />함께 시작하세요
          </h2>
          <p className="text-base md:text-lg mb-10" style={{ color: 'rgba(255,255,255,0.8)' }}>
            무료 상담을 통해 맞춤 학습 플랜을 받아보세요
          </p>
          <ConsultationLink className="tc-btn tc-btn-primary">
            무료 상담 신청하기
          </ConsultationLink>
        </div>
      </section>
    </>
  );
}
