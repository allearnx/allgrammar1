'use client';

import { useEffect, useState, useCallback } from 'react';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import type { AnnouncementWithRead } from '@/types/announcement';

interface UseAnnouncementsReturn {
  announcements: AnnouncementWithRead[];
  unreadCount: number;
  unreadImportant: AnnouncementWithRead[];
  markAsRead: (id: string) => Promise<void>;
  loading: boolean;
}

export function useAnnouncements(): UseAnnouncementsReturn {
  const [announcements, setAnnouncements] = useState<AnnouncementWithRead[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchWithToast<{
          announcements: AnnouncementWithRead[];
          unreadCount: number;
        }>('/api/announcements', { method: 'GET', silent: true });
        setAnnouncements(data.announcements);
        setUnreadCount(data.unreadCount);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const unreadImportant = announcements.filter(
    (a) => !a.is_read && a.type === 'important'
  );

  const markAsRead = useCallback(async (id: string) => {
    try {
      await fetchWithToast('/api/announcements', {
        method: 'PATCH',
        body: { announcementId: id },
        silent: true,
      });
      // Update local state without refetch
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === id ? { ...a, is_read: true } : a))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // silent
    }
  }, []);

  return { announcements, unreadCount, unreadImportant, markAsRead, loading };
}
