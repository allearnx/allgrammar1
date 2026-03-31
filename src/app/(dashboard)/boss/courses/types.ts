import type { CourseCategory } from '@/types/public';

export interface CourseItem {
  id: string;
  created_at: string;
  title: string;
  category: CourseCategory;
  description: string;
  price: number;
  thumbnail_url: string | null;
  detail_image_url: string | null;
  teacher_id: string | null;
  is_active: boolean;
  sort_order: number;
  teacher_name: string | null;
}

export interface TeacherOption {
  id: string;
  display_name: string;
}

export interface CourseFormData {
  title: string;
  category: CourseCategory;
  description: string;
  price: number;
  thumbnail_url: string;
  detail_image_urls: string[];
  teacher_id: string;
  is_active: boolean;
  sort_order: number;
}

export const defaultForm: CourseFormData = {
  title: '',
  category: 'grammar',
  description: '',
  price: 0,
  thumbnail_url: '',
  detail_image_urls: [],
  teacher_id: '',
  is_active: true,
  sort_order: 0,
};

export const CATEGORIES: CourseCategory[] = ['grammar', 'school_exam', 'international', 'voca', 'reading'];
