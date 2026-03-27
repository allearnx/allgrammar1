'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { UserX } from 'lucide-react';
import { toast } from 'sonner';

interface DeleteAccountDialogProps {
  apiEndpoint?: string;
  warning?: string;
}

export function DeleteAccountDialog({
  apiEndpoint = '/api/student/delete-account',
  warning = '모든 학습 데이터가 영구 삭제됩니다.',
}: DeleteAccountDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  function reset() {
    setPassword('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || '계정 삭제에 실패했습니다.');
        return;
      }

      // 클라이언트 세션 정리
      const supabase = createClient();
      await supabase.auth.signOut();
      await fetch('/api/auth/logout', { method: 'POST' });

      toast.success('계정이 삭제되었습니다.');
      router.push('/login');
      router.refresh();
    } catch {
      toast.error('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-slate-400 hover:text-red-600 hover:bg-red-50"
        >
          <UserX className="h-4 w-4" />
          회원 탈퇴
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>회원 탈퇴</DialogTitle>
          <DialogDescription>
            계정을 삭제하면 되돌릴 수 없습니다.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {warning}
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="delete-password">비밀번호 확인</Label>
            <Input
              id="delete-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="현재 비밀번호를 입력하세요"
              autoComplete="current-password"
            />
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={loading}
              variant="destructive"
              className="w-full"
            >
              {loading ? '삭제 중...' : '계정 삭제'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
