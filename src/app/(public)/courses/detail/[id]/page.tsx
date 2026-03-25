import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import ConsultationLink from '@/components/public/consultation-link';
import { CATEGORY_LABELS, formatPrice, type Course, type TeacherProfile } from '@/types/public';

function getCategoryColor(category: string) {
  switch (category) {
    case 'grammar': return 'bg-violet-500';
    case 'school_exam': return 'bg-emerald-500';
    case 'international': return 'bg-sky-500';
    case 'voca': return 'bg-rose-500';
    case 'reading': return 'bg-amber-500';
    default: return 'bg-slate-500';
  }
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: course } = await supabase
    .from('courses')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .single();

  if (!course) {
    notFound();
  }

  const c = course as unknown as Course;

  // Fetch teacher profile if teacher_id exists
  let teacher: TeacherProfile | null = null;
  if (c.teacher_id) {
    const { data } = await supabase
      .from('teacher_profiles')
      .select('*')
      .eq('user_id', c.teacher_id)
      .single();
    teacher = data as unknown as TeacherProfile | null;
  }

  const paymentUrl = `/payment?courseId=${c.id}&name=${encodeURIComponent(c.title)}&price=${c.price}`;

  return (
    <>
      {/* 헤더 섹션 */}
      <section className="pt-36 pb-12 px-4 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
            {/* 썸네일 */}
            <div className="lg:w-1/2">
              <div className="aspect-[16/9] bg-gray-100 rounded-2xl overflow-hidden shadow-lg">
                {c.thumbnail_url ? (
                  <img
                    src={c.thumbnail_url}
                    alt={c.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-100 to-purple-100">
                    <svg className="w-24 h-24 text-violet-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* 강의 정보 */}
            <div className="lg:w-1/2 flex flex-col">
              <div className="mb-4">
                <span className={`inline-block px-4 py-1.5 ${getCategoryColor(c.category)} text-white text-sm font-bold rounded-full`}>
                  {CATEGORY_LABELS[c.category]}
                </span>
              </div>

              <h1 className="text-3xl md:text-4xl font-black text-[#1d1d1f] mb-4">
                {c.title}
              </h1>

              {c.description && (
                <p className="text-lg text-[#424245] mb-6 leading-relaxed whitespace-pre-line">
                  {c.description}
                </p>
              )}

              <div className="mb-6">
                <p className="text-sm text-[#86868b] mb-1">수강료</p>
                <p className="text-3xl font-black text-violet-600">
                  {formatPrice(c.price)}
                  <span className="text-lg font-medium text-[#424245]">원</span>
                </p>
              </div>

              {teacher && (
                <div className="flex items-center gap-4 p-4 bg-white border-2 border-gray-100 rounded-2xl">
                  <div className="flex-shrink-0">
                    {teacher.image_url ? (
                      <img
                        src={teacher.image_url}
                        alt={teacher.display_name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-violet-100"
                        style={{ objectPosition: teacher.image_position || 'center' }}
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center border-2 border-violet-200">
                        <svg className="w-8 h-8 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-[#86868b]">담당 선생님</p>
                    <p className="text-xl font-bold text-[#1d1d1f]">
                      {teacher.display_name}
                    </p>
                    {teacher.bio && (
                      <p className="text-sm text-[#424245] line-clamp-1 mt-1">{teacher.bio}</p>
                    )}
                  </div>
                </div>
              )}

              {/* CTA 버튼 */}
              <div className="mt-6 space-y-3">
                <Link
                  href={paymentUrl}
                  className="block w-full py-4 text-center text-lg font-bold text-white bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 rounded-full transition-all shadow-lg shadow-violet-300/30"
                >
                  {formatPrice(c.price)}원 수강 신청하기
                </Link>
                <ConsultationLink
                  className="block w-full py-4 text-center text-lg font-bold text-violet-600 bg-white border-2 border-violet-200 hover:border-violet-400 hover:bg-violet-50 rounded-full transition-all"
                >
                  수강 상담 신청하기
                </ConsultationLink>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 상세 이미지 섹션 */}
      {c.detail_image_url && (
        <section className="py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-[#1d1d1f] mb-6 text-center">강의 상세 정보</h2>
            <div className="space-y-4">
              {(() => {
                try {
                  const urls = JSON.parse(c.detail_image_url);
                  if (Array.isArray(urls)) {
                    return urls.map((url: string, index: number) => (
                      <div key={index} className="rounded-2xl overflow-hidden shadow-lg border border-gray-100">
                        <img
                          src={url}
                          alt={`${c.title} 상세 정보 ${index + 1}`}
                          className="w-full"
                        />
                      </div>
                    ));
                  }
                } catch {
                  // single image
                }
                return (
                  <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-100">
                    <img
                      src={c.detail_image_url}
                      alt={`${c.title} 상세 정보`}
                      className="w-full"
                    />
                  </div>
                );
              })()}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16 px-4 bg-violet-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-[#1d1d1f] mb-4">
            이 강의에 관심이 있으신가요?
          </h2>
          <p className="text-[#86868b] mb-6">
            무료 상담을 통해 자세한 안내를 받아보세요!
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
