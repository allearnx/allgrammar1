import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import ConsultationLink from '@/components/public/consultation-link';
import {
  type CourseCategory,
  type Course,
  type TeacherProfile,
  CATEGORY_PAGE_CONFIG,
  CATEGORY_LABELS,
  formatPrice,
} from '@/types/public';
import PublicFooter from './footer';

export default async function CourseCategoryPage({ category }: { category: CourseCategory }) {
  const theme = CATEGORY_PAGE_CONFIG[category];
  const supabase = createAdminClient();

  const { data: courses, error } = await supabase
    .from('courses')
    .select('*')
    .eq('category', category)
    .eq('is_active', true)
    .order('sort_order');

  const courseList = (courses as Course[] | null) || [];

  // Fetch teacher profiles for courses that have teacher_id
  const teacherIds = [...new Set(courseList.map(c => c.teacher_id).filter(Boolean))] as string[];
  let teacherMap: Record<string, TeacherProfile> = {};
  if (teacherIds.length > 0) {
    const { data: teachers } = await supabase
      .from('teacher_profiles')
      .select('*')
      .in('user_id', teacherIds);
    if (teachers) {
      teacherMap = Object.fromEntries(
        (teachers as TeacherProfile[]).map(t => [t.user_id, t])
      );
    }
  }

  return (
    <>
      <section className={`pt-36 pb-16 px-4 bg-gradient-to-b ${theme.heroBgClass}`}>
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[#86868b] text-lg mb-4">{theme.englishTitle}</p>
          <h1 className="text-4xl md:text-6xl font-black text-[#1d1d1f] tracking-tight">
            <span className={`bg-gradient-to-r ${theme.heroTitleGradientClass} bg-clip-text text-transparent`}>
              {theme.highlightedTitle}
            </span>
            {theme.titleSuffix ?? ''}
          </h1>
          <p className="text-xl text-[#86868b] mt-6">{theme.description}</p>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          {error ? (
            <div className="text-center py-20">
              <h2 className="text-2xl font-bold text-[#1d1d1f] mb-2">오류가 발생했습니다</h2>
              <p className="text-[#86868b]">강의 목록을 불러오는데 실패했습니다.</p>
            </div>
          ) : courseList.length === 0 ? (
            <div className="text-center py-20">
              <div className={`inline-flex items-center justify-center w-20 h-20 ${theme.emptyBgClass} rounded-full mb-6`}>
                <svg className={`w-10 h-10 ${theme.emptyIconClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-[#1d1d1f] mb-2">준비 중인 강의입니다</h2>
              <p className="text-[#86868b]">곧 멋진 강의로 찾아뵙겠습니다!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-24">
              {courseList.map((course) => {
                const teacher = course.teacher_id ? teacherMap[course.teacher_id] : null;
                return (
                  <Link key={course.id} href={`/courses/detail/${course.id}`} className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                    <div className="aspect-[16/9] bg-gray-100 relative overflow-hidden">
                      {course.thumbnail_url ? (
                        <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                          <svg className="w-16 h-16 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                        </div>
                      )}
                      <div className="absolute top-3 left-3">
                        <span className={`px-3 py-1 ${theme.badgeColorClass} text-white text-xs font-bold rounded-full`}>
                          {CATEGORY_LABELS[course.category]}
                        </span>
                      </div>
                    </div>

                    <div className="p-5">
                      <h3 className={`text-xl font-bold text-[#1d1d1f] mb-4 transition-colors line-clamp-2 ${theme.cardHoverTextClass}`}>
                        {course.title}
                      </h3>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {teacher?.image_url ? (
                            <img
                              src={teacher.image_url}
                              alt={teacher.display_name}
                              className={`w-10 h-10 rounded-full object-cover border-2 ${theme.teacherBorderClass}`}
                              style={{ objectPosition: teacher.image_position || 'center' }}
                            />
                          ) : (
                            <div className={`w-10 h-10 rounded-full ${theme.teacherFallbackBgClass} flex items-center justify-center`}>
                              <svg className={`w-5 h-5 ${theme.teacherFallbackIconClass}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                          )}
                          <span className="text-base font-medium text-[#424245]">{teacher?.display_name || '담당 선생님'}</span>
                        </div>
                        <span className={`text-xl font-bold ${theme.priceColorClass}`}>{formatPrice(course.price)}원</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className={`py-16 px-4 ${theme.ctaBgClass}`}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-[#1d1d1f] mb-4">어떤 강의가 맞는지 모르겠다면?</h2>
          <p className="text-[#86868b] mb-6">무료 레벨테스트로 딱 맞는 강의를 추천받으세요!</p>
          <ConsultationLink
            className="inline-block px-8 py-4 text-lg font-bold text-white bg-gradient-to-r from-violet-400 to-purple-400 hover:from-violet-500 hover:to-purple-500 rounded-full transition-all shadow-lg shadow-violet-300/30"
          >
            무료 상담 신청하기
          </ConsultationLink>
        </div>
      </section>

      <PublicFooter />
    </>
  );
}
