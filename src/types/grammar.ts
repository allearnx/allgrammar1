export interface Grammar {
  id: string;
  level_id: string;
  title: string;
  description: string | null;
  youtube_url: string | null;
  youtube_video_id: string | null;
  video_duration_seconds: number | null;
  sort_order: number;
  created_at: string;
}

export interface Exam {
  id: string;
  academy_id: string;
  title: string;
  created_by: string;
  created_at: string;
}
