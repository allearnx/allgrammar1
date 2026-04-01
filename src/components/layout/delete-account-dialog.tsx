'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { fetchWithToast } from '@/lib/fetch-with-toast';
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

interface DeleteAccountDialogProps {
  apiEndpoint?: string;
  warning?: string;
}

const CONFIRM_TEXT = '삭제합니다';

export function DeleteAccountDialog({
  apiEndpoint = '/api/student/delete-account',
  warning = '모든 학습 데이터가 영구 삭제됩니다.',
}: DeleteAccountDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);

  function reset() {
    setPassword('');
    setConfirmText('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      await fetchWithToast(apiEndpoint, {
        body: { password },
        successMessage: '계정이 삭제되었습니다.',
        errorMessage: '계정 삭제에 실패했습니다.',
      });

      // 클라이언트 세션 정리
      const supabase = createClient();
      await supabase.auth.signOut();
      await fetch('/api/auth/logout', { method: 'POST' });

      router.push('/login');
      router.refresh();
    } catch {
      // fetchWithToast already shows error toast
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
          <div className="space-y-2">
            <Label htmlFor="delete-confirm">
              확인을 위해 <span className="font-bold text-red-600">{CONFIRM_TEXT}</span>를 입력하세요
            </Label>
            <Input
              id="delete-confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={CONFIRM_TEXT}
              autoComplete="off"
            />
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={loading || confirmText !== CONFIRM_TEXT}
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
