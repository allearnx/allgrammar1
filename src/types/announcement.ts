export type AnnouncementType = 'info' | 'warning' | 'important';

export const ANNOUNCEMENT_TYPE_LABELS: Record<AnnouncementType, string> = {
  info: '정보',
  warning: '주의',
  important: '중요',
};

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: AnnouncementType;
  target_roles: string[];
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AnnouncementWithRead extends Announcement {
  is_read: boolean;
}
