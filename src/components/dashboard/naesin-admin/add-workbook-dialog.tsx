'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import type { NaesinWorkbook } from '@/types/naesin';
import { logger } from '@/lib/logger';

export function AddWorkbookDialog({ onAdd }: { onAdd: (wb: NaesinWorkbook) => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [publisher, setPublisher] = useState('');
  const [grade, setGrade] = useState('1');
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    if (!title.trim()) { toast.error('교재명을 입력해주세요'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/naesin/workbooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), publisher: publisher.trim(), grade: Number(grade) }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      onAdd(data);
      setOpen(false);
      setTitle('');
      setPublisher('');
      setGrade('1');
      toast.success('교재가 추가되었습니다');
    } catch (err) {
      logger.error('admin.add_workbook', { error: err instanceof Error ? err.message : String(err) });
      toast.error('교재 추가에 실패했습니다');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" />
          교재 추가
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>교재 추가</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>교재명</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 마더텅 중2" />
          </div>
          <div>
            <Label>출판사</Label>
            <Input value={publisher} onChange={(e) => setPublisher(e.target.value)} placeholder="예: 마더텅" />
          </div>
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
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">취소</Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? '저장 중...' : '추가'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
