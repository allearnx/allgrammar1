'use client';

import { Info, AlertTriangle, AlertCircle, Megaphone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAnnouncements } from '@/hooks/use-announcements';
import type { AnnouncementWithRead, AnnouncementType } from '@/types/announcement';
import { ANNOUNCEMENT_TYPE_LABELS } from '@/types/announcement';
import { cn } from '@/lib/utils';

const typeIcons: Record<AnnouncementType, React.ComponentType<{ className?: string }>> = {
  info: Info,
  warning: AlertTriangle,
  important: AlertCircle,
};

const typeBadgeColors: Record<AnnouncementType, string> = {
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  important: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
};

function AnnouncementCard({
  announcement,
  onRead,
}: {
  announcement: AnnouncementWithRead;
  onRead: (id: string) => void;
}) {
  // type 누락/신규 값 방어 — 아이콘·배지는 info로 폴백 (undefined면 렌더 전체가 터진다)
  const type: AnnouncementType = typeIcons[announcement.type] ? announcement.type : 'info';
  const Icon = typeIcons[type];

  return (
    <div
      className={cn(
        'rounded-lg border p-4 transition-colors cursor-pointer hover:bg-muted/50',
        !announcement.is_read && 'border-blue-300 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/30'
      )}
      onClick={() => { if (!announcement.is_read) onRead(announcement.id); }}
    >
      <div className="flex items-start gap-3">
        <Icon className={cn('h-5 w-5 mt-0.5 shrink-0', typeBadgeColors[type].split(' ')[1])} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className={cn('text-sm', !announcement.is_read ? 'font-semibold' : 'font-medium')}>
              {announcement.title}
            </h3>
            <Badge variant="secondary" className={cn('text-[10px]', typeBadgeColors[type])}>
              {ANNOUNCEMENT_TYPE_LABELS[type]}
            </Badge>
            {!announcement.is_read && (
              <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
            {announcement.content}
          </p>
          {announcement.published_at && (
            <p className="text-xs text-muted-foreground mt-2">
              {new Date(announcement.published_at).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function AnnouncementsReadOnly() {
  const { announcements, unreadCount, markAsRead, loading } = useAnnouncements();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
        불러오는 중...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          총 {announcements.length}개
          {unreadCount > 0 && (
            <span className="ml-1 text-blue-600 dark:text-blue-400 font-medium">
              ({unreadCount}개 미읽음)
            </span>
          )}
        </p>
      </div>

      {announcements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Megaphone className="h-10 w-10 mb-3 opacity-40" />
          <p className="text-sm">공지사항이 없습니다</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <AnnouncementCard key={a.id} announcement={a} onRead={markAsRead} />
          ))}
        </div>
      )}
    </div>
  );
}
