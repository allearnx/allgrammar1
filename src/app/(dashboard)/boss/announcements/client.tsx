'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Pencil, Trash2, Megaphone } from 'lucide-react';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import type { Announcement, AnnouncementType } from '@/types/announcement';
import { ANNOUNCEMENT_TYPE_LABELS } from '@/types/announcement';

const TYPES: AnnouncementType[] = ['info', 'warning', 'important'];
const TARGET_ROLES = [
  { value: 'student', label: '학생' },
  { value: 'admin', label: '원장' },
  { value: 'teacher', label: '선생님' },
];

const typeBadgeColors: Record<AnnouncementType, string> = {
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  important: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
};

interface FormData {
  title: string;
  content: string;
  type: AnnouncementType;
  target_roles: string[];
  is_published: boolean;
}

const defaultForm: FormData = {
  title: '',
  content: '',
  type: 'info',
  target_roles: ['admin', 'teacher'],
  is_published: false,
};

export function AnnouncementsClient({ announcements }: { announcements: Announcement[] }) {
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

  function openEdit(a: Announcement) {
    setEditingId(a.id);
    setForm({
      title: a.title,
      content: a.content,
      type: a.type,
      target_roles: a.target_roles,
      is_published: a.is_published,
    });
    setDialogOpen(true);
  }

  function toggleRole(role: string) {
    setForm((prev) => {
      const has = prev.target_roles.includes(role);
      const next = has
        ? prev.target_roles.filter((r) => r !== role)
        : [...prev.target_roles, role];
      return { ...prev, target_roles: next.length > 0 ? next : prev.target_roles };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const isEdit = editingId !== null;
      await fetchWithToast('/api/boss/announcements', {
        method: isEdit ? 'PATCH' : 'POST',
        body: isEdit ? { id: editingId, ...form } : form,
        successMessage: isEdit ? '공지가 수정되었습니다' : '공지가 추가되었습니다',
        errorMessage: '저장 실패',
      });
      setDialogOpen(false);
      router.refresh();
    } catch {
      // error already toasted
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await fetchWithToast('/api/boss/announcements', {
        method: 'DELETE',
        body: { id },
        successMessage: '공지가 삭제되었습니다',
        errorMessage: '삭제 실패',
      });
      router.refresh();
    } catch {
      // error already toasted
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">총 {announcements.length}개</p>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" />
          공지 추가
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>제목</TableHead>
              <TableHead className="w-[80px]">유형</TableHead>
              <TableHead className="hidden md:table-cell w-[120px]">대상</TableHead>
              <TableHead className="w-[70px]">공개</TableHead>
              <TableHead className="w-[100px]">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {announcements.map((a) => (
              <TableRow key={a.id}>
                <TableCell>
                  <div className="font-medium">{a.title}</div>
                  <div className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                    {a.content}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className={typeBadgeColors[a.type]}>
                    {ANNOUNCEMENT_TYPE_LABELS[a.type]}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="flex gap-1">
                    {a.target_roles.map((r) => (
                      <Badge key={r} variant="outline" className="text-[11px]">
                        {r === 'student' ? '학생' : r === 'admin' ? '원장' : '선생님'}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={a.is_published ? 'default' : 'secondary'}>
                    {a.is_published ? '공개' : '비공개'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(a)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(a.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {announcements.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  <Megaphone className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  공지사항이 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? '공지 수정' : '공지 추가'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>제목</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>내용</Label>
              <Textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>유형</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm({ ...form, type: v as AnnouncementType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {ANNOUNCEMENT_TYPE_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>대상 역할</Label>
                <div className="flex flex-col gap-2 pt-1">
                  {TARGET_ROLES.map((r) => (
                    <label key={r.value} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={form.target_roles.includes(r.value)}
                        onCheckedChange={() => toggleRole(r.value)}
                      />
                      {r.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.is_published}
                onCheckedChange={(v: boolean) => setForm({ ...form, is_published: v })}
              />
              <Label>공개</Label>
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
        description="정말 이 공지를 삭제하시겠습니까?"
        onConfirm={() => {
          const id = deleteId;
          setDeleteId(null);
          if (id) handleDelete(id);
        }}
      />
    </div>
  );
}
