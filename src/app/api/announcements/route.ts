import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api/handler';
import { announcementReadSchema } from '@/lib/api/schemas';
import { dbResult } from '@/lib/api/errors';

// GET: 공개된 공지 + 읽음 여부 조회
export const GET = createApiHandler(
  { roles: ['student', 'teacher', 'admin', 'boss'], hasBody: false },
  async ({ user, supabase }) => {
    // Fetch published announcements where user's role is in target_roles
    // 2주 지난 공지는 자동으로 숨김
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const announcements = dbResult(
      await supabase
        .from('announcements')
        .select('*')
        .eq('is_published', true)
        .contains('target_roles', [user.role])
        .gte('published_at', twoWeeksAgo)
        .order('published_at', { ascending: false })
    ) ?? [];

    if (announcements.length === 0) {
      return NextResponse.json({ announcements: [], unreadCount: 0 });
    }

    // Fetch reads for current user
    const ids = announcements.map((a: { id: string }) => a.id);
    const reads = dbResult(
      await supabase
        .from('announcement_reads')
        .select('announcement_id')
        .eq('user_id', user.id)
        .in('announcement_id', ids)
    ) ?? [];

    const readSet = new Set(reads.map((r: { announcement_id: string }) => r.announcement_id));

    const withRead = announcements.map((a: { id: string }) => ({
      ...a,
      is_read: readSet.has(a.id),
    }));

    const unreadCount = withRead.filter((a: { is_read: boolean }) => !a.is_read).length;

    return NextResponse.json({ announcements: withRead, unreadCount });
  }
);

// PATCH: 읽음 처리
export const PATCH = createApiHandler(
  { roles: ['student', 'teacher', 'admin', 'boss'], schema: announcementReadSchema },
  async ({ user, body, supabase }) => {
    dbResult(
      await supabase
        .from('announcement_reads')
        .upsert(
          { user_id: user.id, announcement_id: body.announcementId },
          { onConflict: 'user_id,announcement_id' }
        )
    );
    return NextResponse.json({ success: true });
  }
);
