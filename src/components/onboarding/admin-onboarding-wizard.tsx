'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Copy, Check, Rocket } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  inviteCode: string;
}

export function AdminOnboardingWizard({ inviteCode }: Props) {
  const [open, setOpen] = useState(true);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  function handleCopy() {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    toast.success('초대 코드가 복사되었습니다');
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleComplete() {
    setSaving(true);
    try {
      await fetch('/api/admin/onboarding-complete', { method: 'POST' });
      setOpen(false);
      router.refresh();
    } catch {
      toast.error('저장 중 오류가 발생했습니다');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md p-0 overflow-hidden" onInteractOutside={(e) => e.preventDefault()}>
        <div
          className="relative overflow-hidden px-6 pt-6 pb-5 text-white"
          style={{ background: 'linear-gradient(135deg, #A78BFA 0%, #7C3AED 50%, #6D28D9 100%)' }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white text-lg">
              <Rocket className="h-5 w-5" />
              학원 초대 코드
            </DialogTitle>
            <DialogDescription className="text-white/70 text-sm mt-0.5">
              학생과 선생님에게 공유하세요
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 pb-6 pt-4">
          <div className="flex flex-col items-center gap-4 py-4">
            <div
              className="rounded-2xl px-8 py-5"
              style={{ background: 'linear-gradient(120deg, #F5F3FF, #EDE9FE)' }}
            >
              <code className="text-3xl font-mono font-bold tracking-[0.3em]" style={{ color: '#7C3AED' }}>
                {inviteCode}
              </code>
            </div>
            <button
              onClick={handleCopy}
              className="inline-flex items-center rounded-full px-4 py-2 text-xs font-semibold text-white transition-all"
              style={{ background: '#7C3AED', boxShadow: '0 4px 12px rgba(124,58,237,0.25)' }}
            >
              {copied ? <Check className="h-3.5 w-3.5 mr-1.5" /> : <Copy className="h-3.5 w-3.5 mr-1.5" />}
              {copied ? '복사됨!' : '코드 복사'}
            </button>
            <p className="text-sm text-gray-500 text-center leading-relaxed">
              학생과 선생님이 회원가입 시 이 코드를 입력하면<br />
              자동으로 학원에 배정됩니다.
            </p>
          </div>

          <div className="flex justify-end mt-2">
            <button
              onClick={handleComplete}
              disabled={saving}
              className="inline-flex items-center rounded-[10px] px-5 py-2 text-sm font-bold text-white transition-all disabled:opacity-50"
              style={{ background: '#7C3AED', boxShadow: '0 4px 12px rgba(124,58,237,0.25)' }}
            >
              {saving ? '저장 중...' : '확인'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
