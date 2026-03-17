'use client';

import type { AuthUser } from '@/types/auth';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TopbarProps {
  user: AuthUser;
  title?: string;
}

const roleLabels: Record<string, string> = {
  student: '학생',
  teacher: '선생님',
  admin: '학원관리자',
  boss: '총관리자',
};

const roleBorderColors: Record<string, string> = {
  student: 'border-t-cyan-500',
  teacher: 'border-t-sky-500',
  admin: 'border-t-indigo-500',
  boss: 'border-t-violet-500',
};

const roleBadgeColors: Record<string, string> = {
  student: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300',
  teacher: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
  admin: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
  boss: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
};

export function Topbar({ user, title }: TopbarProps) {
  return (
    <header className={cn(
      "sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-t-2 bg-card px-4 md:px-6",
      roleBorderColors[user.role] || 'border-t-slate-500'
    )}>
      {/* Spacer for mobile menu button */}
      <div className="w-8 md:hidden" />
      <h1 className="text-lg font-semibold tracking-tight truncate">{title || '대시보드'}</h1>
      <div className="ml-auto flex items-center gap-3">
        <Badge
          variant="secondary"
          className={cn(
            'hidden sm:inline-flex border-0',
            roleBadgeColors[user.role]
          )}
        >
          {roleLabels[user.role] || user.role}
        </Badge>
      </div>
    </header>
  );
}
