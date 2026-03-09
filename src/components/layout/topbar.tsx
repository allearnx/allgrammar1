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
  student: 'border-t-blue-500',
  teacher: 'border-t-indigo-500',
  admin: 'border-t-purple-500',
  boss: 'border-t-slate-500',
};

const roleBadgeColors: Record<string, string> = {
  student: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  teacher: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
  admin: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
  boss: 'bg-slate-100 text-slate-700 dark:bg-slate-950 dark:text-slate-300',
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
