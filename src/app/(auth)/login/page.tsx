'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from '@/components/ui/card';
import { toast } from 'sonner';
import { isSafeRedirect } from '@/lib/auth/redirect';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get('next');
  const redirectTo = isSafeRedirect(nextParam) ? nextParam : '/';

  // next 파라미터를 sessionStorage에 백업 (회원가입 페이지 이동 시 유실 방지)
  useEffect(() => {
    if (isSafeRedirect(nextParam)) {
      sessionStorage.setItem('authRedirect', nextParam);
    }
  }, [nextParam]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error('로그인 실패', { description: error.message });
      setLoading(false);
      return;
    }

    toast.success('로그인 성공!');
    sessionStorage.removeItem('authRedirect');
    router.push(redirectTo);
    router.refresh();
  }

  const signupHref = nextParam && isSafeRedirect(nextParam)
    ? `/signup?next=${encodeURIComponent(nextParam)}`
    : '/signup';

  return (
    <div className="flex min-h-screen items-center justify-center px-4 bg-violet-100">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center">
          <Image src="/logo.jpg" alt="올라영" width={120} height={120} className="mx-auto" />
          <CardDescription className="mt-2">올라영 AI 러닝 엔진에 로그인하세요</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="current-password"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '로그인 중...' : '로그인'}
            </Button>
            <div className="flex justify-center gap-4 text-sm">
              <Link href="/find-email" className="text-muted-foreground underline-offset-4 hover:underline">
                이메일 찾기
              </Link>
              <span className="text-muted-foreground">|</span>
              <Link href="/forgot-password" className="text-muted-foreground underline-offset-4 hover:underline">
                비밀번호 찾기
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              계정이 없으신가요?{' '}
              <Link href={signupHref} className="text-primary underline-offset-4 hover:underline">
                회원가입
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
