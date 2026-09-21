'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookMarked, BookA, ListChecks } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * 학생용 하단 탭바 (폰·태블릿, md 미만). 사이드 메뉴가 ≡ 뒤에 숨어 학생들이 못 찾던 문제의 해결책
 * (2026-09-21 사장님). 서비스가 없는 탭은 숨긴다.
 */
export function MobileTabBar({ services }: { services: string[] }) {
  const pathname = usePathname();
  const tabs = [
    { href: '/student', label: '홈', icon: Home, exact: true },
    services.includes('naesin') && { href: '/student/naesin', label: '올인내신', icon: BookMarked },
    services.includes('voca') && { href: '/student/voca', label: '올킬보카', icon: BookA },
    { href: '/student/wrong-answers', label: '오답', icon: ListChecks },
  ].filter(Boolean) as { href: string; label: string; icon: typeof Home; exact?: boolean }[];

  return (
    <nav
      className="md:hidden fixed inset-x-0 bottom-0 z-40 border-t bg-white/95 backdrop-blur dark:bg-gray-900/95 dark:border-gray-800"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label="주요 메뉴"
    >
      <ul className="flex">
        {tabs.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname === href || pathname.startsWith(href + '/');
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  'flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium',
                  active ? 'text-[#1A73E8]' : 'text-gray-500 dark:text-gray-400',
                )}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className={cn('h-5 w-5', active && 'stroke-[2.5]')} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
