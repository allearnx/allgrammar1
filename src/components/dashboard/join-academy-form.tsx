'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Building2, Loader2, Plus } from 'lucide-react';
import Link from 'next/link';

export function JoinAcademyForm({ compact = false }: { compact?: boolean } = {}) {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [academyName, setAcademyName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const validate = useCallback(async (value: string) => {
    const trimmed = value.trim().toUpperCase();
    if (trimmed.length !== 6) {
      setAcademyName(null);
      setError(null);
      return;
    }

    setValidating(true);
    setError(null);
    try {
      const res = await fetch(`/api/auth/validate-invite-code?code=${trimmed}`);
      const data = await res.json();
      if (res.ok) {
        setAcademyName(data.academyName);
        setError(null);
      } else {
        setAcademyName(null);
        setError(data.error || '유효하지 않은 초대 코드입니다.');
      }
    } catch {
      setAcademyName(null);
      setError('코드 확인 중 오류가 발생했습니다.');
    } finally {
      setValidating(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().slice(0, 6);
    setCode(value);
    validate(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!academyName || submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/join-academy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: code }),
      });
      const data = await res.json();
      if (res.ok) {
        router.refresh();
      } else {
        setError(data.error || '학원 연결에 실패했습니다.');
      }
    } catch {
      setError('학원 연결 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={compact ? '' : 'flex items-center justify-center min-h-[60vh] p-4'}>
      <Card className={compact ? 'w-full' : 'w-full max-w-md'}>
        <CardHeader className="text-center">
          <div className="mx-auto rounded-full bg-violet-100 p-3 dark:bg-violet-950 mb-2">
            <Building2 className="h-8 w-8 text-violet-600 dark:text-violet-400" />
          </div>
          <CardTitle className="text-xl">학원 연결</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            소속 학원의 초대 코드를 입력하여 학원에 연결하세요.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                value={code}
                onChange={handleChange}
                placeholder="초대 코드 6자리"
                maxLength={6}
                className="text-center text-lg tracking-widest font-mono"
                autoFocus
              />
            </div>

            {validating && (
              <p className="text-sm text-muted-foreground text-center flex items-center justify-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                확인 중...
              </p>
            )}

            {academyName && (
              <div className="rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-3 text-center">
                <p className="text-sm text-green-700 dark:text-green-300">
                  <span className="font-semibold">{academyName}</span> 학원이 확인되었습니다.
                </p>
              </div>
            )}

            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={!academyName || submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  연결 중...
                </>
              ) : (
                '학원 연결'
              )}
            </Button>
          </form>

          {/* 프리랜서 선생님용 학원 만들기 안내 */}
          <div className="mt-6 pt-5 border-t">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                초대 코드가 없으신가요?
              </p>
              <p className="text-xs text-muted-foreground">
                직접 학원을 만들어 학생을 관리할 수 있어요.
              </p>
              <Button variant="outline" size="sm" asChild className="mt-2">
                <Link href="/teacher/create-academy">
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  학원 만들기
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
