'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { fetchWithToast } from '@/lib/fetch-with-toast';

export default function FindEmailPage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMaskedEmail(null);

    try {
      const data = await fetchWithToast<{ email: string }>('/api/auth/find-email', {
        body: { name: name.trim(), phone: phone.trim() },
        errorMessage: '이메일을 찾을 수 없습니다.',
      });

      setMaskedEmail(data.email);
    } catch {
      // fetchWithToast already shows toast on !res.ok; catch network errors
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 bg-gradient-to-b from-slate-50 to-white">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/">
            <Image src="/logo.png" alt="올라영" width={80} height={80} className="mx-auto rounded-2xl shadow-lg shadow-violet-200/50" />
          </Link>
          <h1 className="mt-5 text-2xl font-black text-[#1d1d1f] tracking-tight">이메일 찾기</h1>
          <p className="mt-2 text-[#86868b]">가입 시 등록한 이름과 전화번호로 이메일을 찾습니다</p>
        </div>

        <div className="rounded-3xl p-8 bg-white/70 backdrop-blur-xl border border-gray-200/50 shadow-xl shadow-gray-200/50">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-bold text-slate-700 mb-2">이름</label>
              <input
                id="name"
                type="text"
                placeholder="홍길동"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                disabled={loading}
                className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-violet-100 focus:border-violet-400 transition-all text-slate-800 placeholder:text-slate-400 font-medium bg-white/80 outline-none"
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-bold text-slate-700 mb-2">전화번호</label>
              <input
                id="phone"
                type="tel"
                placeholder="010-0000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                autoComplete="tel"
                disabled={loading}
                className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-violet-100 focus:border-violet-400 transition-all text-slate-800 placeholder:text-slate-400 font-medium bg-white/80 outline-none"
              />
            </div>

            {maskedEmail && (
              <div className="rounded-2xl bg-green-50 border-2 border-green-200 p-5 text-center">
                <p className="text-sm text-[#86868b]">찾은 이메일</p>
                <p className="text-lg font-bold text-green-700 mt-1">{maskedEmail}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white text-lg font-bold rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-300/30"
            >
              {loading ? '찾는 중...' : '이메일 찾기'}
            </button>
          </form>

          <p className="mt-6 text-center">
            <Link href="/login" className="text-sm text-[#86868b] hover:text-violet-600 transition-colors">
              로그인으로 돌아가기
            </Link>
          </p>
        </div>

        <p className="mt-3 text-center">
          <Link href="/" className="text-sm text-[#86868b] hover:text-violet-600 transition-colors">&larr; 홈으로 돌아가기</Link>
        </p>
      </div>
    </div>
  );
}
