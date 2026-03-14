'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { useState, useTransition } from 'react';
import type { NavGroup, NaesinSidebarExam } from './sidebar-nav-config';
import { NaesinTree } from './sidebar-naesin-tree';

export function NavLinks({
  groups,
  pathname,
  naesinTree,
  onNavigate,
  hoverWhite,
}: {
  groups: NavGroup[];
  pathname: string;
  naesinTree?: NaesinSidebarExam[];
  onNavigate?: () => void;
  hoverWhite?: boolean;
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
                      : hoverWhite
                        ? 'text-slate-500 hover:bg-white hover:text-slate-900'
                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900',
                    isLoading && !isActive && (hoverWhite ? 'bg-white text-slate-900' : 'bg-slate-100 text-slate-900')
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
