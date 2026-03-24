import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import type { TeacherProfile } from '@/types/public';

export default async function TeachersPage() {
  const supabase = await createClient();
  const { data: teachers } = await supabase
    .from('teacher_profiles')
    .select('*')
    .eq('is_visible', true)
    .order('sort_order', { ascending: true });

  return (
    <>
      {/* 히어로 섹션 */}
      <section className="pt-36 pb-16 px-4 bg-gradient-to-b from-violet-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[#86868b] text-lg mb-4">Our Teachers</p>
          <h1 className="text-4xl md:text-6xl font-black text-[#1d1d1f] tracking-tight">
            <span className="bg-gradient-to-r from-violet-600 via-purple-500 to-cyan-400 bg-clip-text text-transparent">올라영</span> 선생님
          </h1>
          <p className="text-xl text-[#86868b] mt-6">
            학생의 성장을 함께하는 최고의 선생님들을 소개합니다
          </p>
        </div>
      </section>

      {/* 선생님 목록 */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          {!teachers || teachers.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-violet-100 rounded-full mb-6">
                <svg className="w-10 h-10 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-[#1d1d1f] mb-2">선생님 정보 준비 중</h2>
              <p className="text-[#86868b]">곧 멋진 선생님들을 소개해드릴게요!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {(teachers as TeacherProfile[]).map((teacher) => (
                <Link
                  key={teacher.id}
                  href={`/teachers/${teacher.id}`}
                  className="group bg-white rounded-3xl border border-gray-100 overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-300"
                >
                  <div className="aspect-[4/5] bg-gradient-to-br from-violet-100 via-purple-50 to-cyan-50 relative overflow-hidden">
                    {teacher.image_url ? (
                      <img
                        src={teacher.image_url}
                        alt={teacher.display_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        style={{ objectPosition: teacher.image_position || 'center' }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-32 h-32 text-violet-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <div className="p-6">
                    <h3 className="text-2xl font-black text-[#1d1d1f] group-hover:text-violet-600 transition-colors">
                      {teacher.display_name}
                    </h3>
                    {teacher.bio && (
                      <p className="text-[#86868b] mt-3 line-clamp-2 leading-relaxed">{teacher.bio}</p>
                    )}
                    <div className="mt-4 flex items-center text-violet-500 font-medium text-sm group-hover:text-violet-600">
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

      {/* CTA */}
      <section className="py-16 px-4 bg-violet-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-[#1d1d1f] mb-4">
            올라영 선생님과 함께 시작하세요
          </h2>
          <p className="text-[#86868b] mb-6">
            무료 상담을 통해 학생에게 맞는 선생님을 만나보세요!
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
