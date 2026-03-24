'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);

    if (error) {
      toast.error('이메일 발송에 실패했습니다.', { description: error.message });
      return;
    }

    setSent(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 bg-gradient-to-b from-slate-50 to-white">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/">
            <Image src="/logo.png" alt="올라영" width={80} height={80} className="mx-auto rounded-2xl shadow-lg shadow-violet-200/50" />
          </Link>
          <h1 className="mt-5 text-2xl font-black text-[#1d1d1f] tracking-tight">비밀번호 찾기</h1>
          <p className="mt-2 text-[#86868b]">비밀번호 재설정 이메일을 보내드립니다</p>
        </div>

        <div className="rounded-3xl p-8 bg-white/70 backdrop-blur-xl border border-gray-200/50 shadow-xl shadow-gray-200/50">
          {sent ? (
            <div className="text-center space-y-4 py-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-violet-100 to-purple-100 rounded-2xl mb-2">
                <svg className="w-8 h-8 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-[#424245] leading-relaxed">
                <strong className="text-[#1d1d1f]">{email}</strong>로<br />
                비밀번호 재설정 링크를 보냈습니다.<br />
                이메일을 확인해주세요.
              </p>
              <Link
                href="/login"
                className="inline-block mt-2 text-violet-600 font-bold hover:text-violet-700 transition-colors"
              >
                로그인으로 돌아가기
              </Link>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-bold text-slate-700 mb-2">이메일</label>
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
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white text-lg font-bold rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-300/30"
                >
                  {loading ? '발송 중...' : '재설정 이메일 보내기'}
                </button>
              </form>

              <p className="mt-6 text-center">
                <Link href="/login" className="text-sm text-[#86868b] hover:text-violet-600 transition-colors">
                  로그인으로 돌아가기
                </Link>
              </p>
            </>
          )}
        </div>

        <p className="mt-3 text-center">
          <Link href="/" className="text-sm text-[#86868b] hover:text-violet-600 transition-colors">&larr; 홈으로 돌아가기</Link>
        </p>
      </div>
    </div>
  );
}
