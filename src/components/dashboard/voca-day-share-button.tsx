'use client';

import { useState } from 'react';
import { Check, Link2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchWithToast } from '@/lib/fetch-with-toast';

interface Props {
  studentId: string;
  dayId?: string;
}

export function VocaDayShareButton({ studentId }: Props) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    setLoading(true);
    try {
      // 1. Check for existing token
      let token: string | null = null;
      const existing = await fetchWithToast<{ token?: string }>(
        `/api/parent-share?studentId=${studentId}`,
        { method: 'GET', silent: true },
      );
      token = existing?.token || null;

      // 2. Generate if none exists
      if (!token) {
        const created = await fetchWithToast<{ token: string }>('/api/parent-share', {
          body: { studentId },
          silent: true,
        });
        token = created.token;
      }

      // 3. Copy URL — 종합 리포트 링크 (오늘 학습 섹션이 자동 표시됨)
      const url = `${window.location.origin}/parent/${token}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="ghost" size="sm" onClick={handleCopy} disabled={loading} className="gap-1">
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : copied ? (
        <Check className="h-3.5 w-3.5 text-green-500" />
      ) : (
        <Link2 className="h-3.5 w-3.5" />
      )}
      {copied ? '복사됨' : '링크'}
    </Button>
  );
}
