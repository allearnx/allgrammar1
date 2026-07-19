'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Link2, Check, RefreshCw, Loader2, X, ExternalLink, BookA } from 'lucide-react';
import { fetchWithToast } from '@/lib/fetch-with-toast';

interface Props {
  studentId: string;
}

export function ParentShareButton({ studentId }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  // 어느 링크를 복사했는지 구분 — 전체 리포트('full') vs 올킬보카 성적표('voca', ?tab=voca)
  const [copied, setCopied] = useState<'full' | 'voca' | null>(null);
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

  const copyLink = async (type: 'full' | 'voca') => {
    if (!token) return;
    const url = `${window.location.origin}/parent/${token}${type === 'voca' ? '?tab=voca' : ''}`;
    await navigator.clipboard.writeText(url);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
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
          <Button variant="outline" size="sm" onClick={() => copyLink('full')} className="gap-1.5" title="내신+보카 통합 리포트 링크">
            {copied === 'full' ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Link2 className="h-3.5 w-3.5" />}
            {copied === 'full' ? '복사됨' : '전체 리포트'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => copyLink('voca')} className="gap-1.5" title="올킬보카 성적표만 (카톡 미리보기도 올킬보카 이미지)">
            {copied === 'voca' ? <Check className="h-3.5 w-3.5 text-green-500" /> : <BookA className="h-3.5 w-3.5" />}
            {copied === 'voca' ? '복사됨' : '보카 성적표'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`/parent/${token}`, '_blank')}
            className="gap-1.5"
            title="학부모가 보는 화면 그대로 열기"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            미리보기
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
