'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import { AuthBrandBg } from '@/components/auth/auth-brand-bg';

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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12" style={{ background: '#DFEFFF' }}>
      <AuthBrandBg />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/">
            <Image src="/logo.png" alt="올라영" width={72} height={72} className="mx-auto rounded-2xl shadow-lg shadow-brand-200/50" />
          </Link>
          <h1 className="auth-display mt-5 text-3xl text-[#1F1F1F] tracking-tight" style={{ fontWeight: 700 }}>이메일 찾기</h1>
          <p className="auth-display mt-2 text-[#3C4043]" style={{ fontWeight: 500 }}>가입 시 등록한 이름과 전화번호로 이메일을 찾습니다</p>
        </div>

        <div className="rounded-3xl p-8 bg-white border border-gray-200/60 shadow-xl shadow-[#1A73E8]/5">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-bold text-[#1F1F1F] mb-2">이름</label>
              <input
                id="name"
                type="text"
                placeholder="홍길동"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                disabled={loading}
                className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-brand-100 focus:border-brand-400 transition-all text-slate-800 placeholder:text-slate-400 font-medium bg-white outline-none"
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-bold text-[#1F1F1F] mb-2">전화번호</label>
              <input
                id="phone"
                type="tel"
                placeholder="010-0000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                autoComplete="tel"
                disabled={loading}
                className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-brand-100 focus:border-brand-400 transition-all text-slate-800 placeholder:text-slate-400 font-medium bg-white outline-none"
              />
            </div>

            {maskedEmail && (
              <div className="rounded-2xl border-2 p-5 text-center" style={{ background: '#E6F4EA', borderColor: '#9FE1CB' }}>
                <p className="text-sm text-[#3C4043]">찾은 이메일</p>
                <p className="text-lg font-bold mt-1" style={{ color: '#0D652D' }}>{maskedEmail}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="auth-cta auth-display w-full py-4 text-lg rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontWeight: 700 }}
            >
              {loading ? '찾는 중...' : '이메일 찾기'}
            </button>
          </form>

          <p className="mt-6 text-center">
            <Link href="/login" className="text-sm text-[#3C4043] hover:text-[#1A73E8] transition-colors">
              로그인으로 돌아가기
            </Link>
          </p>
        </div>

        <p className="mt-3 text-center">
          <Link href="/" className="text-sm text-[#3C4043] hover:text-[#1A73E8] transition-colors">&larr; 홈으로 돌아가기</Link>
        </p>
      </div>
    </div>
  );
}
