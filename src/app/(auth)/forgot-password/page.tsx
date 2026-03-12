'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from '@/components/ui/card';
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
    <div className="flex min-h-screen items-center justify-center px-4 bg-violet-100">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center">
          <Image src="/logo.jpg" alt="올라영" width={120} height={120} className="mx-auto" />
          <CardDescription className="mt-2">비밀번호 재설정 이메일을 보내드립니다</CardDescription>
        </CardHeader>
        {sent ? (
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              <strong>{email}</strong>로 비밀번호 재설정 링크를 보냈습니다.<br />
              이메일을 확인해주세요.
            </p>
            <Link href="/login" className="text-primary text-sm underline-offset-4 hover:underline">
              로그인으로 돌아가기
            </Link>
          </CardContent>
        ) : (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
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
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? '발송 중...' : '재설정 이메일 보내기'}
              </Button>
              <Link href="/login" className="text-sm text-muted-foreground hover:underline underline-offset-4">
                로그인으로 돌아가기
              </Link>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}
