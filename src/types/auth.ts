import { UserRole } from './database';

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  academy_id: string | null;
  phone?: string | null;
  is_homepage_manager?: boolean;
  can_manage_content?: boolean;
  /** 소속 학원의 내신 서비스 활성 여부 (올라영 전용 잠금 — boss는 항상 통과) */
  naesin_enabled?: boolean;
}

export interface SignUpData {
  email: string;
  password: string;
  full_name: string;
  role: UserRole;
  academy_id?: string;
}

export interface SignInData {
  email: string;
  password: string;
}
