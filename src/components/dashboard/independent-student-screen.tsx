'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookA, BookMarked, ShoppingCart, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { JoinAcademyForm } from './join-academy-form';
import { formatPrice } from '@/types/public';

function Divider() {
  return (
    <div className="relative">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-200" />
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="bg-white px-3 text-gray-400">또는</span>
      </div>
    </div>
  );
}

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
    desc: '1회독 단어 학습',
    icon: <BookA className="h-6 w-6 text-violet-500" />,
    activeColor: 'border-violet-500 bg-violet-50',
  },
  {
    value: 'naesin',
    label: '올인내신',
    desc: '단어암기 + 교과서암기',
    icon: <BookMarked className="h-6 w-6 text-emerald-500" />,
    activeColor: 'border-emerald-500 bg-emerald-50',
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
}

const CATEGORY_ICON: Record<string, React.ReactNode> = {
  voca: <BookA className="h-5 w-5 text-violet-500" />,
  school_exam: <BookMarked className="h-5 w-5 text-emerald-500" />,
};

const CATEGORY_STYLE: Record<string, { border: string; bg: string; badge: string }> = {
  voca: {
    border: 'border-violet-200 hover:border-violet-400',
    bg: 'bg-violet-50',
    badge: 'bg-violet-100 text-violet-700',
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

export function IndependentStudentScreen({ userName, courses }: IndependentStudentScreenProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<FreeService>('voca');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSelectService() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/student/select-free-service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service: selected }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || '서비스 선택에 실패했습니다.');
        return;
      }
      router.refresh();
    } catch {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-56px)] bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* Welcome */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            환영합니다, {userName}님!
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            무료 서비스를 선택하여 학습을 시작하세요.
          </p>
        </div>

        {/* Section 1: Free Service Selection */}
        <Card>
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-lg">무료 서비스 선택</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              아래 서비스 중 하나를 선택하세요.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {SERVICE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 cursor-pointer transition-all ${
                    selected === opt.value ? opt.activeColor : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="freeService"
                    value={opt.value}
                    checked={selected === opt.value}
                    onChange={() => setSelected(opt.value)}
                    className="sr-only"
                  />
                  {opt.icon}
                  <span className="text-sm font-semibold">{opt.label}</span>
                  <span className="text-xs text-muted-foreground text-center">{opt.desc}</span>
                </label>
              ))}
            </div>

            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}

            <Button
              className="w-full"
              onClick={handleSelectService}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  선택 중...
                </>
              ) : (
                '시작하기'
              )}
            </Button>
          </CardContent>
        </Card>

        <Divider />

        {/* Section 2: Join Academy */}
        <JoinAcademyForm compact />

        <Divider />

        {/* Section 3: Course Purchase */}
        <Card>
          <CardHeader className="text-center pb-4">
            <div className="mx-auto rounded-full bg-amber-100 p-3 mb-2">
              <ShoppingCart className="h-6 w-6 text-amber-600" />
            </div>
            <CardTitle className="text-lg">개인 코스 구매</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              학원 없이 직접 코스를 구매하여 바로 학습할 수 있어요.
            </p>
          </CardHeader>
          <CardContent>
            {courses.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-4">
                현재 구매 가능한 코스가 없습니다.
              </p>
            ) : (
              <div className="grid gap-3">
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
                      <div
                        className={`flex items-center gap-4 rounded-xl border p-4 transition-colors ${style.border}`}
                      >
                        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${style.bg}`}>
                          {icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-gray-900 truncate">
                              {course.title}
                            </span>
                            <span className={`shrink-0 text-[10px] font-medium rounded-full px-2 py-0.5 ${style.badge}`}>
                              {label}
                            </span>
                          </div>
                          {course.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                              {course.description}
                            </p>
                          )}
                        </div>
                        <div className="shrink-0 text-right">
                          <span className="text-sm font-bold text-gray-900">
                            {formatPrice(course.price)}원
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Help text */}
        <p className="text-center text-xs text-gray-400">
          결제 후 해당 서비스가 자동으로 활성화됩니다.
        </p>
      </div>
    </div>
  );
}
