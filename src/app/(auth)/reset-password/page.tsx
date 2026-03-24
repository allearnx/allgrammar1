'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
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
      <div className="flex min-h-screen items-center justify-center px-4 bg-gradient-to-b from-slate-50 to-white">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/">
              <Image src="/logo.png" alt="올라영" width={80} height={80} className="mx-auto rounded-2xl shadow-lg shadow-violet-200/50" />
            </Link>
            <h1 className="mt-5 text-2xl font-black text-[#1d1d1f] tracking-tight">비밀번호 재설정</h1>
            <p className="mt-2 text-[#86868b]">링크를 확인하고 있습니다...</p>
          </div>
          <div className="rounded-3xl p-8 bg-white/70 backdrop-blur-xl border border-gray-200/50 shadow-xl shadow-gray-200/50 text-center">
            <svg className="animate-spin h-8 w-8 text-violet-500 mx-auto mb-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-[#86868b]">
              잠시만 기다려주세요. 링크가 유효하지 않으면{' '}
              <Link href="/forgot-password" className="text-violet-600 font-bold hover:text-violet-700 transition-colors">
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
    <div className="flex min-h-screen items-center justify-center px-4 bg-gradient-to-b from-slate-50 to-white">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/">
            <Image src="/logo.png" alt="올라영" width={80} height={80} className="mx-auto rounded-2xl shadow-lg shadow-violet-200/50" />
          </Link>
          <h1 className="mt-5 text-2xl font-black text-[#1d1d1f] tracking-tight">비밀번호 재설정</h1>
          <p className="mt-2 text-[#86868b]">새 비밀번호를 설정해주세요</p>
        </div>

        <div className="rounded-3xl p-8 bg-white/70 backdrop-blur-xl border border-gray-200/50 shadow-xl shadow-gray-200/50">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="new-password" className="block text-sm font-bold text-slate-700 mb-2">새 비밀번호</label>
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
                className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-violet-100 focus:border-violet-400 transition-all text-slate-800 placeholder:text-slate-400 font-medium bg-white/80 outline-none"
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="block text-sm font-bold text-slate-700 mb-2">새 비밀번호 확인</label>
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
                className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-violet-100 focus:border-violet-400 transition-all text-slate-800 placeholder:text-slate-400 font-medium bg-white/80 outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white text-lg font-bold rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-300/30"
            >
              {loading ? '변경 중...' : '비밀번호 변경'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
