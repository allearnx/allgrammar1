'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  studentId: string;
  studentName: string;
  studentEmail: string;
}

export function StudentDeleteButton({ studentId, studentName, studentEmail }: Props) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/boss/users/${studentId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '삭제 실패');
      }
      toast.success('학생이 삭제되었습니다');
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error('삭제 실패', { description: err instanceof Error ? err.message : '알 수 없는 오류' });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>학생 삭제</DialogTitle>
            <DialogDescription>
              <strong>{studentName}</strong> ({studentEmail})를 삭제하시겠습니까?
              이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              취소
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? '삭제 중...' : '삭제'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
