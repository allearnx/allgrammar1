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
  const storedRedirect = typeof window !== 'undefined' ? sessionStorage.getItem('authRedirect') : null;
  const dashboards: Record<string, string> = {
    student: '/student', teacher: '/teacher', admin: '/admin', boss: '/boss',
  };
  const redirectTo = isSafeRedirect(nextParam) ? nextParam
    : isSafeRedirect(storedRedirect) ? storedRedirect
    : dashboards[role] || '/student';

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
    sessionStorage.removeItem('authRedirect');
    window.location.href = redirectTo;
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 bg-gradient-to-b from-slate-50 to-white">
      <div className={`w-full transition-all duration-300 grid grid-cols-1 gap-6 items-start ${isAdminRole ? 'max-w-4xl lg:grid-cols-[1fr_380px]' : 'max-w-md'}`}>
        <div>
          {/* 로고 + 타이틀 */}
          <div className="text-center mb-8">
            <Link href="/">
              <Image src="/logo.png" alt="올라영" width={80} height={80} className="mx-auto rounded-2xl shadow-lg shadow-violet-200/50" />
            </Link>
            <h1 className="mt-5 text-2xl font-black text-[#1d1d1f] tracking-tight">회원가입</h1>
            <p className="mt-2 text-[#86868b]">올라영 AI 러닝 엔진에 가입하세요</p>
          </div>

          {/* 폼 카드 */}
          <div className="rounded-3xl p-8 bg-white/70 backdrop-blur-xl border border-gray-200/50 shadow-xl shadow-gray-200/50">
            <form onSubmit={handleSignUp} className="space-y-5">
              <div>
                <label htmlFor="fullName" className="block text-sm font-bold text-slate-700 mb-2">이름</label>
                <Input id="fullName" type="text" placeholder="홍길동" value={fullName} onChange={(e) => setFullName(e.target.value)} required autoComplete="name" className="rounded-2xl py-4 px-5 border-2 border-gray-200 focus:ring-4 focus:ring-violet-100 focus:border-violet-400" />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-bold text-slate-700 mb-2">전화번호</label>
                <Input id="phone" type="tel" placeholder="010-0000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" className="rounded-2xl py-4 px-5 border-2 border-gray-200 focus:ring-4 focus:ring-violet-100 focus:border-violet-400" />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-bold text-slate-700 mb-2">이메일</label>
                <Input id="email" type="email" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className="rounded-2xl py-4 px-5 border-2 border-gray-200 focus:ring-4 focus:ring-violet-100 focus:border-violet-400" />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-bold text-slate-700 mb-2">비밀번호</label>
                <Input id="password" type="password" placeholder="6자 이상 입력하세요" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete="new-password" className="rounded-2xl py-4 px-5 border-2 border-gray-200 focus:ring-4 focus:ring-violet-100 focus:border-violet-400" />
              </div>
              <div>
                <label htmlFor="role" className="block text-sm font-bold text-slate-700 mb-2">역할</label>
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
                  contactNumber={contactNumber}
                  onContactNumberChange={setContactNumber}
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
                className="w-full py-4 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white text-lg font-bold rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-300/30"
              >
                {loading ? '가입 중...' : '회원가입'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-[#86868b]">
              이미 계정이 있으신가요?{' '}
              <Link
                href={nextParam && isSafeRedirect(nextParam) ? `/login?next=${encodeURIComponent(nextParam)}` : '/login'}
                className="text-violet-600 font-bold hover:text-violet-700 transition-colors"
              >로그인</Link>
            </p>
          </div>

          <p className="mt-3 text-center">
            <Link href="/" className="text-sm text-[#86868b] hover:text-violet-600 transition-colors">&larr; 홈으로 돌아가기</Link>
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
