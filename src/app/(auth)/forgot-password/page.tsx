'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { AuthBrandBg } from '@/components/auth/auth-brand-bg';
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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12" style={{ background: '#DFEFFF' }}>
      <AuthBrandBg />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/">
            <Image src="/logo.png" alt="올라영" width={72} height={72} className="mx-auto rounded-2xl shadow-lg shadow-brand-200/50" />
          </Link>
          <h1 className="auth-display mt-5 text-3xl text-[#1F1F1F] tracking-tight" style={{ fontWeight: 700 }}>비밀번호 찾기</h1>
          <p className="auth-display mt-2 text-[#3C4043]" style={{ fontWeight: 500 }}>비밀번호 재설정 이메일을 보내드립니다</p>
        </div>

        <div className="rounded-3xl p-8 bg-white border border-gray-200/60 shadow-xl shadow-[#1A73E8]/5">
          {sent ? (
            <div className="text-center space-y-4 py-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-2" style={{ background: '#E6F4EA' }}>
                <svg className="w-8 h-8" style={{ color: '#188038' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-[#3C4043] leading-relaxed">
                <strong className="text-[#1F1F1F]">{email}</strong>로<br />
                비밀번호 재설정 링크를 보냈습니다.<br />
                이메일을 확인해주세요.
              </p>
              <Link
                href="/login"
                className="inline-block mt-2 font-bold transition-colors"
                style={{ color: '#1A73E8' }}
              >
                로그인으로 돌아가기
              </Link>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-bold text-[#1F1F1F] mb-2">이메일</label>
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
                <button
                  type="submit"
                  disabled={loading}
                  className="auth-cta auth-display w-full py-4 text-lg rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ fontWeight: 700 }}
                >
                  {loading ? '발송 중...' : '재설정 이메일 보내기'}
                </button>
              </form>

              <p className="mt-6 text-center">
                <Link href="/login" className="text-sm text-[#3C4043] hover:text-[#1A73E8] transition-colors">
                  로그인으로 돌아가기
                </Link>
              </p>
            </>
          )}
        </div>

        <p className="mt-3 text-center">
          <Link href="/" className="text-sm text-[#3C4043] hover:text-[#1A73E8] transition-colors">&larr; 홈으로 돌아가기</Link>
        </p>
      </div>
    </div>
  );
}
