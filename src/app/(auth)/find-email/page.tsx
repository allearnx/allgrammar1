'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from '@/components/ui/card';
import { toast } from 'sonner';

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
      const res = await fetch('/api/auth/find-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || '이메일을 찾을 수 없습니다.');
        return;
      }

      setMaskedEmail(data.email);
    } catch {
      toast.error('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 bg-violet-100">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center">
          <Image src="/logo.jpg" alt="올라영" width={120} height={120} className="mx-auto" />
          <CardDescription className="mt-2">가입 시 등록한 이름과 전화번호로 이메일을 찾습니다</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">이름</Label>
              <Input
                id="name"
                type="text"
                placeholder="홍길동"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">전화번호</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="010-0000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                autoComplete="tel"
              />
            </div>
            {maskedEmail && (
              <div className="rounded-md bg-green-50 border border-green-200 p-4 text-center">
                <p className="text-sm text-muted-foreground">찾은 이메일</p>
                <p className="text-lg font-semibold text-green-700 mt-1">{maskedEmail}</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '찾는 중...' : '이메일 찾기'}
            </Button>
            <Link href="/login" className="text-sm text-muted-foreground hover:underline underline-offset-4">
              로그인으로 돌아가기
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
