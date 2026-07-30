import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import ConsultationLink from '@/components/public/consultation-link';
import { TEACHER_PROFILE_COLUMNS, type TeacherProfile } from '@/types/public';

/**
 * 색·타이포 규칙 = 올킬보카 랜딩 문법 (2026-07-27 사장님 확정):
 * 흰 바탕 + 구글 4색 포인트(파랑 도배 금지), 큰 CTA는 노랑 pill, 제목만 GmarketSans.
 * 배지·이모지 남발 금지 — 커리큘럼 페이지(curriculum/page.tsx)와 동일 문법.
 */
const G = {
  ink: '#1F1F1F',
  gray: '#3C4043',
  grayLight: '#9AA0A6',
  line: '#E8EAED',
  blue: '#1A73E8',
  blueLight: '#E8F0FE',
  yellow: '#FDD663',
  yellowLight: '#FEF7E0',
  greenLight: '#E6F4EA',
};

export default async function TeachersPage() {
  const supabase = await createClient();
  const { data: teachers } = await supabase
    .from('teacher_profiles')
    .select(TEACHER_PROFILE_COLUMNS)
    .eq('is_visible', true)
    .order('sort_order', { ascending: true });

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

      {/* 히어로 — 흰 바탕 + 은은한 대형 알파벳 포인트 (연한 4색, 히어로에만) */}
      <section className="relative overflow-hidden pt-36 pb-16 px-4 bg-white">
        <span aria-hidden className="tc-display absolute hidden md:block select-none" style={{ color: G.blueLight, fontSize: 190, lineHeight: 1, left: '5%', top: 70, transform: 'rotate(-8deg)' }}>T</span>
        <span aria-hidden className="tc-display absolute hidden md:block select-none" style={{ color: G.yellowLight, fontSize: 150, lineHeight: 1, right: '15%', top: 40, transform: 'rotate(10deg)' }}>e</span>
        <span aria-hidden className="tc-display absolute hidden md:block select-none" style={{ color: G.greenLight, fontSize: 170, lineHeight: 1, right: '4%', top: 130, transform: 'rotate(-4deg)' }}>a</span>
        <div className="relative max-w-4xl mx-auto text-center">
          <p className="text-lg mb-4" style={{ color: G.grayLight }}>Our Teachers</p>
          <h1 className="tc-display text-4xl md:text-6xl" style={{ color: G.ink }}>
            올라영 <span style={{ color: G.blue }}>선생님</span>
          </h1>
          <p className="text-xl mt-6" style={{ color: G.gray, wordBreak: 'keep-all' }}>
            학생의 성장을 함께하는 최고의 선생님들을 소개합니다
          </p>
        </div>
      </section>

      {/* 선생님 목록 */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          {!teachers || teachers.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6" style={{ background: '#F1F3F4' }}>
                <svg className="w-10 h-10" style={{ color: G.grayLight }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: G.ink }}>선생님 정보 준비 중</h2>
              <p style={{ color: G.grayLight }}>곧 멋진 선생님들을 소개해드릴게요!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {(teachers as TeacherProfile[]).map((teacher) => (
                <Link
                  key={teacher.id}
                  href={`/teachers/${teacher.id}`}
                  className="group bg-white rounded-3xl border overflow-hidden hover:-translate-y-1.5 transition-all duration-300"
                  style={{ borderColor: G.line, boxShadow: '0 4px 14px rgba(31,31,31,0.04)' }}
                >
                  <div className="aspect-[4/5] relative overflow-hidden" style={{ background: '#F8F9FA' }}>
                    {teacher.image_url ? (
                      <img
                        src={teacher.image_url}
                        alt={teacher.display_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        style={{ objectPosition: teacher.image_position || 'center' }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-32 h-32" style={{ color: G.line }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="p-6" style={{ borderTop: `4px solid ${G.yellow}` }}>
                    <h3 className="tc-display text-2xl transition-colors" style={{ color: G.ink }}>
                      {teacher.display_name}
                    </h3>
                    {teacher.bio && (
                      <p className="mt-3 line-clamp-2 leading-relaxed" style={{ color: G.gray, wordBreak: 'keep-all' }}>{teacher.bio}</p>
                    )}
                    <div className="mt-4 flex items-center font-bold text-sm" style={{ color: G.blue }}>
                      <span>프로필 보기</span>
                      <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 최종 CTA — 올킬보카 FinalCta 문법: 파란 섹션 + 흰 GmarketSans 카피 + 노랑 버튼 */}
      <section className="py-24 px-4 text-center" style={{ background: G.blue }}>
        <div className="max-w-[640px] mx-auto">
          <h2 className="tc-display text-3xl md:text-5xl mb-4 text-white" style={{ lineHeight: 1.35, wordBreak: 'keep-all' }}>
            올라영 선생님과<br />함께 시작하세요
          </h2>
          <p className="text-base md:text-lg mb-10" style={{ color: 'rgba(255,255,255,0.8)' }}>
            무료 상담을 통해 학생에게 맞는 선생님을 만나보세요
          </p>
          <ConsultationLink className="tc-btn tc-btn-primary">
            무료 상담 신청하기
          </ConsultationLink>
        </div>
      </section>
    </>
  );
}
