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
  BarChart3,
  BookMarked,
} from 'lucide-react';
import type { AuthUser } from '@/types/auth';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

interface SidebarProps {
  user: AuthUser;
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
      ],
    },
    {
      items: [
        { href: '/student/progress', label: '내 진도', icon: BarChart3 },
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
      ],
    },
    {
      items: [
        { href: '/boss/reports', label: '리포트', icon: FileText },
      ],
    },
  ],
};

function getNavGroups(role: string): NavGroup[] {
  return NAV_CONFIG[role] || NAV_CONFIG.student;
}

function NavLinks({ groups, pathname, onNavigate }: { groups: NavGroup[]; pathname: string; onNavigate?: () => void }) {
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
            <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#9ca3af]">
              {group.label}
            </p>
          )}
          {group.items.map((item) => {
            const isExactOnly = item.href.split('/').filter(Boolean).length === 1;
            const isActive = pathname === item.href || (!isExactOnly && pathname.startsWith(item.href + '/'));
            const isLoading = isPending && pendingHref === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={(e) => handleClick(e, item.href)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors relative',
                  isActive
                    ? 'bg-[#f5f3ff] text-[#6d28d9] border-l-[3px] border-[#6d28d9] pl-[9px]'
                    : 'text-[#6b7280] hover:bg-[#f3f4f6] hover:text-[#111827]',
                  isLoading && !isActive && 'bg-[#f3f4f6] text-[#111827]'
                )}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                ) : (
                  <item.icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-[#6d28d9]' : 'text-[#9ca3af]')} />
                )}
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const navGroups = getNavGroups(user.role);

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
        <span className="flex items-center gap-2 font-bold text-[#6d28d9]">
          <GraduationCap className="h-5 w-5" />
          <span>올라영</span>
        </span>
      </div>
      <ScrollArea className="flex-1 py-3">
        <NavLinks groups={navGroups} pathname={pathname} onNavigate={() => setOpen(false)} />
      </ScrollArea>
      <div className="border-t border-sidebar-border p-4">
        <div className="mb-3 px-3">
          <p className="text-sm font-medium truncate text-[#111827]">{user.full_name}</p>
          <p className="text-xs truncate text-[#9ca3af]">{user.email}</p>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-[#9ca3af] hover:text-[#111827] hover:bg-[#f3f4f6]"
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
          <Button variant="ghost" size="icon" className="md:hidden fixed left-4 top-3 z-40">
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
