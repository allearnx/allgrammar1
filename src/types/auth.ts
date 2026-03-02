import { UserRole } from './database';

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  academy_id: string | null;
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
