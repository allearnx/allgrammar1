'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookA, BookMarked, Loader2, ChevronDown } from 'lucide-react';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import { JoinAcademyForm } from './join-academy-form';
import { AuthBrandBg } from '@/components/auth/auth-brand-bg';
import { formatPrice } from '@/types/public';

type FreeService = 'voca' | 'naesin';

const SERVICE_OPTIONS: {
  value: FreeService;
  label: string;
  desc: string;
  icon: React.ReactNode;
  activeColor: string;
}[] = [
  {
    value: 'voca',
    label: '올킬보카',
    desc: '가입 후 7일 무료 체험 · 교과서·모의고사 기출 단어',
    icon: <BookA className="h-6 w-6" style={{ color: '#1A73E8' }} />,
    activeColor: 'border-[#1A73E8] bg-[#E8F0FE]',
  },
  {
    value: 'naesin',
    label: '올인내신',
    desc: '첫 단원 무료 체험 (어휘·지문·대화문 암기)',
    icon: <BookMarked className="h-6 w-6" style={{ color: '#188038' }} />,
    activeColor: 'border-[#188038] bg-[#E6F4EA]',
  },
];

interface CourseItem {
  id: string;
  title: string;
  category: string;
  price: number;
  description: string;
}

interface IndependentStudentScreenProps {
  userName: string;
  courses: CourseItem[];
  isAcademy?: boolean;
}

const CATEGORY_ICON: Record<string, React.ReactNode> = {
  voca: <BookA className="h-5 w-5 text-brand-500" />,
  school_exam: <BookMarked className="h-5 w-5 text-emerald-500" />,
};

const CATEGORY_STYLE: Record<string, { border: string; bg: string; badge: string }> = {
  voca: {
    border: 'border-brand-200 hover:border-brand-400',
    bg: 'bg-brand-50',
    badge: 'bg-brand-100 text-brand-700',
  },
  school_exam: {
    border: 'border-emerald-200 hover:border-emerald-400',
    bg: 'bg-emerald-50',
    badge: 'bg-emerald-100 text-emerald-700',
  },
};

const CATEGORY_LABEL: Record<string, string> = {
  voca: '올킬보카',
  school_exam: '올인내신',
};

