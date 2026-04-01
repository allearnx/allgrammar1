export type UserRole = 'student' | 'teacher' | 'admin' | 'boss';

export interface Academy {
  id: string;
  name: string;
  invite_code: string;
  contact_phone?: string | null;
  contact_email?: string | null;
  address?: string | null;
  logo_url?: string | null;
  business_number?: string | null;
  max_students?: number | null;
  onboarding_completed_at?: string | null;
  naesin_required_rounds?: number;
  owner_id?: string | null;
  created_at: string;
  updated_at?: string | null;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  academy_id: string | null;
  is_active: boolean;
  created_at: string;
}

export interface StudentSettings {
  student_id: string;
  daily_review_limit: number;
  theme: 'light' | 'dark' | 'system';
  language: 'ko' | 'en';
  created_at: string;
  updated_at: string;
}

export interface StudentWithProgress extends User {
  progress_summary: {
    total_videos: number;
    completed_videos: number;
    total_memory_items: number;
    mastered_memory_items: number;
    due_reviews: number;
  };
}
