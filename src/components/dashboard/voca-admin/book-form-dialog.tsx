'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import type { VocaBook } from '@/types/voca';

interface BookFormDialogProps {
  mode: 'add' | 'edit';
  book?: VocaBook;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSave: (book: VocaBook) => void;
}

export function BookFormDialog({ mode, book, open: controlledOpen, onOpenChange, onSave }: BookFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (onOpenChange ?? (() => {})) : setInternalOpen;

  const [title, setTitle] = useState(book?.title ?? '');
  const [description, setDescription] = useState(book?.description ?? '');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      if (mode === 'add') {
        const data = await fetchWithToast<VocaBook>('/api/voca/books', {
          body: { title: title.trim(), description: description.trim() || null },
          successMessage: '교재가 추가되었습니다',
          errorMessage: '교재 추가 중 오류가 발생했습니다',
          logContext: 'voca_admin.index',
        });
        onSave(data);
        setOpen(false);
        setTitle('');
        setDescription('');
      } else {
        const data = await fetchWithToast<VocaBook>(`/api/voca/books/${book!.id}`, {
          method: 'PATCH',
          body: { id: book!.id, title: title.trim(), description: description.trim() || null },
          successMessage: '교재가 수정되었습니다',
          errorMessage: '교재 수정 중 오류가 발생했습니다',
          logContext: 'voca_admin.index',
        });
        onSave(data);
        setOpen(false);
      }
    } catch {
      // fetchWithToast already shows toast
    } finally {
      setSaving(false);
    }
  }

  const dialog = (
    <Dialog open={open} onOpenChange={setOpen}>
      {mode === 'add' && !isControlled && (
        <DialogTrigger asChild>
          <Button size="sm"><Plus className="h-4 w-4 mr-1" />교재 추가</Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? '교재 추가' : '교재 수정'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>교재명</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={mode === 'add' ? '예: 올킬보카 중1' : undefined}
            />
          </div>
          <div>
            <Label>설명 (선택)</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={mode === 'add' ? '교재 설명' : undefined}
            />
          </div>
          <Button type="submit" className="w-full" disabled={saving || !title.trim()}>
            {saving ? '저장 중...' : mode === 'add' ? '추가' : '저장'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );

  return dialog;
}
