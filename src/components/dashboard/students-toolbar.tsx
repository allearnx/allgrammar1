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
import { Download, UserPlus, ChevronDown, Lock, BookMarked, CheckSquare, XSquare } from 'lucide-react';
import { toast } from 'sonner';
import { BulkImportDialog } from './bulk-import-dialog';
import { AddStudentDialog } from './add-student-dialog';
import { useStudentSelection } from './student-selection-context';

interface Props {
  studentIds: string[];
  studentCount: number;
  bulkAllowed?: boolean;
  showMemorizeAssign?: boolean;
}

export function StudentsToolbar({ studentIds, studentCount, bulkAllowed = true, showMemorizeAssign = false }: Props) {
  const [assigning, setAssigning] = useState(false);
  const router = useRouter();
  const { selectedIds, hasSelection, selectedCount, selectAll, clearAll } = useStudentSelection();

  // 선택된 학생이 있으면 선택된 학생만, 없으면 전체
  const targetIds = hasSelection ? [...selectedIds] : studentIds;
  const targetLabel = hasSelection ? `선택 ${selectedCount}명` : '전체';

  async function handleBulkMemorizeAssign(action: 'assign' | 'revoke') {
    if (targetIds.length === 0) {
      toast.error('학생이 없습니다.');
      return;
    }
    setAssigning(true);
    try {
      const res = await fetch('/api/admin/students/bulk-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentIds: targetIds,
          services: ['naesin'],
          action,
          naesinMemorizeOnly: true,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '실패');
      }
      toast.success(action === 'assign' ? '내신 암기가 할당되었습니다' : '내신 암기가 해제되었습니다');
      clearAll();
      router.refresh();
    } catch (err) {
      toast.error('실패', { description: err instanceof Error ? err.message : '알 수 없는 오류' });
    } finally {
      setAssigning(false);
    }
  }

  async function handleBulkAssign(services: string[], action: 'assign' | 'revoke') {
    if (targetIds.length === 0) {
      toast.error('학생이 없습니다.');
      return;
    }
    setAssigning(true);
    try {
      const res = await fetch('/api/admin/students/bulk-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentIds: targetIds, services, action }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '실패');
      }
      toast.success(action === 'assign' ? '서비스가 배정되었습니다' : '서비스가 해제되었습니다');
      clearAll();
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
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-gray-500 text-sm">
          총 <span className="font-semibold text-gray-800">{studentCount}</span>명의 학생
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <AddStudentDialog />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="inline-flex items-center rounded-lg border bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-all hover:shadow-sm hover:border-brand-300 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={assigning || targetIds.length === 0 || !bulkAllowed}
              >
                <UserPlus className="h-4 w-4 mr-1.5 text-gray-400" />
                {targetLabel} 서비스 배정
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
              {showMemorizeAssign && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleBulkMemorizeAssign('assign')}>
                    <BookMarked className="h-4 w-4 mr-1.5 text-emerald-500" />
                    내신 암기 할당
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkMemorizeAssign('revoke')}>
                    내신 암기 해제
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-rose-500 focus:text-rose-600"
                onClick={() => handleBulkAssign(['naesin'], 'revoke')}
              >
                올인내신 해제
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-rose-500 focus:text-rose-600"
                onClick={() => handleBulkAssign(['voca'], 'revoke')}
              >
                올킬보카 해제
              </DropdownMenuItem>
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
                ? 'text-gray-700 hover:shadow-sm hover:border-brand-300'
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

      {/* 선택 모드 바 */}
      <div className="flex items-center gap-2">
        <button
          onClick={hasSelection ? clearAll : selectAll}
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
        >
          {hasSelection ? (
            <>
              <XSquare className="h-3.5 w-3.5" />
              선택 해제
            </>
          ) : (
            <>
              <CheckSquare className="h-3.5 w-3.5" />
              전체 선택
            </>
          )}
        </button>
        {hasSelection && (
          <span className="text-xs text-brand-600 font-medium">
            {selectedCount}명 선택됨
          </span>
        )}
      </div>
    </div>
  );
}
