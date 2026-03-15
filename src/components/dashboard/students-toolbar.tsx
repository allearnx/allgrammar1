'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, UserPlus, ChevronDown, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { BulkImportDialog } from './bulk-import-dialog';

interface Props {
  studentIds: string[];
  studentCount: number;
  bulkAllowed?: boolean;
}

export function StudentsToolbar({ studentIds, studentCount, bulkAllowed = true }: Props) {
  const [assigning, setAssigning] = useState(false);
  const router = useRouter();

  async function handleBulkAssign(services: string[], action: 'assign' | 'revoke') {
    if (studentIds.length === 0) {
      toast.error('학생이 없습니다.');
      return;
    }
    setAssigning(true);
    try {
      const res = await fetch('/api/admin/students/bulk-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentIds, services, action }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '실패');
      }
      toast.success(action === 'assign' ? '서비스가 배정되었습니다' : '서비스가 해제되었습니다');
      router.refresh();
    } catch (err) {
      toast.error('실패', { description: err instanceof Error ? err.message : '알 수 없는 오류' });
    } finally {
      setAssigning(false);
    }
  }

  async function handleExport() {
    try {
      const res = await fetch('/api/admin/students/export');
      if (!res.ok) throw new Error('내보내기 실패');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `students_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('학생 명단이 다운로드되었습니다');
    } catch (err) {
      toast.error('내보내기 실패', { description: err instanceof Error ? err.message : '알 수 없는 오류' });
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="text-gray-500 text-sm">
        총 <span className="font-semibold text-gray-800">{studentCount}</span>명의 학생
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="inline-flex items-center rounded-lg border bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-all hover:shadow-sm hover:border-violet-300 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={assigning || studentIds.length === 0 || !bulkAllowed}
            >
              <UserPlus className="h-4 w-4 mr-1.5 text-gray-400" />
              전체 서비스 배정
              <ChevronDown className="h-3 w-3 ml-1 text-gray-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleBulkAssign(['naesin'], 'assign')}>
              올인내신 배정
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleBulkAssign(['voca'], 'assign')}>
              올킬보카 배정
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleBulkAssign(['naesin', 'voca'], 'assign')}>
              전체 서비스 배정
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-rose-500 focus:text-rose-600"
              onClick={() => handleBulkAssign(['naesin', 'voca'], 'revoke')}
            >
              전체 서비스 해제
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {bulkAllowed ? (
          <BulkImportDialog />
        ) : (
          <button
            disabled
            className="inline-flex items-center rounded-lg border bg-white px-3 py-1.5 text-sm font-medium text-gray-400 opacity-50 cursor-not-allowed"
          >
            <Lock className="h-4 w-4 mr-1.5" />
            학생 등록
          </button>
        )}

        <button
          onClick={bulkAllowed ? handleExport : undefined}
          disabled={!bulkAllowed}
          className={`inline-flex items-center rounded-lg border bg-white px-3 py-1.5 text-sm font-medium transition-all ${
            bulkAllowed
              ? 'text-gray-700 hover:shadow-sm hover:border-violet-300'
              : 'text-gray-400 opacity-50 cursor-not-allowed'
          }`}
        >
          {bulkAllowed ? (
            <Download className="h-4 w-4 mr-1.5 text-gray-400" />
          ) : (
            <Lock className="h-4 w-4 mr-1.5" />
          )}
          내보내기
        </button>
      </div>
    </div>
  );
}
