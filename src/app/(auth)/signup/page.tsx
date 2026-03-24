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
  const redirectTo = isSafeRedirect(nextParam) ? nextParam : '/';

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
    window.location.href = redirectTo;
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 bg-background">
      <div className={`w-full transition-all duration-300 grid grid-cols-1 gap-6 items-start ${isAdminRole ? 'max-w-4xl lg:grid-cols-[1fr_380px]' : 'max-w-lg'}`}>
          <Card className="w-full shadow-xl">
            <CardHeader className="text-center">
              <Image src="/logo.jpg" alt="올라영" width={120} height={120} className="mx-auto" />
              <CardDescription className="mt-2">올라영 AI 러닝 엔진에 가입하세요</CardDescription>
            </CardHeader>
            <form onSubmit={handleSignUp}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">이름</Label>
                  <Input id="fullName" type="text" placeholder="홍길동" value={fullName} onChange={(e) => setFullName(e.target.value)} required autoComplete="name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">전화번호</Label>
                  <Input id="phone" type="tel" placeholder="010-0000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">이메일</Label>
                  <Input id="email" type="email" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">비밀번호</Label>
                  <Input id="password" type="password" placeholder="6자 이상 입력하세요" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete="new-password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">역할</Label>
                  <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                    <SelectTrigger><SelectValue placeholder="역할 선택" /></SelectTrigger>
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
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? '가입 중...' : '회원가입'}
                </Button>
                <p className="text-sm text-muted-foreground">
                  이미 계정이 있으신가요?{' '}
                  <Link
                    href={nextParam && isSafeRedirect(nextParam) ? `/login?next=${encodeURIComponent(nextParam)}` : '/login'}
                    className="text-primary underline-offset-4 hover:underline"
                  >로그인</Link>
                </p>
              </CardFooter>
            </form>
          </Card>

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
