'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from '@/components/ui/card';
import { toast } from 'sonner';

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Supabase sends the user here with access_token in the URL hash.
    // The client SDK automatically picks it up and sets the session.
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
      <div className="flex min-h-screen items-center justify-center px-4 bg-violet-100">
        <Card className="w-full max-w-lg shadow-xl">
          <CardHeader className="text-center">
            <Image src="/logo.jpg" alt="올라영" width={120} height={120} className="mx-auto" />
            <CardDescription className="mt-2">비밀번호 재설정 링크를 확인하고 있습니다...</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">
              잠시만 기다려주세요. 링크가 유효하지 않으면{' '}
              <Link href="/forgot-password" className="text-primary underline-offset-4 hover:underline">
                다시 요청
              </Link>
              해주세요.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 bg-violet-100">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center">
          <Image src="/logo.jpg" alt="올라영" width={120} height={120} className="mx-auto" />
          <CardDescription className="mt-2">새 비밀번호를 설정해주세요</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">새 비밀번호</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="6자 이상 입력하세요"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">새 비밀번호 확인</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="비밀번호를 다시 입력하세요"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '변경 중...' : '비밀번호 변경'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
