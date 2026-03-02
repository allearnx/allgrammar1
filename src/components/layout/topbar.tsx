'use client';

import type { AuthUser } from '@/types/auth';
import { Badge } from '@/components/ui/badge';

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

export function Topbar({ user, title }: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-card px-4 md:px-6">
      {/* Spacer for mobile menu button */}
      <div className="w-8 md:hidden" />
      <h1 className="text-lg font-semibold truncate">{title || '대시보드'}</h1>
      <div className="ml-auto flex items-center gap-3">
        <Badge variant="secondary" className="hidden sm:inline-flex">
          {roleLabels[user.role] || user.role}
        </Badge>
      </div>
    </header>
  );
}
