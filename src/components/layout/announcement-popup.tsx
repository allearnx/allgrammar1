'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Megaphone } from 'lucide-react';
import { useAnnouncements } from '@/hooks/use-announcements';
import { ANNOUNCEMENT_TYPE_LABELS } from '@/types/announcement';

/**
 * 공지 팝업 — popup=true인 공지를 읽지 않은 스태프에게 로그인 시 모달로 표시.
 * 학원 범위 공지(academy_id)를 그 학원 스태프에게만 띄우는 용도 (예: 내신 콕콕 배정 알림).
 * "확인했어요"는 서버 읽음 처리(announcement_reads)라 기기가 바뀌어도 다시 안 뜬다.
 * 업데이트 팝업(update-popup.tsx)과 달리 개별 공지 단위로 동작.
 */
export function AnnouncementPopup({ announcementsHref }: { announcementsHref: string }) {
  const { announcements, markAsRead, loading } = useAnnouncements();
  const target = useMemo(() => announcements.find((a) => a.popup && !a.is_read) ?? null, [announcements]);
  if (loading || !target) return null;

  const typeLabel = ANNOUNCEMENT_TYPE_LABELS[target.type] ?? '공지';
  const date = target.published_at ? target.published_at.slice(0, 10) : '';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900">
        <div className="mb-3 flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-amber-500" />
          <span className="rounded-full bg-amber-500 px-2.5 py-0.5 text-[11px] font-bold text-white">{typeLabel}</span>
          <span className="text-xs text-gray-400">{date}</span>
        </div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{target.title}</h2>
        <p className="mt-3 max-h-72 overflow-y-auto whitespace-pre-line text-sm leading-relaxed text-gray-600 dark:text-gray-300">
          {target.content}
        </p>
        <div className="mt-5 flex gap-2">
          <button
            onClick={() => markAsRead(target.id)}
            className="flex-1 rounded-xl bg-brand-600 py-2.5 text-sm font-bold text-white hover:bg-brand-700"
          >
            확인했어요
          </button>
          <Link
            href={announcementsHref}
            onClick={() => markAsRead(target.id)}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-50 dark:border-gray-700"
          >
            공지 보기
          </Link>
        </div>
      </div>
    </div>
  );
}
