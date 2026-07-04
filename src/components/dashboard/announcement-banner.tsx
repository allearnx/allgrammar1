'use client';

import { useEffect, useState, useCallback } from 'react';
import { Bell, X, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import type { AnnouncementWithRead } from '@/types/announcement';

export function AnnouncementBanner() {
  const [unread, setUnread] = useState<AnnouncementWithRead[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchWithToast<{
          announcements: AnnouncementWithRead[];
          unreadCount: number;
        }>('/api/announcements', { method: 'GET', silent: true });
        setUnread(data.announcements.filter((a) => !a.is_read));
      } catch {
        // silent
      }
    }
    load();
  }, []);

  const dismiss = useCallback(async (id: string) => {
    setDismissed((prev) => new Set(prev).add(id));
    try {
      await fetchWithToast('/api/announcements', {
        method: 'PATCH',
        body: { announcementId: id },
        silent: true,
      });
    } catch {
      // silent
    }
  }, []);

  const visible = unread.filter((a) => !dismissed.has(a.id));
  if (visible.length === 0) return null;

  // Topbar h-14 = 56px 바로 아래에 고정
  return (
    <div className="fixed top-14 left-0 right-0 z-20 pointer-events-none">
      <div className="pointer-events-auto px-4 md:pl-[17rem] md:pr-6 pt-2 space-y-2">
        {visible.map((a) => (
          <div
            key={a.id}
            className="flex items-center gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 shadow-sm"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 shrink-0">
              <Bell className="h-4 w-4 text-brand-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-brand-900 truncate">{a.title}</p>
              <p className="text-xs text-brand-600 line-clamp-1">{a.content}</p>
            </div>
            <Link
              href="/student/announcements"
              className="shrink-0 text-xs text-brand-600 hover:text-brand-800 font-medium flex items-center gap-0.5"
            >
              보기
              <ChevronRight className="h-3 w-3" />
            </Link>
            <button
              onClick={() => dismiss(a.id)}
              className="shrink-0 p-1 rounded hover:bg-brand-100 text-brand-400 hover:text-brand-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
