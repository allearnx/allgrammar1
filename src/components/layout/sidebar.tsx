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
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  NotebookPen,
  Settings,
  Users,
  FileText,
  BarChart3,
  BookMarked,
} from 'lucide-react';
import type { AuthUser } from '@/types/auth';
import { useState } from 'react';
import { toast } from 'sonner';

interface SidebarProps {
  user: AuthUser;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

function getNavItems(role: string): NavItem[] {
  if (role === 'student') {
    return [
      { href: '/student', label: '대시보드', icon: LayoutDashboard },
      { href: '/student/levels', label: '문법 학습', icon: GraduationCap },
      { href: '/student/review', label: '복습하기', icon: BookOpen },
      { href: '/student/progress', label: '내 진도', icon: BarChart3 },
    ];
  }

  if (role === 'manager' || role === 'admin') {
    return [
      { href: '/manager', label: '대시보드', icon: LayoutDashboard },
      { href: '/manager/students', label: '학생 관리', icon: Users },
      { href: '/manager/content', label: '콘텐츠 관리', icon: NotebookPen },
      { href: '/manager/textbook-mode', label: '교과서 모드', icon: BookMarked },
      { href: '/manager/reports', label: '리포트', icon: FileText },
    ];
  }

  return [
    { href: '/super-admin', label: '대시보드', icon: LayoutDashboard },
    { href: '/super-admin/academies', label: '학원 관리', icon: Settings },
    { href: '/super-admin/users', label: '사용자 관리', icon: Users },
  ];
}

function NavLinks({ items, pathname, onNavigate }: { items: NavItem[]; pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1 px-2">
      {items.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href + '/'));
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const navItems = getNavItems(user.role);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success('로그아웃되었습니다');
    router.push('/login');
    router.refresh();
  }

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <GraduationCap className="h-5 w-5" />
          <span>올라영</span>
        </Link>
      </div>
      <ScrollArea className="flex-1 py-4">
        <NavLinks items={navItems} pathname={pathname} onNavigate={() => setOpen(false)} />
      </ScrollArea>
      <div className="border-t p-4">
        <div className="mb-3 px-3">
          <p className="text-sm font-medium truncate">{user.full_name}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground"
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
      <aside className="hidden w-64 shrink-0 border-r bg-card md:block">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden fixed left-4 top-3 z-40">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">내비게이션</SheetTitle>
          {sidebarContent}
        </SheetContent>
      </Sheet>
    </>
  );
}
