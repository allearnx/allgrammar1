// 공개 홍보 페이지 타입 정의

export type CourseCategory = 'grammar' | 'school_exam' | 'international' | 'voca' | 'reading';

export interface Course {
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
}

export interface CourseWithTeacher extends Course {
  teacher_profiles: TeacherProfile | null;
}

export interface TeacherProfile {
  id: string;
  created_at: string;
  user_id: string | null;
  display_name: string;
  bio: string;
  image_url: string | null;
  image_position: string;
  is_visible: boolean;
  sort_order: number;
}

export interface Review {
  id: string;
  created_at: string;
  student_grade: string;
  course_name: string;
  content: string;
  achievement: string | null;
  display_order: number;
  is_visible: boolean;
}

export type FAQCategory = 'general' | 'enrollment' | 'payment' | 'refund';

export interface FAQ {
  id: string;
  created_at: string;
  question: string;
  answer: string;
  category: FAQCategory;
  display_order: number;
  is_visible: boolean;
}

export interface Consultation {
  id: string;
  created_at: string;
  student_name: string;
  grade: string;
  parent_phone: string;
  interest_course_ids: string[];
  status: string;
  memo: string;
}

// 카테고리 라벨 매핑
export const CATEGORY_LABELS: Record<CourseCategory, string> = {
  grammar: '문법',
  school_exam: '내신',
  international: '국제학교/유학생',
  voca: '올킬보카',
  reading: '리딩',
};

// 학년 옵션
export const GRADE_OPTIONS = [
  { value: 'elementary_4', label: '초등 4학년' },
  { value: 'elementary_5', label: '초등 5학년' },
  { value: 'elementary_6', label: '초등 6학년' },
  { value: 'middle_1', label: '중등 1학년' },
  { value: 'middle_2', label: '중등 2학년' },
  { value: 'middle_3', label: '중등 3학년' },
  { value: 'high_1', label: '고등 1학년' },
  { value: 'high_2', label: '고등 2학년' },
  { value: 'high_3', label: '고등 3학년' },
];

// 가격 포맷
export const formatPrice = (price: number): string =>
  new Intl.NumberFormat('ko-KR').format(price);

// FAQ 카테고리 라벨
export const FAQ_CATEGORY_LABELS: Record<FAQCategory, string> = {
  general: '일반',
  enrollment: '수강신청',
  payment: '결제문의',
  refund: '환불',
};

// 카테고리별 페이지 테마 설정
export type CategoryPageTheme = {
  englishTitle: string;
  highlightedTitle: string;
  titleSuffix?: string;
  description: string;
  heroBgClass: string;
  heroTitleGradientClass: string;
  loadingColorClass: string;
  badgeColorClass: string;
  cardHoverTextClass: string;
  teacherBorderClass: string;
  teacherFallbackBgClass: string;
  teacherFallbackIconClass: string;
  priceColorClass: string;
  emptyBgClass: string;
  emptyIconClass: string;
  ctaBgClass: string;
};

export const CATEGORY_PAGE_CONFIG: Record<CourseCategory, CategoryPageTheme> = {
  grammar: {
    englishTitle: 'Grammar Course',
    highlightedTitle: '문법',
    titleSuffix: ' 강의',
    description: '체계적인 문법 학습으로 영어의 기초를 완성하세요',
    heroBgClass: 'from-violet-50 to-white',
    heroTitleGradientClass: 'from-violet-600 via-purple-500 to-cyan-400',
    loadingColorClass: 'text-violet-500',
    badgeColorClass: 'bg-violet-500',
    cardHoverTextClass: 'group-hover:text-violet-600',
    teacherBorderClass: 'border-violet-100',
    teacherFallbackBgClass: 'bg-violet-100',
    teacherFallbackIconClass: 'text-violet-500',
    priceColorClass: 'text-violet-600',
    emptyBgClass: 'bg-violet-100',
    emptyIconClass: 'text-violet-400',
    ctaBgClass: 'bg-violet-50',
  },
  voca: {
    englishTitle: 'Vocabulary Course',
    highlightedTitle: '올킬보카',
    description: '실시간 소통으로 완성하는 어휘력',
    heroBgClass: 'from-rose-50 to-white',
    heroTitleGradientClass: 'from-rose-500 via-pink-500 to-orange-400',
    loadingColorClass: 'text-rose-500',
    badgeColorClass: 'bg-rose-500',
    cardHoverTextClass: 'group-hover:text-rose-600',
    teacherBorderClass: 'border-rose-100',
    teacherFallbackBgClass: 'bg-rose-100',
    teacherFallbackIconClass: 'text-rose-500',
    priceColorClass: 'text-rose-600',
    emptyBgClass: 'bg-rose-100',
    emptyIconClass: 'text-rose-400',
    ctaBgClass: 'bg-rose-50',
  },
  reading: {
    englishTitle: 'Reading Course',
    highlightedTitle: '리딩',
    titleSuffix: ' 강의',
    description: '독해력과 읽기 능력을 한 단계 높여주는 리딩 수업',
    heroBgClass: 'from-amber-50 to-white',
    heroTitleGradientClass: 'from-amber-600 via-orange-500 to-yellow-400',
    loadingColorClass: 'text-amber-500',
    badgeColorClass: 'bg-amber-500',
    cardHoverTextClass: 'group-hover:text-amber-600',
    teacherBorderClass: 'border-amber-100',
    teacherFallbackBgClass: 'bg-amber-100',
    teacherFallbackIconClass: 'text-amber-500',
    priceColorClass: 'text-amber-600',
    emptyBgClass: 'bg-amber-100',
    emptyIconClass: 'text-amber-400',
    ctaBgClass: 'bg-amber-50',
  },
  school_exam: {
    englishTitle: 'School Exam Course',
    highlightedTitle: '내신',
    titleSuffix: ' 강의',
    description: '내신 영어 만점을 향한 체계적인 학습',
    heroBgClass: 'from-emerald-50 to-white',
    heroTitleGradientClass: 'from-emerald-600 via-teal-500 to-cyan-400',
    loadingColorClass: 'text-emerald-500',
    badgeColorClass: 'bg-emerald-500',
    cardHoverTextClass: 'group-hover:text-emerald-600',
    teacherBorderClass: 'border-emerald-100',
    teacherFallbackBgClass: 'bg-emerald-100',
    teacherFallbackIconClass: 'text-emerald-500',
    priceColorClass: 'text-emerald-600',
    emptyBgClass: 'bg-emerald-100',
    emptyIconClass: 'text-emerald-400',
    ctaBgClass: 'bg-emerald-50',
  },
  international: {
    englishTitle: 'International School & Study Abroad',
    highlightedTitle: '국제학교/유학생',
    titleSuffix: ' 강의',
    description: '국제학교 재학생과 해외 유학생을 위한 맞춤형 영어 수업',
    heroBgClass: 'from-sky-50 to-white',
    heroTitleGradientClass: 'from-sky-600 via-blue-500 to-indigo-400',
    loadingColorClass: 'text-sky-500',
    badgeColorClass: 'bg-sky-500',
    cardHoverTextClass: 'group-hover:text-sky-600',
    teacherBorderClass: 'border-sky-100',
    teacherFallbackBgClass: 'bg-sky-100',
    teacherFallbackIconClass: 'text-sky-500',
    priceColorClass: 'text-sky-600',
    emptyBgClass: 'bg-sky-100',
    emptyIconClass: 'text-sky-400',
    ctaBgClass: 'bg-sky-50',
  },
};

export function isCourseCategory(value: string): value is CourseCategory {
  return value in CATEGORY_PAGE_CONFIG;
}
