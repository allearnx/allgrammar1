'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Eye, Loader2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

export function ImpersonateButton({ studentId }: { studentId: string }) {
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const data = await fetchWithToast<{ url: string }>('/api/admin/impersonate', {
        body: { studentId },
        errorMessage: '링크 생성 실패',
        silent: true,
      });
      setUrl(data.url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '링크 생성 실패');
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('복사됨 — 시크릿 모드에서 붙여넣기하세요');
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={handleClick} disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Eye className="h-4 w-4 mr-1" />}
        학생 화면 보기
      </Button>

      <Dialog open={!!url} onOpenChange={(v) => { if (!v) { setUrl(null); setCopied(false); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>학생 로그인 링크</DialogTitle>
            <DialogDescription>
              시크릿 모드(Ctrl+Shift+N)에서 아래 링크를 열어주세요.
              현재 브라우저에서 열면 내 로그인이 풀립니다.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <code className="flex-1 rounded bg-muted px-3 py-2 text-xs break-all max-h-20 overflow-y-auto">
              {url}
            </code>
            <Button size="icon" variant="outline" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            링크는 1회용이며 24시간 후 만료됩니다.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
