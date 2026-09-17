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
  /** null = 전체 학원, 값이 있으면 그 학원 스태프에게만 */
  academy_id?: string | null;
  /** 스태프 로그인 시 읽지 않은 동안 모달로 표시 */
  popup?: boolean;
}

export interface AnnouncementWithRead extends Announcement {
  is_read: boolean;
}
