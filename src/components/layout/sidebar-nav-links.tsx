'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { NavGroup, NaesinSidebarExam } from './sidebar-nav-config';
import { NaesinTree } from './sidebar-naesin-tree';

export function NavLinks({
  groups,
  pathname,
  naesinTree,
  onNavigate,
  hoverWhite,
  badges,
}: {
  groups: NavGroup[];
  pathname: string;
  naesinTree?: NaesinSidebarExam[];
  onNavigate?: () => void;
  hoverWhite?: boolean;
  /** href → 미확인 개수 — 빨간 배지로 표시 */
  badges?: Record<string, number>;
}) {
  const searchParams = useSearchParams();

  const fullPath = searchParams.toString() ? `${pathname}?${searchParams.toString()}` : pathname;

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
            const hrefPath = item.href.split('?')[0];
            const isExactOnly = hrefPath.split('/').filter(Boolean).length === 1;
            const hasQuery = item.href.includes('?');
            const isActive = hasQuery
              ? fullPath === item.href
              : pathname === item.href || (!isExactOnly && pathname.startsWith(item.href + '/'));

            if (item.disabled) {
              // 서비스 선택 전 — 자물쇠 벽 대신 실제 아이콘을 옅게 미리보기 (부드럽게)
              return (
                <div key={item.href}>
                  <span
                    aria-disabled="true"
                    className="flex items-center gap-3 rounded-full px-3 py-2 text-sm font-medium pointer-events-none cursor-default text-slate-300"
                  >
                    <item.icon className="h-4 w-4 shrink-0 text-slate-300" />
                    {item.label}
                  </span>
                </div>
              );
            }

            return (
              <div key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => onNavigate?.()}
                  className={cn(
                    'flex items-center gap-3 rounded-full px-3 py-2 text-sm font-medium transition-colors relative',
                    isActive
                      ? 'bg-brand-50 text-brand-600 font-semibold'
                      : hoverWhite
                        ? 'text-slate-500 hover:bg-white hover:text-slate-900'
                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                  )}
                >
                  <item.icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-brand-600' : 'text-slate-400')} />
                  {item.label}
                  {(badges?.[item.href] ?? 0) > 0 && (
                    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-[#D93025] px-1.5 text-[11px] font-bold text-white">
                      {badges![item.href]}
                    </span>
                  )}
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
