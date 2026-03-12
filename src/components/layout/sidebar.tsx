'use client';

import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { GraduationCap, LogOut, Menu } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { getNavGroups } from './sidebar-nav-config';
import { NavLinks } from './sidebar-nav-links';
import { ChangePasswordDialog } from './change-password-dialog';
import type { AuthUser } from '@/types/auth';
import type { NaesinSidebarExam } from './sidebar-nav-config';

export type { NaesinSidebarExam };

interface SidebarProps {
  user: AuthUser;
  services?: string[];
  naesinTree?: NaesinSidebarExam[];
}

export function Sidebar({ user, services, naesinTree }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const navGroups = getNavGroups(user.role, services);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    // httpOnly 프로필 캐시 쿠키 서버에서 제거
    await fetch('/api/auth/logout', { method: 'POST' });
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
        <ChangePasswordDialog />
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
      <aside className="hidden w-64 shrink-0 bg-sidebar md:block">
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
