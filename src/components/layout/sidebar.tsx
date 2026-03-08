'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import {
  BookOpen,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Loader2,
  Menu,
  NotebookPen,
  Settings,
  Users,
  FileText,
  BookMarked,
  BookA,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  Lock,
  Brain,
} from 'lucide-react';
import type { AuthUser } from '@/types/auth';
import type { NaesinStageStatuses, NaesinStageStatus } from '@/types/database';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

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

interface SidebarProps {
  user: AuthUser;
  services?: string[];
  naesinTree?: NaesinSidebarExam[];
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavGroup {
  label?: string;
  items: NavItem[];
}

const NAV_CONFIG: Record<string, NavGroup[]> = {
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

function getNavGroups(role: string, services?: string[]): NavGroup[] {
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

// ── Stage config for sidebar tree ──
const STAGE_ITEMS = [
  { key: 'vocab' as const, label: '단어 암기', stage: 'vocab' },
  { key: 'passage' as const, label: '교과서 암기', stage: 'passage' },
  { key: 'grammar' as const, label: '문법 설명', stage: 'grammar' },
  { key: 'problem' as const, label: '문제풀이', stage: 'problem' },
  { key: 'lastReview' as const, label: '직전보강', stage: 'lastReview' },
] as const;

function StageIcon({ status }: { status: NaesinStageStatus }) {
  if (status === 'completed') return <CheckCircle className="h-3 w-3 text-green-500 shrink-0" />;
  if (status === 'locked') return <Lock className="h-3 w-3 text-muted-foreground shrink-0" />;
  return <div className="h-3 w-3 rounded-full border-2 border-indigo-500 shrink-0" />;
}

function getDDayLabel(examDate: string | null): string | null {
  if (!examDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exam = new Date(examDate);
  exam.setHours(0, 0, 0, 0);
  const diff = Math.ceil((exam.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return `D+${Math.abs(diff)}`;
  if (diff === 0) return 'D-Day';
  return `D-${diff}`;
}

function NaesinTree({ exams, pathname, onNavigate }: { exams: NaesinSidebarExam[]; pathname: string; onNavigate?: () => void }) {
  // Find exam with in-progress units (first non-all-completed exam)
  const activeExamIdx = exams.findIndex((exam) =>
    exam.units.some((u) => {
      const s = u.stageStatuses;
      return !(s.vocab === 'completed' && s.passage === 'completed' && s.grammar === 'completed' && s.problem === 'completed');
    })
  );

  const [openExams, setOpenExams] = useState<Set<number>>(() => {
    const initial = new Set<number>();
    if (activeExamIdx >= 0) initial.add(exams[activeExamIdx].round);
    return initial;
  });
  const [openUnits, setOpenUnits] = useState<Set<string>>(() => new Set());

  function toggleExam(round: number) {
    setOpenExams((prev) => {
      const next = new Set(prev);
      if (next.has(round)) next.delete(round);
      else next.add(round);
      return next;
    });
  }

  function toggleUnit(unitId: string) {
    setOpenUnits((prev) => {
      const next = new Set(prev);
      if (next.has(unitId)) next.delete(unitId);
      else next.add(unitId);
      return next;
    });
  }

  return (
    <div className="space-y-0.5">
      {exams.map((exam) => {
        const isExamOpen = openExams.has(exam.round);
        const allCompleted = exam.units.every((u) => {
          const s = u.stageStatuses;
          return s.vocab === 'completed' && s.passage === 'completed' && s.grammar === 'completed' && s.problem === 'completed';
        });
        const dday = getDDayLabel(exam.examDate);

        return (
          <div key={exam.round}>
            {/* Exam round header */}
            <button
              onClick={() => toggleExam(exam.round)}
              className="flex items-center gap-2 w-full px-3 py-1.5 text-xs font-medium rounded-md hover:bg-slate-100 transition-colors"
            >
              {isExamOpen ? (
                <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
              ) : (
                <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
              )}
              <span className="truncate flex-1 text-left">
                {exam.label}
              </span>
              {allCompleted && <CheckCircle className="h-3 w-3 text-green-500 shrink-0" />}
              {dday && (
                <span className="text-[10px] text-muted-foreground shrink-0">{dday}</span>
              )}
            </button>

            {/* Units within this exam */}
            {isExamOpen && (
              <div className="ml-3 border-l border-gray-200 pl-1">
                {exam.units.map((unit) => {
                  const isUnitOpen = openUnits.has(unit.id);
                  const s = unit.stageStatuses;
                  const unitCompleted = s.vocab === 'completed' && s.passage === 'completed' && s.grammar === 'completed' && s.problem === 'completed';

                  return (
                    <div key={unit.id}>
                      {/* Unit header */}
                      <button
                        onClick={() => toggleUnit(unit.id)}
                        className="flex items-center gap-2 w-full px-2 py-1 text-xs rounded-md hover:bg-slate-100 transition-colors"
                      >
                        {isUnitOpen ? (
                          <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
                        ) : (
                          <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                        )}
                        <span className="truncate flex-1 text-left">
                          Lesson {unit.unitNumber}
                        </span>
                        {unitCompleted ? (
                          <CheckCircle className="h-3 w-3 text-green-500 shrink-0" />
                        ) : (
                          <div className="h-3 w-3 rounded-full border-2 border-indigo-500 shrink-0" />
                        )}
                      </button>

                      {/* Stage items */}
                      {isUnitOpen && (
                        <div className="ml-3 border-l border-gray-200 pl-1">
                          {STAGE_ITEMS.map((item) => {
                            const status = unit.stageStatuses[item.key];
                            const isLocked = status === 'locked';
                            const href = `/student/naesin/${unit.id}/${item.stage}`;
                            const isActive = pathname === href;

                            return (
                              <Link
                                key={item.key}
                                href={href}
                                onClick={onNavigate}
                                className={cn(
                                  'flex items-center gap-2 px-2 py-1 text-xs rounded-md transition-colors',
                                  isLocked
                                    ? 'opacity-40'
                                    : isActive
                                      ? 'bg-indigo-50 text-indigo-600 font-medium'
                                      : 'hover:bg-slate-100 text-slate-500'
                                )}
                              >
                                <StageIcon status={status} />
                                <span className="truncate">{item.label}</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function NavLinks({
  groups,
  pathname,
  naesinTree,
  onNavigate,
}: {
  groups: NavGroup[];
  pathname: string;
  naesinTree?: NaesinSidebarExam[];
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  function handleClick(e: React.MouseEvent, href: string) {
    e.preventDefault();
    if (pathname === href) return;
    setPendingHref(href);
    startTransition(() => {
      router.push(href);
    });
    onNavigate?.();
  }

  return (
    <nav className="flex flex-col gap-0.5 px-3">
      {groups.map((group, groupIdx) => (
        <div key={groupIdx} className={groupIdx > 0 ? 'mt-2 pt-2 border-t border-sidebar-border' : ''}>
          {group.label && (
            <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
              {group.label}
            </p>
          )}
          {group.items.map((item) => {
            const isNaesinItem = item.href === '/student/naesin';
            const hasTree = isNaesinItem && naesinTree && naesinTree.length > 0;
            const isExactOnly = item.href.split('/').filter(Boolean).length === 1;
            const isActive = pathname === item.href || (!isExactOnly && pathname.startsWith(item.href + '/'));
            const isLoading = isPending && pendingHref === item.href;

            return (
              <div key={item.href}>
                <Link
                  href={item.href}
                  onClick={(e) => handleClick(e, item.href)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors relative',
                    isActive
                      ? 'bg-indigo-50 text-indigo-600 border-l-[3px] border-indigo-600 pl-[9px]'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900',
                    isLoading && !isActive && 'bg-slate-100 text-slate-900'
                  )}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                  ) : (
                    <item.icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-indigo-600' : 'text-slate-400')} />
                  )}
                  {item.label}
                </Link>
                {/* Naesin tree navigation below the 내신 대비 link */}
                {hasTree && (
                  <div className="mt-1 mb-1">
                    <NaesinTree exams={naesinTree!} pathname={pathname} onNavigate={onNavigate} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

export function Sidebar({ user, services, naesinTree }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const navGroups = getNavGroups(user.role, services);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success('로그아웃되었습니다');
    router.push('/login');
    router.refresh();
  }

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center border-b border-sidebar-border px-4">
        <span className="flex items-center gap-2 font-bold text-indigo-600">
          <GraduationCap className="h-5 w-5" />
          <span>올라영</span>
        </span>
      </div>
      <ScrollArea className="flex-1 py-3">
        <NavLinks groups={navGroups} pathname={pathname} naesinTree={naesinTree} onNavigate={() => setOpen(false)} />
      </ScrollArea>
      <div className="border-t border-sidebar-border p-4">
        <div className="mb-3 px-3">
          <p className="text-sm font-medium truncate text-slate-900">{user.full_name}</p>
          <p className="text-xs truncate text-slate-400">{user.email}</p>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-slate-400 hover:text-slate-900 hover:bg-slate-100"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          로그아웃
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar md:block">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden fixed left-4 top-3 z-40" aria-label="메뉴 열기">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0 bg-sidebar">
          <SheetTitle className="sr-only">내비게이션</SheetTitle>
          {sidebarContent}
        </SheetContent>
      </Sheet>
    </>
  );
}
