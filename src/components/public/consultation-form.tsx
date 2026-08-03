'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import { GRADE_OPTIONS } from '@/types/public';
import type { Course } from '@/types/public';
import { G } from '@/app/(public)/google-palette';

/**
 * 랜딩 마지막 섹션이자 상담 모달의 내용물. 같은 컴포넌트를 두 곳에서 쓴다.
 * 랜딩에서는 파랑 전면 피날레(섹션 배경 리듬의 종착점), 모달에서는 배경 없이 폼만.
 */
export default function ConsultationForm({
  onSuccess,
  embedded = false,
}: { onSuccess?: () => void; embedded?: boolean } = {}) {
  const [studentName, setStudentName] = useState('');
  const [studentGrade, setStudentGrade] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [courses, setCourses] = useState<Pick<Course, 'id' | 'title'>[]>([]);
  const [coursesError, setCoursesError] = useState('');
  const [interestCourseIds, setInterestCourseIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const fetchCourses = async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title')
        .eq('is_active', true)
        .order('sort_order');
      if (error) {
        setCoursesError('강좌 목록을 불러올 수 없습니다.');
      } else {
        setCourses(data || []);
      }
    };
    fetchCourses();
  }, []);

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setParentPhone(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!studentName.trim()) {
      setError('학생 이름을 입력해주세요.');
      return;
    }
    if (!studentGrade) {
      setError('학년을 선택해주세요.');
      return;
    }
    const phoneNumbers = parentPhone.replace(/[^\d]/g, '');
    if (phoneNumbers.length < 10 || phoneNumbers.length > 11) {
      setError('올바른 연락처를 입력해주세요.');
      return;
    }
    if (interestCourseIds.length === 0) {
      setError('관심 있는 수업을 선택해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      await fetchWithToast('/api/public/consultations', {
        body: {
          student_name: studentName.trim(),
          grade: studentGrade,
          parent_phone: parentPhone,
          interest_course_ids: interestCourseIds,
        },
        silent: true,
      });

      setShowModal(true);
      setStudentName('');
      setStudentGrade('');
      setParentPhone('');
      setInterestCourseIds([]);
    } catch {
      setError('신청 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <section
        id="consultation-form"
        className={embedded ? '' : 'py-24 px-4'}
        style={embedded ? undefined : { background: G.blue }}
      >
        <div className="max-w-xl mx-auto">
          <div className={embedded ? 'text-center mb-8' : 'text-center mb-12'}>
            <h2
              className="brand-display text-4xl md:text-5xl font-bold mb-5 tracking-tight"
              style={{ color: embedded ? G.ink : '#fff', wordBreak: 'keep-all' }}
            >
              지금 바로<br className="md:hidden" />
              <span style={{ color: embedded ? G.blue : G.yellow }}> 상담 신청</span>하세요
            </h2>
            <p className="text-lg leading-relaxed" style={{ color: embedded ? G.gray : 'rgba(255,255,255,0.88)' }}>
              학생의 현재 상태를 남겨주시면,<br className="md:hidden" />
              전문 컨설턴트가 연락드립니다.
            </p>
          </div>

          <div
            className="rounded-3xl p-8 md:p-10 bg-white"
            style={{ border: `1px solid ${G.line}`, boxShadow: '0 10px 30px -12px rgba(32,33,36,0.25)' }}
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 학생 이름 */}
              <div>
                <label htmlFor="studentName" className="block text-sm font-bold text-slate-700 mb-2 tracking-tight">
                  학생 이름
                </label>
                <input
                  type="text"
                  id="studentName"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="예: 김철수"
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-brand-100 focus:border-brand-400 transition-all text-slate-800 placeholder:text-slate-400 font-medium bg-white/80"
                  disabled={isLoading}
                />
              </div>

              {/* 학년 선택 */}
              <div>
                <label htmlFor="studentGrade" className="block text-sm font-bold text-slate-700 mb-2 tracking-tight">
                  학년 선택
                </label>
                <select
                  id="studentGrade"
                  value={studentGrade}
                  onChange={(e) => setStudentGrade(e.target.value)}
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-brand-100 focus:border-brand-400 transition-all text-slate-800 bg-white/80 appearance-none cursor-pointer font-medium"
                  disabled={isLoading}
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%231a73e8' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 1.25rem center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '1.5em 1.5em',
                  }}
                >
                  <option value="" disabled>학년을 선택해주세요</option>
                  {GRADE_OPTIONS.map((grade) => (
                    <option key={grade.value} value={grade.value}>
                      {grade.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 학부모 연락처 */}
              <div>
                <label htmlFor="parentPhone" className="block text-sm font-bold text-slate-700 mb-2 tracking-tight">
                  학부모 연락처
                </label>
                <input
                  type="tel"
                  id="parentPhone"
                  value={parentPhone}
                  onChange={handlePhoneChange}
                  placeholder="010-0000-0000"
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-brand-100 focus:border-brand-400 transition-all text-slate-800 placeholder:text-slate-400 font-medium bg-white/80"
                  disabled={isLoading}
                  maxLength={13}
                />
                <p className="mt-2 text-sm text-slate-500">
                  입력하신 번호로 상담 안내 연락을 드립니다
                </p>
              </div>

              {/* 관심 있는 수업 */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 tracking-tight">
                  관심 있는 수업
                </label>
                {coursesError ? (
                  <div className="text-sm text-red-500">{coursesError}</div>
                ) : courses.length === 0 ? (
                  <div className="text-sm text-slate-500">불러오는 중...</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {courses.map((course) => (
                      <label
                        key={course.id}
                        className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-xl bg-white/80 cursor-pointer hover:border-brand-300"
                      >
                        <input
                          type="checkbox"
                          value={course.id}
                          checked={interestCourseIds.includes(course.id)}
                          onChange={(e) => {
                            const id = e.target.value;
                            setInterestCourseIds((prev) =>
                              e.target.checked ? [...prev, id] : prev.filter((item) => item !== id)
                            );
                          }}
                          disabled={isLoading}
                          className="h-4 w-4 accent-brand-600 border-gray-300 rounded"
                        />
                        <span className="text-sm text-slate-700">{course.title}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* 에러 메시지 */}
              {error && (
                <div className="p-4 bg-red-50 border-2 border-red-100 rounded-2xl">
                  <p className="text-sm text-red-600 font-medium">{error}</p>
                </div>
              )}

              {/* 신청 버튼 */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-5 text-lg font-extrabold rounded-full transition-transform duration-150 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                style={{ background: G.yellow, color: G.ink }}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-3">
                    <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    신청 중...
                  </span>
                ) : (
                  '무료 상담 신청하기'
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              신청 후 24시간 내 연락드립니다
            </p>
          </div>
        </div>
      </section>

      {/* 성공 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-3xl p-10 max-w-sm w-full shadow-2xl animate-[fadeIn_0.3s_ease-out]">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-6"
                style={{ background: G.greenLight }}>
                <svg className="w-10 h-10"
                  style={{ color: G.green }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900 mb-3 tracking-tight">
                신청 완료!
              </h3>
              <p className="text-slate-600 mb-8 leading-relaxed">
                빠른 시일 내에 연락드리겠습니다.<br />
                감사합니다.
              </p>
              <button
                onClick={() => setShowModal(false)}
                className="w-full py-4 bg-brand-600 hover:bg-brand-800 text-white font-bold rounded-full transition-colors"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
