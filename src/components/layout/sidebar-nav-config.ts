import {
  ClipboardList,
  CreditCard,
  BarChart3,
  GraduationCap,
  LayoutDashboard,
  NotebookPen,
  Receipt,
  Settings,
  Users,
  FileDown,
  FileText,
  BookMarked,
  BookA,
  MessageSquare,
  BookOpen,
  UserCircle,
  Star,
  HelpCircle,
} from 'lucide-react';
import type { NaesinStageStatuses } from '@/types/database';

export interface NaesinSidebarExam {
  round: number;
  label: string;
  examDate: string | null;
  units: {
    id: string;
    unitNumber: number;
    title: string;
    stageStatuses: NaesinStageStatuses;
  }[];
}

export interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

export const NAV_CONFIG: Record<string, NavGroup[]> = {
  student: [
    {
      items: [
        { href: '/student', label: '대시보드', icon: LayoutDashboard },
      ],
    },
    {
      label: '학습',
      items: [
        { href: '/student/naesin', label: '올인내신', icon: BookMarked },
        { href: '/student/voca', label: '올킬보카', icon: BookA },
      ],
    },
    {
      items: [
        { href: '/student/my-report', label: '내 리포트', icon: FileText },
        { href: '/student/materials', label: '학습자료', icon: FileDown },
      ],
    },
  ],
  teacher: [
    {
      items: [
        { href: '/teacher', label: '대시보드', icon: LayoutDashboard },
      ],
    },
    {
      label: '관리',
      items: [
        { href: '/teacher/students', label: '학생 관리', icon: Users },
      ],
    },
    {
      label: '콘텐츠',
      items: [
        { href: '/teacher/naesin', label: '내신 관리', icon: ClipboardList },
        { href: '/teacher/voca', label: '올킬보카 관리', icon: BookA },
      ],
    },
    {
      items: [
        { href: '/teacher/reports', label: '리포트', icon: FileText },
        { href: '/teacher/materials', label: '학습자료', icon: FileDown },
      ],
    },
  ],
  admin: [
    {
      items: [
        { href: '/admin', label: '대시보드', icon: LayoutDashboard },
      ],
    },
    {
      label: '관리',
      items: [
        { href: '/admin/students', label: '학생 관리', icon: Users },
        { href: '/admin/teachers', label: '선생님 관리', icon: GraduationCap },
      ],
    },
    {
      label: '콘텐츠',
      items: [
        { href: '/admin/naesin', label: '내신 관리', icon: ClipboardList },
        { href: '/admin/voca', label: '올킬보카 관리', icon: BookA },
      ],
    },
    {
      label: '통계',
      items: [
        { href: '/admin/analytics', label: '학원 통계', icon: BarChart3 },
      ],
    },
    {
      items: [
        { href: '/admin/reports', label: '리포트', icon: FileText },
        { href: '/admin/materials', label: '학습자료', icon: FileDown },
      ],
    },
    {
      items: [
        { href: '/admin/guide', label: '사용 방법', icon: BookOpen },
      ],
    },
    {
      label: '설정',
      items: [
        { href: '/admin/billing', label: '결제 관리', icon: CreditCard },
        { href: '/admin/settings', label: '학원 설정', icon: Settings },
      ],
    },
  ],
  boss: [
    {
      items: [
        { href: '/boss', label: '대시보드', icon: LayoutDashboard },
      ],
    },
    {
      label: '관리',
      items: [
        { href: '/boss/academies', label: '학원 관리', icon: Settings },
        { href: '/boss/users', label: '사용자 관리', icon: Users },
        { href: '/boss/students', label: '학생 관리', icon: Users },
        { href: '/boss/teachers', label: '선생님 관리', icon: GraduationCap },
      ],
    },
    {
      label: '콘텐츠',
      items: [
        { href: '/boss/content', label: '콘텐츠 관리', icon: NotebookPen },
        { href: '/boss/textbook-mode', label: '교과서 모드', icon: BookMarked },
        { href: '/boss/naesin', label: '내신 관리', icon: ClipboardList },
        { href: '/boss/voca', label: '올킬보카 관리', icon: BookA },
      ],
    },
    {
      label: '구독/결제',
      items: [
        { href: '/boss/subscriptions', label: '구독 관리', icon: CreditCard },
        { href: '/boss/plans', label: '요금 플랜', icon: CreditCard },
        { href: '/boss/orders', label: '주문 내역', icon: Receipt },
      ],
    },
    {
      label: '홈페이지 관리',
      items: [
        { href: '/boss/consultations', label: '상담 신청', icon: MessageSquare },
        { href: '/boss/courses', label: '코스 관리', icon: BookOpen },
        { href: '/boss/teacher-profiles', label: '선생님 프로필', icon: UserCircle },
        { href: '/boss/reviews', label: '후기 관리', icon: Star },
        { href: '/boss/faqs', label: 'FAQ 관리', icon: HelpCircle },
      ],
    },
    {
      label: '통계',
      items: [
        { href: '/boss/analytics', label: '플랫폼 통계', icon: BarChart3 },
      ],
    },
    {
      items: [
        { href: '/boss/reports', label: '리포트', icon: FileText },
        { href: '/boss/materials', label: '학습자료', icon: FileDown },
      ],
    },
  ],
};

// For students, filter nav items based on assigned services
const SERVICE_HREF_MAP: Record<string, string> = {
  naesin: '/student/naesin',
  voca: '/student/voca',
};

export const HOMEPAGE_MANAGER_GROUP: NavGroup = {
  label: '홈페이지 관리',
  items: [
    { href: '/boss/consultations', label: '상담 신청', icon: MessageSquare },
    { href: '/boss/courses', label: '코스 관리', icon: BookOpen },
    { href: '/boss/teacher-profiles', label: '선생님 프로필', icon: UserCircle },
    { href: '/boss/reviews', label: '후기 관리', icon: Star },
    { href: '/boss/faqs', label: 'FAQ 관리', icon: HelpCircle },
  ],
};

export function getNavGroups(role: string, services?: string[], isHomepageManager?: boolean): NavGroup[] {
  let groups = NAV_CONFIG[role] || NAV_CONFIG.student;

  // Non-boss homepage managers get the homepage section appended
  if (isHomepageManager && role !== 'boss') {
    groups = [...groups, HOMEPAGE_MANAGER_GROUP];
  }

  if (role !== 'student' || !services) return groups;

  // Filter student learning items based on assigned services
  const serviceHrefs = new Set(services.map((s) => SERVICE_HREF_MAP[s]).filter(Boolean));

  return groups.map((group) => {
    if (group.label !== '학습') return group;
    // No services assigned → keep items visible but disabled
    if (serviceHrefs.size === 0) {
      return { ...group, items: group.items.map((item) => ({ ...item, disabled: true })) };
    }
    return {
      ...group,
      items: group.items.filter((item) => serviceHrefs.has(item.href)),
    };
  }).filter((group) => group.items.length > 0);
}
