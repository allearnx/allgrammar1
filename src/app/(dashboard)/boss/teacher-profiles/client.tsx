'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
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
import { Plus, Pencil, Trash2, UserCircle, Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import type { TeacherProfile } from '@/types/public';

interface FormData {
  display_name: string;
  bio: string;
  image_url: string;
  image_position: 'center' | 'top' | 'bottom';
  is_visible: boolean;
  sort_order: number;
}

const defaultForm: FormData = {
  display_name: '',
  bio: '',
  image_url: '',
  image_position: 'center',
  is_visible: true,
  sort_order: 0,
};

export function TeacherProfilesClient({ profiles }: { profiles: TeacherProfile[] }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function openCreate() {
    setEditingId(null);
    setForm(defaultForm);
    setDialogOpen(true);
  }

  function openEdit(profile: TeacherProfile) {
    setEditingId(profile.id);
    setForm({
      display_name: profile.display_name,
      bio: profile.bio,
      image_url: profile.image_url || '',
      image_position: (profile.image_position as 'center' | 'top' | 'bottom') || 'center',
      is_visible: profile.is_visible,
      sort_order: profile.sort_order,
    });
    setDialogOpen(true);
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/boss/upload', { method: 'POST', body: formData });
      if (!res.ok) throw new Error((await res.json()).error || '업로드 실패');
      const { url } = await res.json();
      setForm((prev) => ({ ...prev, image_url: url }));
      toast.success('이미지가 업로드되었습니다');
    } catch (err) {
      toast.error('업로드 실패', { description: err instanceof Error ? err.message : '알 수 없는 오류' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const isEdit = editingId !== null;
      const payload = {
        ...form,
        image_url: form.image_url || null,
      };
      const res = await fetch('/api/boss/teacher-profiles', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEdit ? { id: editingId, ...payload } : payload),
      });
      if (!res.ok) throw new Error((await res.json()).error || '저장 실패');
      toast.success(isEdit ? '프로필이 수정되었습니다' : '프로필이 추가되었습니다');
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
      const res = await fetch('/api/boss/teacher-profiles', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error((await res.json()).error || '삭제 실패');
      toast.success('프로필이 삭제되었습니다');
      router.refresh();
    } catch (err) {
      toast.error('삭제 실패', { description: err instanceof Error ? err.message : '알 수 없는 오류' });
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">총 {profiles.length}명</p>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" />
          프로필 추가
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">순서</TableHead>
              <TableHead className="w-[60px]">사진</TableHead>
              <TableHead>이름</TableHead>
              <TableHead className="hidden md:table-cell">소개</TableHead>
              <TableHead className="w-[70px]">공개</TableHead>
              <TableHead className="w-[100px]">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {profiles.map((profile) => (
              <TableRow key={profile.id}>
                <TableCell className="text-muted-foreground">{profile.sort_order}</TableCell>
                <TableCell>
                  {profile.image_url ? (
                    <Image
                      src={profile.image_url}
                      alt={profile.display_name}
                      width={40}
                      height={40}
                      className="rounded-full object-cover w-10 h-10"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <UserCircle className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{profile.display_name}</TableCell>
                <TableCell className="hidden md:table-cell max-w-[300px] truncate">
                  {profile.bio}
                </TableCell>
                <TableCell>
                  <Badge variant={profile.is_visible ? 'default' : 'secondary'}>
                    {profile.is_visible ? '공개' : '비공개'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(profile)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(profile.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {profiles.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  <UserCircle className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  등록된 선생님 프로필이 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? '프로필 수정' : '프로필 추가'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>이름</Label>
              <Input
                value={form.display_name}
                onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                placeholder="선생님 이름"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>소개</Label>
              <Textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                rows={3}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>프로필 사진</Label>
              <div className="flex items-center gap-3">
                {form.image_url ? (
                  <Image
                    src={form.image_url}
                    alt="preview"
                    width={64}
                    height={64}
                    className="rounded-lg object-cover w-16 h-16"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                    <UserCircle className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleUpload}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
                    {uploading ? '업로드 중...' : '사진 업로드'}
                  </Button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>이미지 위치</Label>
                <Select
                  value={form.image_position}
                  onValueChange={(v) => setForm({ ...form, image_position: v as 'center' | 'top' | 'bottom' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top">상단</SelectItem>
                    <SelectItem value="center">중앙</SelectItem>
                    <SelectItem value="bottom">하단</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>정렬 순서</Label>
                <Input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.is_visible}
                onCheckedChange={(v: boolean) => setForm({ ...form, is_visible: v })}
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
        description="정말 이 프로필을 삭제하시겠습니까?"
        onConfirm={() => {
          const id = deleteId;
          setDeleteId(null);
          if (id) handleDelete(id);
        }}
      />
    </div>
  );
}
