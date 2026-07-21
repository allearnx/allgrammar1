import {
  Activity,
  CalendarDays,
  ClipboardList,
  CreditCard,
  BarChart3,
  GraduationCap,
  LayoutDashboard,
  ListChecks,
  NotebookPen,
  PenLine,
  Receipt,
  Settings,
  Users,
  FileDown,
  FileText,
  FileCheck,
  BookMarked,
  BookA,
  MessageSquare,
  BookOpen,
  UserCircle,
  Star,
  HelpCircle,
  Megaphone,
  Library,
  Swords,
  Sparkles,
  Target,
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
  requireContentPermission?: boolean;
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
        { href: '/student/voca/wrong-review', label: '올킬오답', icon: Swords },
        { href: '/student/voca/exam', label: '올킬시험', icon: PenLine },
        { href: '/student/wrong-answers', label: '오답모음', icon: ListChecks },
        { href: '/student/materials', label: '학습자료', icon: FileDown },
      ],
    },
    {
      label: '안내',
      items: [
        { href: '/student/announcements', label: '공지사항', icon: Megaphone },
        { href: '/updates', label: '업데이트·사용법', icon: Sparkles },
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
        { href: '/teacher/live', label: '실시간 모니터', icon: Activity },
        { href: '/teacher/exams', label: '시험 일정', icon: CalendarDays },
        { href: '/teacher/settings', label: '학원 설정', icon: Settings },
        { href: '/teacher/announcements', label: '공지사항', icon: Megaphone },
        { href: '/updates', label: '업데이트·사용법', icon: Sparkles },
      ],
    },
    {
      label: '콘텐츠',
      items: [
        { href: '/teacher/naesin', label: '내신 관리', icon: ClipboardList },
        { href: '/teacher/voca', label: '올킬보카 관리', icon: BookA, requireContentPermission: true },
        { href: '/teacher/voca/submissions', label: '오답노트 확인', icon: FileCheck },
        { href: '/teacher/voca/results', label: 'Day별 결과', icon: BarChart3 },
        { href: '/teacher/voca/exams', label: '올킬시험 관리', icon: PenLine },
        { href: '/teacher/naesin?tab=templates', label: '문제 템플릿', icon: Library, requireContentPermission: true },
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
        { href: '/admin/live', label: '실시간 모니터', icon: Activity },
        { href: '/admin/exams', label: '시험 일정', icon: CalendarDays },
        { href: '/admin/teachers', label: '선생님 관리', icon: GraduationCap },
        { href: '/admin/announcements', label: '공지사항', icon: Megaphone },
        { href: '/updates', label: '업데이트·사용법', icon: Sparkles },
      ],
    },
    {
      label: '콘텐츠',
      items: [
        { href: '/admin/naesin', label: '내신 관리', icon: ClipboardList },
        { href: '/admin/voca', label: '올킬보카 관리', icon: BookA, requireContentPermission: true },
        { href: '/admin/voca/submissions', label: '오답노트 확인', icon: FileCheck },
        { href: '/admin/voca/results', label: 'Day별 결과', icon: BarChart3 },
        { href: '/admin/voca/exams', label: '올킬시험 관리', icon: PenLine },
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
        { href: '/boss/live', label: '실시간 모니터', icon: Activity },
        { href: '/boss/exams', label: '시험 일정', icon: CalendarDays },
        { href: '/boss/teachers', label: '선생님 관리', icon: GraduationCap },
        { href: '/boss/announcements', label: '공지사항', icon: Megaphone },
        { href: '/updates', label: '업데이트·사용법', icon: Sparkles },
      ],
    },
    {
      label: '콘텐츠',
      items: [
        { href: '/boss/content', label: '콘텐츠 관리', icon: NotebookPen },
        { href: '/boss/textbook-mode', label: '교과서 모드', icon: BookMarked },
        { href: '/boss/naesin', label: '내신 관리', icon: ClipboardList },
        { href: '/boss/voca', label: '올킬보카 관리', icon: BookA },
        { href: '/boss/voca/submissions', label: '오답노트 확인', icon: FileCheck },
        { href: '/boss/voca/results', label: 'Day별 결과', icon: BarChart3 },
        { href: '/boss/voca/exams', label: '올킬시험 관리', icon: PenLine },
        { href: '/boss/naesin?tab=templates', label: '문제 템플릿', icon: Library },
      ],
    },
    {
      label: '구독/결제',
      items: [
        { href: '/boss/subscriptions', label: '구독 관리', icon: CreditCard },
        { href: '/boss/plans', label: '요금 플랜', icon: CreditCard },
        { href: '/boss/orders', label: '주문 내역', icon: Receipt },
        { href: '/boss/leads', label: '진단 리드', icon: Target },
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
        { href: '/boss/blog', label: '블로그', icon: PenLine },
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
    { href: '/boss/blog', label: '블로그', icon: PenLine },
  ],
};

export function getNavGroups(role: string, services?: string[], isHomepageManager?: boolean, canManageContent?: boolean): NavGroup[] {
  let groups = NAV_CONFIG[role] || NAV_CONFIG.student;

  // Non-boss homepage managers get the homepage section appended
  if (isHomepageManager && role !== 'boss') {
    groups = [...groups, HOMEPAGE_MANAGER_GROUP];
  }

  // Filter items requiring content permission (boss always passes)
  if (role !== 'boss' && !canManageContent) {
    groups = groups.map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.requireContentPermission),
    })).filter((group) => group.items.length > 0);
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
      items: group.items.filter((item) =>
        [...serviceHrefs].some((href) => item.href === href || item.href.startsWith(href + '/'))
      ),
    };
  }).filter((group) => group.items.length > 0);
}
