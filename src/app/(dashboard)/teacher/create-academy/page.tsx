'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Building2, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

type FreeService = 'naesin' | 'voca';

const SERVICE_OPTIONS: { value: FreeService; label: string; desc: string; activeColor: string }[] = [
  { value: 'naesin', label: '올인내신', desc: '단어암기 + 교과서암기', activeColor: 'border-cyan-500 bg-cyan-50' },
  { value: 'voca', label: '올킬보카', desc: '1회독 단어 학습', activeColor: 'border-violet-500 bg-violet-50' },
];

export default function CreateAcademyPage() {
  const router = useRouter();
  const [academyName, setAcademyName] = useState('');
  const [freeService, setFreeService] = useState<FreeService>('naesin');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = academyName.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      await fetchWithToast('/api/teacher/create-academy', {
        body: { academyName: trimmed, freeService },
        silent: true,
      });
      // Role changed to admin — redirect to admin dashboard
      router.push('/admin');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '학원 생성 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Button variant="ghost" size="sm" asChild className="absolute left-4 top-4">
            <Link href="/teacher">
              <ArrowLeft className="h-4 w-4 mr-1" />
              돌아가기
            </Link>
          </Button>
          <div className="mx-auto rounded-full bg-violet-100 p-3 dark:bg-violet-950 mb-2">
            <Building2 className="h-8 w-8 text-violet-600 dark:text-violet-400" />
          </div>
          <CardTitle className="text-xl">학원 만들기</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            직접 학원을 만들어 학생을 관리하세요.
            <br />
            5명까지 무료로 시작할 수 있어요.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="academyName">학원명</Label>
              <Input
                id="academyName"
                type="text"
                placeholder="학원 이름을 입력하세요"
                value={academyName}
                onChange={(e) => setAcademyName(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label>무료 체험 서비스 선택</Label>
              <div className="grid grid-cols-2 gap-3">
                {SERVICE_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 cursor-pointer transition-all ${
                      freeService === opt.value ? opt.activeColor : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="freeService"
                      value={opt.value}
                      checked={freeService === opt.value}
                      onChange={() => setFreeService(opt.value)}
                      className="sr-only"
                    />
                    <span className="text-sm font-semibold">{opt.label}</span>
                    <span className="text-xs text-muted-foreground text-center">{opt.desc}</span>
                  </label>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={!academyName.trim() || submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  생성 중...
                </>
              ) : (
                '학원 만들기'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
