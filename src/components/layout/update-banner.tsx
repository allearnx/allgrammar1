'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { X, Sparkles } from 'lucide-react';
import { LATEST_UPDATE } from '@/lib/updates';

const STORAGE_KEY = 'dismissed_update';

/** 상단 최신 업데이트 배너 — X로 닫으면 그 업데이트는 다시 안 뜸 (새 업데이트 나오면 다시 표시). */
export function UpdateBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!LATEST_UPDATE) return;
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage는 마운트 후에만 읽을 수 있음
      if (localStorage.getItem(STORAGE_KEY) !== LATEST_UPDATE.id) setShow(true);
    } catch {
      setShow(true);
    }
  }, []);

  const latest = LATEST_UPDATE;
  if (!latest || !show) return null;

  const dismiss = () => {
    try { localStorage.setItem(STORAGE_KEY, latest.id); } catch { /* ignore */ }
    setShow(false);
  };

  return (
    <div className="flex items-center gap-2 border-b border-indigo-100 bg-gradient-to-r from-indigo-50 to-violet-50 px-4 py-2">
      <Sparkles className="h-4 w-4 shrink-0 text-indigo-500" />
      <span className="shrink-0 rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white">새 업데이트</span>
      <Link href="/updates" className="min-w-0 flex-1 truncate text-sm font-medium text-indigo-800 hover:underline">
        {latest.title}
      </Link>
      <Link href="/updates" className="hidden shrink-0 text-xs font-semibold text-indigo-500 hover:underline sm:inline">
        자세히 보기
      </Link>
      <button onClick={dismiss} aria-label="닫기" className="shrink-0 rounded p-1 text-indigo-400 hover:bg-indigo-100 hover:text-indigo-600">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