export function IndependentStudentScreen({ userName, courses, isAcademy = false }: IndependentStudentScreenProps) {
  const router = useRouter();
  const [starting, setStarting] = useState<FreeService | null>(null);
  const [error, setError] = useState('');
  const [moreOpen, setMoreOpen] = useState(false);

  // 무료로 들어온 학생이라 별도 확인 버튼 없이 — 서비스 카드를 누르면 바로 시작
  async function startService(service: FreeService) {
    if (starting) return;
    setStarting(service);
    setError('');
    try {
      await fetchWithToast('/api/student/select-free-service', {
        body: { service },
        silent: true,
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '네트워크 오류가 발생했습니다.');
      setStarting(null);
    }
  }

  return (
    <div className="relative min-h-[calc(100vh-56px)] overflow-hidden" style={{ background: '#DFEFFF' }}>
      <AuthBrandBg />

      <div className="relative z-10 max-w-lg mx-auto px-4 py-12 space-y-6">
        {/* Welcome — 히어로 */}
        <div className="text-center">
          <h1 className="auth-display text-2xl md:text-3xl text-[#1F1F1F]" style={{ fontWeight: 700 }}>
            환영합니다, {userName}님! 🎉
          </h1>
          <p className="auth-display mt-2 text-[#3C4043]" style={{ fontWeight: 500 }}>
            지금 바로 <b style={{ color: '#1A73E8' }}>무료 체험</b>을 시작하세요
          </p>
        </div>

        {/* 주 액션: 무료 체험 서비스 선택 */}
        <div className="rounded-3xl bg-white p-7 border border-gray-200/60 shadow-xl shadow-[#1A73E8]/5">
          <h2 className="auth-display text-center text-lg text-[#1F1F1F]" style={{ fontWeight: 700 }}>
            어떤 학습부터 시작할까요?
          </h2>
          <p className="text-center text-sm text-[#3C4043] mt-1 mb-5">
            누르면 바로 시작해요. 나머지도 사이드 메뉴에서 언제든 체험할 수 있어요.
          </p>

          <div className="grid grid-cols-2 gap-3">
            {SERVICE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => startService(opt.value)}
                disabled={!!starting}
                className={`group relative flex flex-col items-center gap-2 rounded-2xl border-2 p-5 text-center transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed ${
                  starting === opt.value ? opt.activeColor : 'border-gray-200 hover:border-gray-300 disabled:opacity-60'
                }`}
              >
                {starting === opt.value ? (
                  <Loader2 className="h-6 w-6 animate-spin" style={{ color: opt.value === 'voca' ? '#1A73E8' : '#188038' }} />
                ) : (
                  opt.icon
                )}
                <span className="text-sm font-bold text-[#1F1F1F]">{opt.label}</span>
                <span className="text-xs text-[#3C4043] leading-relaxed">{opt.desc}</span>
                <span
                  className="mt-1 text-xs font-bold"
                  style={{ color: opt.value === 'voca' ? '#1A73E8' : '#188038' }}
                >
                  {starting === opt.value ? '시작하는 중…' : '바로 시작 →'}
                </span>
              </button>
            ))}
          </div>

          {error && <p className="text-sm text-[#D93025] text-center mt-4">{error}</p>}
        </div>

        {/* 부가 옵션(독립 학생만): 학원 합류 · 유료 코스 — 접어서 하단에 */}
        {!isAcademy && (
          <div className="pt-2">
            <button
              onClick={() => setMoreOpen((v) => !v)}
              className="mx-auto flex items-center gap-1.5 text-sm font-medium text-[#3C4043] hover:text-[#1A73E8] transition-colors"
            >
              학원 코드가 있거나 유료로 시작하시겠어요?
              <ChevronDown className={`h-4 w-4 transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
            </button>

            {moreOpen && (
              <div className="mt-5 space-y-5">
                {/* 학원 합류 */}
                <div className="rounded-2xl bg-white/80 p-5 border border-gray-200/60">
                  <JoinAcademyForm compact />
                </div>

                {/* 유료 코스 */}
                {courses.length > 0 && (
                  <div className="rounded-2xl bg-white/80 p-5 border border-gray-200/60">
                    <p className="text-sm font-bold text-[#1F1F1F] mb-3">유료 코스로 바로 시작</p>
                    <div className="grid gap-2.5">
                      {courses.map((course) => {
                        const style = CATEGORY_STYLE[course.category] ?? {
                          border: 'border-gray-200 hover:border-gray-400',
                          bg: 'bg-gray-50',
                          badge: 'bg-gray-100 text-gray-700',
                        };
                        const icon = CATEGORY_ICON[course.category] ?? (
                          <BookA className="h-5 w-5 text-gray-500" />
                        );
                        const label = CATEGORY_LABEL[course.category] ?? course.category;
                        const paymentUrl = `/payment?courseId=${course.id}&name=${encodeURIComponent(course.title)}&price=${course.price}`;

                        return (
                          <Link key={course.id} href={paymentUrl}>
                            <div className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${style.border}`}>
                              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${style.bg}`}>
                                {icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-sm text-gray-900 truncate">{course.title}</span>
                                  <span className={`shrink-0 text-[10px] font-medium rounded-full px-2 py-0.5 ${style.badge}`}>{label}</span>
                                </div>
                              </div>
                              <span className="shrink-0 text-sm font-bold text-gray-900">{formatPrice(course.price)}원</span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                    <p className="text-center text-xs text-gray-400 mt-3">결제 후 해당 서비스가 자동으로 활성화됩니다.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
