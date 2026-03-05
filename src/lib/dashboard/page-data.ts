import { requireRole } from '@/lib/auth/helpers';
import { fetchContentData, fetchTextbookData, fetchStudentsList, fetchTeachersList } from './queries';
import type { UserRole } from '@/types/database';

export async function getContentPageData(roles: UserRole[]) {
  const user = await requireRole(roles);
  const levels = await fetchContentData();
  return { user, levels };
}

export async function getTextbookModePageData(roles: UserRole[]) {
  const user = await requireRole(roles);
  const passages = await fetchTextbookData();
  return { user, passages };
}

export async function getReportsPageData(roles: UserRole[]) {
  const user = await requireRole(roles);
  const students = await fetchStudentsList(user.academy_id);
  return { user, students };
}

export async function getStudentsPageData(roles: UserRole[]) {
  const user = await requireRole(roles);
  return { user };
}

export async function getTeachersPageData(roles: UserRole[]) {
  const user = await requireRole(roles);
  const teachers = await fetchTeachersList(user.academy_id);
  return { user, teachers };
}
