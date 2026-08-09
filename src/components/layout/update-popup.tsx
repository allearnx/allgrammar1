'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { LATEST_POPUP_UPDATE, TAG_LABEL } from '@/lib/updates';

const STORAGE_KEY = 'dismissed_update_popup';

/**
 * 중요 업데이트 로그인 팝업 — popup: true인 최신 업데이트를 스태프에게 1회 표시.
 * 확인을 누르면 그 업데이트는 다시 안 뜸 (새 popup 업데이트가 나오면 다시 표시).
 * 상단 배너보다 확실히 눈에 띄게 — 사용 방식이 바뀌는 개편 전달용 (2026-08-09 사장님 요청).
 * 남발 금지: updates.ts에서 popup: true는 진짜 중요한 것에만.
 */
export function UpdatePopup() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!LATEST_POPUP_UPDATE) return;
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage는 마운트 후에만 읽을 수 있음
      if (localStorage.getItem(STORAGE_KEY) !== LATEST_POPUP_UPDATE.id) setShow(true);
    } catch {
      setShow(true);
    }
  }, []);

  const update = LATEST_POPUP_UPDATE;
  if (!update || !show) return null;

  const dismiss = () => {
    try { localStorage.setItem(STORAGE_KEY, update.id); } catch { /* ignore */ }
    setShow(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-brand-500" />
          <span className="rounded-full bg-brand-600 px-2.5 py-0.5 text-[11px] font-bold text-white">{TAG_LABEL[update.tag]}</span>
          <span className="text-xs text-gray-400">{update.date}</span>
        </div>
        <h2 className="text-lg font-bold text-gray-900">{update.title}</h2>
        <p className="mt-3 max-h-72 overflow-y-auto whitespace-pre-line text-sm leading-relaxed text-gray-600">
          {update.body}
        </p>
        <div className="mt-5 flex gap-2">
          <button
            onClick={dismiss}
            className="flex-1 rounded-xl bg-brand-600 py-2.5 text-sm font-bold text-white hover:bg-brand-700"
          >
            확인했어요
          </button>
          <Link
            href="/updates"
            onClick={dismiss}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-50"
          >
            전체 보기
          </Link>
        </div>
      </div>
    </div>
  );
}
