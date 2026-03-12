'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { CheckCircle2, XCircle } from 'lucide-react';
import type { UserRole } from '@/types/database';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [inviteCode, setInviteCode] = useState('');
  const [academyName, setAcademyName] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newAcademyName, setNewAcademyName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const router = useRouter();

  const isAdminRole = role === 'admin';

  useEffect(() => {
    const code = inviteCode.trim().toUpperCase();
    setAcademyName(null);
    setInviteError(null);

    if (code.length !== 6) return;

    const controller = new AbortController();
    setValidating(true);

    fetch(`/api/auth/validate-invite-code?code=${code}`, { signal: controller.signal })
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          setAcademyName(data.academyName);
        } else {
          setInviteError('유효하지 않은 초대 코드입니다');
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setInviteError('검증 중 오류가 발생했습니다');
      })
      .finally(() => setValidating(false));

    return () => controller.abort();
  }, [inviteCode]);

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const code = inviteCode.trim().toUpperCase();
    const supabase = createClient();

    // admin 역할: 학원명 필수
    if (isAdminRole && !newAcademyName.trim()) {
      toast.error('학원명을 입력해주세요');
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
          ...(isAdminRole
            ? { academy_name: newAcademyName.trim() }
            : code.length === 6 && academyName
              ? { invite_code: code }
              : {}),
        },
      },
    });

    if (error) {
      toast.error('회원가입 실패', { description: error.message });
      setLoading(false);
      return;
    }

    toast.success('회원가입 완료!');
    router.push('/');
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 bg-background">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center">
          <Image src="/logo.jpg" alt="올라영" width={120} height={120} className="mx-auto" />
          <CardDescription className="mt-2">올라영 AI 러닝 엔진에 가입하세요</CardDescription>
        </CardHeader>
        <form onSubmit={handleSignUp}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">이름</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="홍길동"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                placeholder="6자 이상 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">역할</Label>
              <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                <SelectTrigger>
                  <SelectValue placeholder="역할 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">학생</SelectItem>
                  <SelectItem value="teacher">선생님</SelectItem>
                  <SelectItem value="admin">학원 원장</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {isAdminRole ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="newAcademyName">학원명</Label>
                  <Input
                    id="newAcademyName"
                    type="text"
                    placeholder="학원 이름을 입력하세요"
                    value={newAcademyName}
                    onChange={(e) => setNewAcademyName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactNumber">연락처</Label>
                  <Input
                    id="contactNumber"
                    type="tel"
                    placeholder="010-0000-0000"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    required
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  가입 후 7일 무료 체험이 시작됩니다.
                </p>
              </>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="inviteCode">초대 코드 (선택)</Label>
                <Input
                  id="inviteCode"
                  type="text"
                  placeholder="6자리 코드 입력"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase().slice(0, 6))}
                  maxLength={6}
                  className="font-mono tracking-widest uppercase"
                  autoComplete="off"
                />
                {validating && (
                  <p className="text-sm text-muted-foreground">확인 중...</p>
                )}
                {academyName && (
                  <p className="text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" />
                    {academyName}
                  </p>
                )}
                {inviteError && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <XCircle className="h-4 w-4" />
                    {inviteError}
                  </p>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '가입 중...' : '회원가입'}
            </Button>
            <p className="text-sm text-muted-foreground">
              이미 계정이 있으신가요?{' '}
              <Link href="/login" className="text-primary underline-offset-4 hover:underline">
                로그인
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
