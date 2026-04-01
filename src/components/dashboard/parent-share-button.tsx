'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Link2, Check, RefreshCw, Loader2, X } from 'lucide-react';
import { fetchWithToast } from '@/lib/fetch-with-toast';

interface Props {
  studentId: string;
}

export function ParentShareButton({ studentId }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [fetched, setFetched] = useState(false);

  const fetchToken = async () => {
    setLoading(true);
    try {
      const data = await fetchWithToast<{ token?: string }>(`/api/parent-share?studentId=${studentId}`, {
        method: 'GET',
        silent: true,
      });
      setToken(data?.token || null);
    } catch {
      // silent GET — ignore errors
    } finally {
      setLoading(false);
      setFetched(true);
    }
  };

  const generateToken = async () => {
    setLoading(true);
    try {
      const data = await fetchWithToast<{ token: string }>('/api/parent-share', {
        body: { studentId },
        silent: true,
      });
      setToken(data.token);
    } catch {
      // silent — ignore errors
    } finally {
      setLoading(false);
    }
  };

  const revokeToken = async () => {
    setLoading(true);
    try {
      await fetchWithToast('/api/parent-share', {
        method: 'DELETE',
        body: { studentId },
        silent: true,
      });
      setToken(null);
    } catch {
      // silent — ignore errors
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    if (!token) return;
    const url = `${window.location.origin}/parent/${token}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpen = async () => {
    setOpen(true);
    if (!fetched) await fetchToken();
  };

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={handleOpen} className="gap-1.5">
        <Link2 className="h-3.5 w-3.5" />
        학부모 링크
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
      ) : token ? (
        <>
          <Button variant="outline" size="sm" onClick={copyLink} className="gap-1.5">
            {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Link2 className="h-3.5 w-3.5" />}
            {copied ? '복사됨' : '링크 복사'}
          </Button>
          <Button variant="outline" size="sm" onClick={generateToken} className="gap-1.5" title="재발급">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={revokeToken} className="gap-1.5 text-red-500 hover:text-red-600" title="비활성화">
            <X className="h-3.5 w-3.5" />
          </Button>
        </>
      ) : (
        <Button variant="outline" size="sm" onClick={generateToken} className="gap-1.5">
          <Link2 className="h-3.5 w-3.5" />
          링크 생성
        </Button>
      )}
      <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
        닫기
      </Button>
    </div>
  );
}
