'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
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
    <div className="flex min-h-screen items-center justify-center px-4 bg-gradient-to-b from-slate-50 to-white">
      <div className="w-full max-w-md">
        {/* 로고 + 타이틀 */}
        <div className="text-center mb-8">
          <Link href="/">
            <Image src="/logo.png" alt="올라영" width={80} height={80} className="mx-auto rounded-2xl shadow-lg shadow-violet-200/50" />
          </Link>
          <h1 className="mt-5 text-2xl font-black text-[#1d1d1f] tracking-tight">
            로그인
          </h1>
          <p className="mt-2 text-[#86868b]">
            올라영 AI 러닝 엔진에 오신 것을 환영합니다
          </p>
        </div>

        {/* 폼 카드 */}
        <div className="rounded-3xl p-8 bg-white/70 backdrop-blur-xl border border-gray-200/50 shadow-xl shadow-gray-200/50">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-slate-700 mb-2">
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
                className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-violet-100 focus:border-violet-400 transition-all text-slate-800 placeholder:text-slate-400 font-medium bg-white/80 outline-none"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-bold text-slate-700 mb-2">
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
                className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-violet-100 focus:border-violet-400 transition-all text-slate-800 placeholder:text-slate-400 font-medium bg-white/80 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#A78BFA] hover:bg-[#9171f0] text-white text-lg font-bold rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#A78BFA]/30"
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
            <Link href="/find-email" className="text-[#86868b] hover:text-violet-600 transition-colors">
              이메일 찾기
            </Link>
            <span className="text-gray-300">|</span>
            <Link href="/forgot-password" className="text-[#86868b] hover:text-violet-600 transition-colors">
              비밀번호 찾기
            </Link>
          </div>
        </div>

        {/* 회원가입 안내 */}
        <p className="mt-6 text-center text-sm text-[#86868b]">
          계정이 없으신가요?{' '}
          <Link href={signupHref} className="text-violet-600 font-bold hover:text-violet-700 transition-colors">
            회원가입
          </Link>
        </p>

        {/* 홈으로 돌아가기 */}
        <p className="mt-3 text-center">
          <Link href="/" className="text-sm text-[#86868b] hover:text-violet-600 transition-colors">
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
