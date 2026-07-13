'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { AuthBrandBg } from '@/components/auth/auth-brand-bg';
import { toast } from 'sonner';

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true);
      }
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    setLoading(false);

    if (error) {
      toast.error('비밀번호 변경에 실패했습니다.', { description: error.message });
      return;
    }

    toast.success('비밀번호가 변경되었습니다. 로그인해주세요.');
    await supabase.auth.signOut();
    router.push('/login');
  }

  if (!ready) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12" style={{ background: '#DFEFFF' }}>
        <AuthBrandBg />
        <div className="relative z-10 w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/">
              <Image src="/logo.png" alt="올라영" width={72} height={72} className="mx-auto rounded-2xl shadow-lg shadow-brand-200/50" />
            </Link>
            <h1 className="auth-display mt-5 text-3xl text-[#1F1F1F] tracking-tight" style={{ fontWeight: 700 }}>비밀번호 재설정</h1>
            <p className="auth-display mt-2 text-[#3C4043]" style={{ fontWeight: 500 }}>링크를 확인하고 있습니다...</p>
          </div>
          <div className="rounded-3xl p-8 bg-white border border-gray-200/60 shadow-xl shadow-[#1A73E8]/5 text-center">
            <svg className="animate-spin h-8 w-8 mx-auto mb-4" style={{ color: '#1A73E8' }} viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-[#3C4043]">
              잠시만 기다려주세요. 링크가 유효하지 않으면{' '}
              <Link href="/forgot-password" className="font-bold transition-colors" style={{ color: '#1A73E8' }}>
                다시 요청
              </Link>
              해주세요.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12" style={{ background: '#DFEFFF' }}>
      <AuthBrandBg />
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/">
            <Image src="/logo.png" alt="올라영" width={72} height={72} className="mx-auto rounded-2xl shadow-lg shadow-brand-200/50" />
          </Link>
          <h1 className="auth-display mt-5 text-3xl text-[#1F1F1F] tracking-tight" style={{ fontWeight: 700 }}>비밀번호 재설정</h1>
          <p className="auth-display mt-2 text-[#3C4043]" style={{ fontWeight: 500 }}>새 비밀번호를 설정해주세요</p>
        </div>

        <div className="rounded-3xl p-8 bg-white border border-gray-200/60 shadow-xl shadow-[#1A73E8]/5">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="new-password" className="block text-sm font-bold text-[#1F1F1F] mb-2">새 비밀번호</label>
              <input
                id="new-password"
                type="password"
                placeholder="6자 이상 입력하세요"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                disabled={loading}
                className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-brand-100 focus:border-brand-400 transition-all text-slate-800 placeholder:text-slate-400 font-medium bg-white outline-none"
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-bold text-[#1F1F1F] mb-2">새 비밀번호 확인</label>
              <input
                id="confirm-password"
                type="password"
                placeholder="비밀번호를 다시 입력하세요"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
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
              {loading ? '변경 중...' : '비밀번호 변경'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
