'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { AuthBrandBg } from '@/components/auth/auth-brand-bg';
import { toast } from 'sonner';
import { isSafeRedirect } from '@/lib/auth/redirect';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get('next');
  const hasExplicitNext = isSafeRedirect(nextParam);
  const redirectTo = hasExplicitNext ? nextParam : null; // null = resolve after login

  useEffect(() => {
    if (hasExplicitNext) {
      sessionStorage.setItem('authRedirect', nextParam);
    }
  }, [hasExplicitNext, nextParam]);

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

    if (redirectTo) {
      router.push(redirectTo);
    } else {
      // No explicit next param — redirect to role-based dashboard
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();
        const role = profile?.role || 'student';
        const dashboards: Record<string, string> = {
          boss: '/boss',
          admin: '/admin',
          teacher: '/teacher',
          student: '/student',
        };
        router.push(dashboards[role] || '/student');
      } else {
        router.push('/student');
      }
    }
    router.refresh();
  }

  const signupHref = hasExplicitNext
    ? `/signup?next=${encodeURIComponent(nextParam)}`
    : '/signup';

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12" style={{ background: '#DFEFFF' }}>
      <AuthBrandBg />

      <div className="relative z-10 w-full max-w-md">
        {/* 로고 + 타이틀 */}
        <div className="text-center mb-8">
          <Link href="/">
            <Image src="/logo.png" alt="올라영" width={72} height={72} className="mx-auto rounded-2xl shadow-lg shadow-brand-200/50" />
          </Link>
          <h1 className="auth-display mt-5 text-3xl text-[#1F1F1F] tracking-tight" style={{ fontWeight: 700 }}>
            로그인
          </h1>
          <p className="auth-display mt-2 text-[#3C4043]" style={{ fontWeight: 500 }}>
            영어 실력, 알아서 오릅니다
          </p>
        </div>

        {/* 폼 카드 */}
        <div className="rounded-3xl p-8 bg-white border border-gray-200/60 shadow-xl shadow-[#1A73E8]/5">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-[#1F1F1F] mb-2">
                이메일
              </label>
              <input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                disabled={loading}
                className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-brand-100 focus:border-brand-400 transition-all text-slate-800 placeholder:text-slate-400 font-medium bg-white outline-none"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-bold text-[#1F1F1F] mb-2">
                비밀번호
              </label>
              <input
                id="password"
                type="password"
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="current-password"
                disabled={loading}
                className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-brand-100 focus:border-brand-400 transition-all text-slate-800 placeholder:text-slate-400 font-medium bg-white outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="auth-cta auth-display w-full py-4 text-lg rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontWeight: 700 }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  로그인 중...
                </span>
              ) : '로그인'}
            </button>
          </form>

          <div className="mt-6 flex justify-center gap-4 text-sm">
            <Link href="/find-email" className="text-[#3C4043] hover:text-[#1A73E8] transition-colors">
              이메일 찾기
            </Link>
            <span className="text-gray-300">|</span>
            <Link href="/forgot-password" className="text-[#3C4043] hover:text-[#1A73E8] transition-colors">
              비밀번호 찾기
            </Link>
          </div>
        </div>

        {/* 회원가입 안내 */}
        <p className="mt-6 text-center text-sm text-[#3C4043]">
          계정이 없으신가요?{' '}
          <Link href={signupHref} className="font-bold transition-colors" style={{ color: '#1A73E8' }}>
            회원가입
          </Link>
        </p>

        {/* 홈으로 돌아가기 */}
        <p className="mt-3 text-center">
          <Link href="/" className="text-sm text-[#3C4043] hover:text-[#1A73E8] transition-colors">
            &larr; 홈으로 돌아가기
          </Link>
        </p>
      </div>
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
