import {
  BookOpen,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  NotebookPen,
  Settings,
  Users,
  FileText,
  BookMarked,
  BookA,
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
        { href: '/student/naesin', label: '내신 대비', icon: BookMarked },
        { href: '/student/voca', label: '올톡보카', icon: BookA },
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
        { href: '/teacher/voca', label: '올톡보카 관리', icon: BookA },
      ],
    },
    {
      items: [
        { href: '/teacher/reports', label: '리포트', icon: FileText },
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
        { href: '/admin/voca', label: '올톡보카 관리', icon: BookA },
      ],
    },
    {
      items: [
        { href: '/admin/reports', label: '리포트', icon: FileText },
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
        { href: '/boss/voca', label: '올톡보카 관리', icon: BookA },
      ],
    },
    {
      items: [
        { href: '/boss/reports', label: '리포트', icon: FileText },
      ],
    },
  ],
};

// For students, filter nav items based on assigned services
const SERVICE_HREF_MAP: Record<string, string> = {
  naesin: '/student/naesin',
  voca: '/student/voca',
};

export function getNavGroups(role: string, services?: string[]): NavGroup[] {
  const groups = NAV_CONFIG[role] || NAV_CONFIG.student;
  if (role !== 'student' || !services) return groups;

  // Filter student learning items based on assigned services
  return groups.map((group) => {
    if (group.label !== '학습') return group;
    const serviceHrefs = new Set(services.map((s) => SERVICE_HREF_MAP[s]).filter(Boolean));
    return {
      ...group,
      items: group.items.filter((item) => serviceHrefs.has(item.href)),
    };
  }).filter((group) => group.items.length > 0);
}
