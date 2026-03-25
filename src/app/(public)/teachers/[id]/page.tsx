import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ConsultationLink from '@/components/public/consultation-link';
import type { TeacherProfile, Course } from '@/types/public';
import { CATEGORY_LABELS, formatPrice } from '@/types/public';

function getCategoryColor(category: string) {
  switch (category) {
    case 'grammar': return 'bg-violet-500';
    case 'school_exam': return 'bg-emerald-500';
    case 'international': return 'bg-sky-500';
    case 'voca': return 'bg-rose-500';
    default: return 'bg-slate-500';
  }
}

export default async function TeacherDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: teacher } = await supabase
    .from('teacher_profiles')
    .select('*')
    .eq('id', id)
    .eq('is_visible', true)
    .single();

  if (!teacher) notFound();

  const { data: courses } = await supabase
    .from('courses')
    .select('*')
    .eq('teacher_id', teacher.user_id)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  const t = teacher as TeacherProfile;
  const teacherCourses = (courses || []) as Course[];

  return (
    <>
      {/* 프로필 섹션 */}
      <section className="pt-36 pb-16 px-4 bg-gradient-to-b from-violet-50 via-purple-50/50 to-white">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 items-center lg:items-start">
            <div className="flex-shrink-0">
              <div className="w-64 h-64 lg:w-80 lg:h-80 rounded-3xl overflow-hidden shadow-2xl shadow-violet-200/50 border-4 border-white">
                {t.image_url ? (
                  <img
                    src={t.image_url}
                    alt={t.display_name}
                    className="w-full h-full object-cover"
                    style={{ objectPosition: t.image_position || 'center' }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center">
                    <svg className="w-32 h-32 text-violet-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-4xl md:text-5xl font-black text-[#1d1d1f] mb-6">
                {t.display_name}
                <span className="text-violet-500 ml-2">선생님</span>
              </h1>
              {t.bio && (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-violet-100 shadow-lg">
                  <p className="text-lg text-[#424245] leading-relaxed whitespace-pre-line">{t.bio}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 담당 강의 */}
      {teacherCourses.length > 0 && (
        <section className="py-16 px-4 bg-[#f5f5f7]">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-black text-[#1d1d1f] mb-8 text-center">
              {t.display_name} 선생님의 <span className="text-violet-600">강의</span>
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {teacherCourses.map((course) => (
                <Link
                  key={course.id}
                  href={`/courses/detail/${course.id}`}
                  className="group flex bg-white rounded-2xl overflow-hidden border border-gray-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="w-32 h-32 flex-shrink-0 bg-gray-100 relative overflow-hidden">
                    {course.thumbnail_url ? (
                      <img
                        src={course.thumbnail_url}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-100 to-purple-100">
                        <svg className="w-10 h-10 text-violet-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute top-2 left-2">
                      <span className={`px-2 py-0.5 ${getCategoryColor(course.category)} text-white text-xs font-bold rounded`}>
                        {CATEGORY_LABELS[course.category as keyof typeof CATEGORY_LABELS] || course.category}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 p-4 flex flex-col justify-center">
                    <h3 className="text-lg font-bold text-[#1d1d1f] group-hover:text-violet-600 transition-colors line-clamp-1">
                      {course.title}
                    </h3>
                    {course.description && (
                      <p className="text-sm text-[#86868b] mt-1 line-clamp-1">{course.description}</p>
                    )}
                    <p className="text-lg font-bold text-violet-600 mt-2">
                      {formatPrice(course.price)}원
                    </p>
                  </div>
                  <div className="flex items-center px-4">
                    <svg className="w-5 h-5 text-[#86868b] group-hover:text-violet-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-[#1d1d1f] mb-4">
            {t.display_name} 선생님과 함께 시작하세요
          </h2>
          <p className="text-[#86868b] mb-6">
            무료 상담을 통해 맞춤 학습 플랜을 받아보세요!
          </p>
          <ConsultationLink
            className="inline-block px-8 py-4 text-lg font-bold text-white bg-gradient-to-r from-violet-400 to-purple-400 hover:from-violet-500 hover:to-purple-500 rounded-full transition-all shadow-lg shadow-violet-300/30"
          >
            무료 상담 신청하기
          </ConsultationLink>
        </div>
      </section>
    </>
  );
}
