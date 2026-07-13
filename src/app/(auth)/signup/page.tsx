'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AdminSignupFields } from '@/components/auth/admin-signup-fields';
import { InviteCodeField } from '@/components/auth/invite-code-field';
import { AcademySignupGuide } from '@/components/auth/academy-signup-guide';
import { toast } from 'sonner';
import { isSafeRedirect } from '@/lib/auth/redirect';
import type { UserRole } from '@/types/database';

type FreeService = 'naesin' | 'voca';

function SignUpForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [inviteCode, setInviteCode] = useState('');
  const [academyName, setAcademyName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [newAcademyName, setNewAcademyName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [freeService, setFreeService] = useState<FreeService>('naesin');
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get('next');

  const isAdminRole = role === 'admin';

  function buildMetadata() {
    const data: Record<string, string | undefined> = { full_name: fullName, role };
    if (phone.trim()) data.phone = phone.trim();

    if (isAdminRole) {
      data.academy_name = newAcademyName.trim();
      data.free_service = freeService;
      data.contact_number = contactNumber.trim() || undefined;
    } else {
      const code = inviteCode.trim().toUpperCase();
      if (code.length === 6 && academyName) data.invite_code = code;
    }
    return data;
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    if (isAdminRole && !newAcademyName.trim()) {
      toast.error('학원명을 입력해주세요');
      setLoading(false);
      return;
    }

    const { error } = await createClient().auth.signUp({
      email,
      password,
      options: { data: buildMetadata() },
    });

    if (error) {
      toast.error('회원가입 실패', { description: error.message });
      setLoading(false);
      return;
    }

    toast.success('회원가입 완료!');

    // Compute redirect at action time using actual browser URL
    const sp = new URLSearchParams(window.location.search);
    const next = sp.get('next');
    const stored = sessionStorage.getItem('authRedirect');
    sessionStorage.removeItem('authRedirect');

    const dashboards: Record<string, string> = {
      student: '/student', teacher: '/teacher', admin: '/admin', boss: '/boss',
    };
    const target = isSafeRedirect(next) ? next
      : isSafeRedirect(stored) ? stored
      : dashboards[role] || '/student';

    window.location.href = target;
  }

  return (
    <div className="signup-page relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12" style={{ background: '#DFEFFF' }}>
      {/* /allkill 패밀리 톤 — GmarketSans 제목 폰트 + 노란 알약 CTA */}
      <style suppressHydrationWarning>{`
        @font-face { font-family: 'GmarketSans'; font-weight: 700; src: url('/fonts/GmarketSansBold.woff') format('woff'); font-display: swap; }
        @font-face { font-family: 'GmarketSans'; font-weight: 500; src: url('/fonts/GmarketSansMedium.woff') format('woff'); font-display: swap; }
        .signup-display { font-family: 'GmarketSans', 'Pretendard', sans-serif; }
        .signup-letter { position: absolute; font-family: 'GmarketSans', sans-serif; font-weight: 700; color: rgba(255,255,255,0.7); user-select: none; pointer-events: none; line-height: 1; }
        .signup-cta { background: #FDD663; color: #1F1F1F; box-shadow: 0 6px 20px rgba(253,214,99,0.5); }
        .signup-cta:hover:not(:disabled) { transform: translateY(-2px); }
      `}</style>

      {/* 배경 알파벳 (가장자리) */}
      <div aria-hidden className="absolute inset-0">
        <span className="signup-letter" style={{ top: '8%', left: '5%', fontSize: 110, transform: 'rotate(-12deg)' }}>A</span>
        <span className="signup-letter" style={{ top: '70%', left: '7%', fontSize: 90, transform: 'rotate(10deg)' }}>b</span>
        <span className="signup-letter" style={{ top: '14%', right: '7%', fontSize: 120, transform: 'rotate(8deg)' }}>V</span>
        <span className="signup-letter" style={{ top: '74%', right: '6%', fontSize: 84, transform: 'rotate(-8deg)' }}>o</span>
      </div>

      <div className={`relative z-10 w-full transition-all duration-300 grid grid-cols-1 gap-6 items-start ${isAdminRole ? 'max-w-4xl lg:grid-cols-[1fr_380px]' : 'max-w-md'}`}>
        <div>
          {/* 로고 + 타이틀 */}
          <div className="text-center mb-8">
            <Link href="/">
              <Image src="/logo.png" alt="올라영" width={72} height={72} className="mx-auto rounded-2xl shadow-lg shadow-brand-200/50" />
            </Link>
            <h1 className="signup-display mt-5 text-3xl text-[#1F1F1F] tracking-tight" style={{ fontWeight: 700 }}>회원가입</h1>
            <p className="signup-display mt-2 text-[#3C4043]" style={{ fontWeight: 500 }}>영어 단어, 알아서 전부 외워집니다</p>
          </div>

          {/* 폼 카드 */}
          <div className="rounded-3xl p-8 bg-white border border-gray-200/60 shadow-xl shadow-[#1A73E8]/5">
            <form onSubmit={handleSignUp} className="space-y-5">
              <div>
                <label htmlFor="fullName" className="block text-sm font-bold text-[#1F1F1F] mb-2">이름</label>
                <Input id="fullName" type="text" placeholder="홍길동" value={fullName} onChange={(e) => setFullName(e.target.value)} required autoComplete="name" className="rounded-2xl py-4 px-5 border-2 border-gray-200 focus:ring-4 focus:ring-brand-100 focus:border-brand-400" />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-bold text-[#1F1F1F] mb-2">전화번호</label>
                <Input id="phone" type="tel" placeholder="010-0000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" className="rounded-2xl py-4 px-5 border-2 border-gray-200 focus:ring-4 focus:ring-brand-100 focus:border-brand-400" />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-bold text-[#1F1F1F] mb-2">이메일</label>
                <Input id="email" type="email" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className="rounded-2xl py-4 px-5 border-2 border-gray-200 focus:ring-4 focus:ring-brand-100 focus:border-brand-400" />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-bold text-[#1F1F1F] mb-2">비밀번호</label>
                <Input id="password" type="password" placeholder="6자 이상 입력하세요" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete="new-password" className="rounded-2xl py-4 px-5 border-2 border-gray-200 focus:ring-4 focus:ring-brand-100 focus:border-brand-400" />
              </div>
              <div>
                <label htmlFor="role" className="block text-sm font-bold text-[#1F1F1F] mb-2">역할</label>
                <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                  <SelectTrigger className="rounded-2xl py-4 px-5 border-2 border-gray-200 h-auto"><SelectValue placeholder="역할 선택" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">학생</SelectItem>
                    <SelectItem value="teacher">선생님</SelectItem>
                    <SelectItem value="admin">학원 원장</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isAdminRole ? (
                <AdminSignupFields
                  academyName={newAcademyName}
                  onAcademyNameChange={setNewAcademyName}
                  freeService={freeService}
                  onFreeServiceChange={setFreeService}
                />
              ) : (
                <InviteCodeField
                  value={inviteCode}
                  onChange={setInviteCode}
                  academyName={academyName}
                  onAcademyNameChange={setAcademyName}
                />
              )}

              <button
                type="submit"
                disabled={loading}
                className="signup-cta signup-display w-full py-4 text-lg rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontWeight: 700 }}
              >
                {loading ? '가입 중...' : '회원가입'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-[#3C4043]">
              이미 계정이 있으신가요?{' '}
              <Link
                href={nextParam && isSafeRedirect(nextParam) ? `/login?next=${encodeURIComponent(nextParam)}` : '/login'}
                className="font-bold transition-colors"
                style={{ color: '#1A73E8' }}
              >로그인</Link>
            </p>
          </div>

          <p className="mt-3 text-center">
            <Link href="/" className="text-sm text-[#3C4043] hover:text-[#1A73E8] transition-colors">&larr; 홈으로 돌아가기</Link>
          </p>
        </div>

        {isAdminRole && <AcademySignupGuide />}
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense>
      <SignUpForm />
    </Suspense>
  );
}
