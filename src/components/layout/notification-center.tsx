'use client';

import Link from 'next/link';
import { Bell, X, Info, AlertTriangle, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAnnouncements } from '@/hooks/use-announcements';
import type { AnnouncementWithRead, AnnouncementType } from '@/types/announcement';
import { cn } from '@/lib/utils';

const typeIcons: Record<AnnouncementType, React.ComponentType<{ className?: string }>> = {
  info: Info,
  warning: AlertTriangle,
  important: AlertCircle,
};

const typeColors: Record<AnnouncementType, string> = {
  info: 'text-blue-500',
  warning: 'text-amber-500',
  important: 'text-red-500',
};

const bannerStyles: Record<AnnouncementType, string> = {
  info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/50 dark:border-blue-800 dark:text-blue-200',
  warning: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/50 dark:border-amber-800 dark:text-amber-200',
  important: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/50 dark:border-red-800 dark:text-red-200',
};

function AnnouncementItem({
  announcement,
  onRead,
}: {
  announcement: AnnouncementWithRead;
  onRead: (id: string) => void;
}) {
  const Icon = typeIcons[announcement.type] ?? Info;
  return (
    <div
      className={cn(
        'flex gap-2 p-3 border-b last:border-b-0 cursor-pointer hover:bg-muted/50 transition-colors',
        !announcement.is_read && 'bg-muted/30'
      )}
      onClick={() => { if (!announcement.is_read) onRead(announcement.id); }}
    >
      <Icon className={cn('h-4 w-4 mt-0.5 shrink-0', typeColors[announcement.type])} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn('text-sm truncate', !announcement.is_read && 'font-semibold')}>
            {announcement.title}
          </span>
          {!announcement.is_read && (
            <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
          )}
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
          {announcement.content}
        </p>
      </div>
    </div>
  );
}

function BannerItem({
  announcement,
  onDismiss,
}: {
  announcement: AnnouncementWithRead;
  onDismiss: (id: string) => void;
}) {
  const Icon = typeIcons[announcement.type] ?? Info;
  return (
    <div className={cn('flex items-center gap-2 px-4 py-2 border-b text-sm', bannerStyles[announcement.type] ?? bannerStyles.info)}>
      <Icon className="h-4 w-4 shrink-0" />
      <span className="font-medium">{announcement.title}</span>
      <span className="hidden sm:inline text-xs opacity-80">— {announcement.content}</span>
      <Button
        variant="ghost"
        size="icon"
        className="ml-auto h-6 w-6 shrink-0 hover:bg-black/10 dark:hover:bg-white/10"
        onClick={() => onDismiss(announcement.id)}
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

/** 역할별 공지사항 전체 페이지 경로 */
const ANNOUNCEMENTS_PAGE: Record<string, string> = {
  student: '/student/announcements',
  teacher: '/teacher/announcements',
  admin: '/admin/announcements',
  boss: '/boss/announcements',
};

export function NotificationCenter({ role }: { role?: string }) {
  const { announcements, unreadCount, unreadImportant, markAsRead, loading } = useAnnouncements();
  const announcementsHref = role ? ANNOUNCEMENTS_PAGE[role] : undefined;

  if (loading) return null;

  return (
    <>
      {/* Bell icon with dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative h-8 w-8">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] flex items-center justify-center bg-red-500 text-white border-0">
                {unreadCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80 p-0">
          <div className="px-3 py-2 border-b font-medium text-sm">
            공지사항
            {unreadCount > 0 && (
              <span className="text-muted-foreground ml-1">({unreadCount}개 미읽음)</span>
            )}
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {announcements.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                공지사항이 없습니다
              </div>
            ) : (
              announcements.map((a) => (
                <AnnouncementItem key={a.id} announcement={a} onRead={markAsRead} />
              ))
            )}
          </div>
          {announcementsHref && (
            <Link
              href={announcementsHref}
              className="flex items-center justify-center gap-1 border-t px-3 py-2 text-sm font-medium text-blue-600 hover:bg-muted/50 transition-colors"
            >
              전체 공지 보기
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Important banners — rendered via portal-like pattern in topbar */}
      {unreadImportant.length > 0 && (
        <div className="fixed top-14 left-0 right-0 z-29">
          {unreadImportant.map((a) => (
            <BannerItem key={a.id} announcement={a} onDismiss={markAsRead} />
          ))}
        </div>
      )}
    </>
  );
}
