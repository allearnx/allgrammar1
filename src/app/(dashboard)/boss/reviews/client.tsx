'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Pencil, Trash2, Star } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import type { Review } from '@/types/public';

interface FormData {
  student_grade: string;
  course_name: string;
  content: string;
  achievement: string;
  display_order: number;
  is_visible: boolean;
}

const defaultForm: FormData = {
  student_grade: '',
  course_name: '',
  content: '',
  achievement: '',
  display_order: 0,
  is_visible: true,
};

export function ReviewsClient({ reviews }: { reviews: Review[] }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const router = useRouter();

  function openCreate() {
    setEditingId(null);
    setForm(defaultForm);
    setDialogOpen(true);
  }

  function openEdit(review: Review) {
    setEditingId(review.id);
    setForm({
      student_grade: review.student_grade,
      course_name: review.course_name,
      content: review.content,
      achievement: review.achievement || '',
      display_order: review.display_order,
      is_visible: review.is_visible,
    });
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const isEdit = editingId !== null;
      const payload = {
        ...form,
        achievement: form.achievement || null,
      };
      const res = await fetch('/api/boss/reviews', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEdit ? { id: editingId, ...payload } : payload),
      });
      if (!res.ok) throw new Error((await res.json()).error || '저장 실패');
      toast.success(isEdit ? '후기가 수정되었습니다' : '후기가 추가되었습니다');
      setDialogOpen(false);
      router.refresh();
    } catch (err) {
      toast.error('저장 실패', { description: err instanceof Error ? err.message : '알 수 없는 오류' });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch('/api/boss/reviews', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error((await res.json()).error || '삭제 실패');
      toast.success('후기가 삭제되었습니다');
      router.refresh();
    } catch (err) {
      toast.error('삭제 실패', { description: err instanceof Error ? err.message : '알 수 없는 오류' });
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">총 {reviews.length}개</p>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" />
          후기 추가
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">순서</TableHead>
              <TableHead>학년</TableHead>
              <TableHead>수강 과목</TableHead>
              <TableHead className="hidden md:table-cell">내용</TableHead>
              <TableHead className="hidden lg:table-cell">성과</TableHead>
              <TableHead className="w-[70px]">공개</TableHead>
              <TableHead className="w-[100px]">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reviews.map((review) => (
              <TableRow key={review.id}>
                <TableCell className="text-muted-foreground">{review.display_order}</TableCell>
                <TableCell className="font-medium">{review.student_grade}</TableCell>
                <TableCell>{review.course_name}</TableCell>
                <TableCell className="hidden md:table-cell max-w-[300px] truncate">
                  {review.content}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {review.achievement || '-'}
                </TableCell>
                <TableCell>
                  <Badge variant={review.is_visible ? 'default' : 'secondary'}>
                    {review.is_visible ? '공개' : '비공개'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(review)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(review.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {reviews.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  <Star className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  후기가 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? '후기 수정' : '후기 추가'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>학년</Label>
                <Input
                  value={form.student_grade}
                  onChange={(e) => setForm({ ...form, student_grade: e.target.value })}
                  placeholder="예: 중2"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>수강 과목</Label>
                <Input
                  value={form.course_name}
                  onChange={(e) => setForm({ ...form, course_name: e.target.value })}
                  placeholder="예: 올인내신"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>내용</Label>
              <Textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={4}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>성과 (선택)</Label>
              <Input
                value={form.achievement}
                onChange={(e) => setForm({ ...form, achievement: e.target.value })}
                placeholder="예: 영어 30점 → 90점"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>표시 순서</Label>
                <Input
                  type="number"
                  value={form.display_order}
                  onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="flex items-center gap-2 pt-7">
                <Switch
                  checked={form.is_visible}
                  onCheckedChange={(v: boolean) => setForm({ ...form, is_visible: v })}
                />
                <Label>공개</Label>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? '저장 중...' : editingId ? '수정' : '추가'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => { if (!open) setDeleteId(null); }}
        description="정말 이 후기를 삭제하시겠습니까?"
        onConfirm={() => {
          const id = deleteId;
          setDeleteId(null);
          if (id) handleDelete(id);
        }}
      />
    </div>
  );
}
