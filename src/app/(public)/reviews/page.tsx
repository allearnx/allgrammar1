import { createClient } from '@/lib/supabase/server';
import ConsultationLink from '@/components/public/consultation-link';
import type { Review } from '@/types/public';

export default async function ReviewsPage() {
  const supabase = await createClient();
  const { data: reviews } = await supabase
    .from('reviews')
    .select('*')
    .eq('is_visible', true)
    .order('display_order', { ascending: true });

  const filteredReviews = ((reviews || []) as Review[]).filter((r) => r.content);

  return (
    <>
      {/* 히어로 섹션 */}
      <section className="pt-32 pb-12 text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-800 mb-4">
            수강후기
          </h1>
          <p className="text-lg text-slate-600">
            올라영과 함께한 학생들의 생생한 후기를 확인해보세요
          </p>
        </div>
      </section>

      {/* 후기 카드 그리드 */}
      <section className="max-w-5xl mx-auto px-4 pb-20">
        {filteredReviews.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-violet-100 rounded-full mb-6">
              <svg className="w-10 h-10 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <p className="text-xl text-slate-600 font-medium mb-2">아직 등록된 후기가 없습니다</p>
            <p className="text-slate-400">곧 멋진 후기들이 올라올 예정이에요!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredReviews.map((review) => (
              <div key={review.id} className="group">
                <div className="bg-gradient-to-br from-violet-100/60 via-purple-50/40 to-pink-100/60 p-4 rounded-2xl hover:shadow-xl transition-all duration-300 h-full">
                  <div className="bg-white/80 backdrop-blur-xl rounded-xl p-6 shadow-lg border border-white/60 hover:bg-white/90 transition-all h-full flex flex-col">
                    {review.achievement && (
                      <div className="mb-4">
                        <p className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">
                          {review.achievement}
                        </p>
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="text-2xl text-violet-300 leading-none mb-2">&ldquo;</div>
                      <p className="text-slate-600 leading-relaxed">{review.content}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-100">
                      <span className="px-3 py-1.5 bg-violet-100/80 text-violet-700 rounded-full text-sm font-semibold">
                        {review.student_grade}
                      </span>
                      <span className="text-slate-500 text-sm">{review.course_name}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="bg-slate-100 py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-slate-800 mb-4">
            올라영과 함께 성장하세요
          </h2>
          <p className="text-slate-500 mb-8">
            지금 바로 상담 신청하고, 맞춤 학습 상담을 받아보세요
          </p>
          <ConsultationLink
            className="inline-flex items-center gap-2 px-8 py-4 bg-violet-500 hover:bg-violet-600 text-white font-bold rounded-full transition-colors shadow-lg"
          >
            무료 상담 신청하기
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </ConsultationLink>
        </div>
      </section>
    </>
  );
}
