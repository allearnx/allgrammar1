'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import type { NaesinTextbook } from '@/types/database';
import { fetchWithToast } from '@/lib/fetch-with-toast';

export function EditTextbookDialog({
  textbook,
  open,
  onOpenChange,
  onSave,
}: {
  textbook: NaesinTextbook;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (tb: NaesinTextbook) => void;
}) {
  const [grade, setGrade] = useState(String(textbook.grade));
  const [publisher, setPublisher] = useState(textbook.publisher);
  const [displayName, setDisplayName] = useState(textbook.display_name);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const data = await fetchWithToast<NaesinTextbook>('/api/naesin/textbooks', {
        method: 'PATCH',
        body: {
          id: textbook.id,
          grade,
          publisher,
          display_name: displayName,
        },
        successMessage: '교과서가 수정되었습니다',
        errorMessage: '교과서 수정 실패',
      });
      onSave(data);
      onOpenChange(false);
    } catch {
      // fetchWithToast already handles toast
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>교과서 수정</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>학년</Label>
            <Select value={grade} onValueChange={setGrade}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">중1</SelectItem>
                <SelectItem value="2">중2</SelectItem>
                <SelectItem value="3">중3</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>출판사</Label>
            <Input value={publisher} onChange={(e) => setPublisher(e.target.value)} required />
          </div>
          <div>
            <Label>표시 이름</Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? '저장 중...' : '수정'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AddTextbookDialog({ onAdd }: { onAdd: (tb: NaesinTextbook) => void }) {
  const [open, setOpen] = useState(false);
  const [grade, setGrade] = useState('1');
  const [publisher, setPublisher] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const data = await fetchWithToast<NaesinTextbook>('/api/naesin/textbooks', {
        body: {
          grade,
          publisher,
          display_name: displayName,
        },
        successMessage: '교과서가 추가되었습니다',
        errorMessage: '교과서 추가 실패',
      });
      onAdd(data);
      setOpen(false);
      setPublisher('');
      setDisplayName('');
    } catch {
      // fetchWithToast already handles toast
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" />
          교과서 추가
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>교과서 추가</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>학년</Label>
            <Select value={grade} onValueChange={setGrade}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">중1</SelectItem>
                <SelectItem value="2">중2</SelectItem>
                <SelectItem value="3">중3</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>출판사</Label>
            <Input value={publisher} onChange={(e) => setPublisher(e.target.value)} placeholder="능률, 동아 등" required />
          </div>
          <div>
            <Label>표시 이름</Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="능률 중1 영어" required />
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? '저장 중...' : '추가'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
