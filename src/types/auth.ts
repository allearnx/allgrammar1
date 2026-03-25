import { UserRole } from './database';

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  academy_id: string | null;
  phone?: string | null;
  is_homepage_manager?: boolean;
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
