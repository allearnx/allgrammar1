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
  voca_exam_pass_score_default?: number | null;
  voca_exam_seconds_per_word_default?: number | null;
  voca_exam_retry_wrong_default?: boolean | null;
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

