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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Pencil, Trash2, BookOpen, Upload, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import type { CourseCategory } from '@/types/public';
import { CATEGORY_LABELS, formatPrice } from '@/types/public';

interface CourseItem {
  id: string;
  created_at: string;
  title: string;
  category: CourseCategory;
  description: string;
  price: number;
  thumbnail_url: string | null;
  detail_image_url: string | null;
  teacher_id: string | null;
  is_active: boolean;
  sort_order: number;
  teacher_name: string | null;
}

interface TeacherOption {
  id: string;
  user_id: string | null;
  display_name: string;
}

interface FormData {
  title: string;
  category: CourseCategory;
  description: string;
  price: number;
  thumbnail_url: string;
  detail_image_urls: string[];
  teacher_id: string;
  is_active: boolean;
  sort_order: number;
}

const defaultForm: FormData = {
  title: '',
  category: 'grammar',
  description: '',
  price: 0,
  thumbnail_url: '',
  detail_image_urls: [],
  teacher_id: '',
  is_active: true,
  sort_order: 0,
};

const CATEGORIES: CourseCategory[] = ['grammar', 'school_exam', 'international', 'voca', 'reading'];

export function CoursesClient({ courses, teachers }: { courses: CourseItem[]; teachers: TeacherOption[] }) {
  const [filter, setFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);
  const detailInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const filtered = filter === 'all' ? courses : courses.filter((c) => c.category === filter);

  function openCreate() {
    setEditingId(null);
    setForm(defaultForm);
    setDialogOpen(true);
  }

  function openEdit(course: CourseItem) {
    setEditingId(course.id);
    let detailUrls: string[] = [];
    if (course.detail_image_url) {
      try {
        const parsed = JSON.parse(course.detail_image_url);
        detailUrls = Array.isArray(parsed) ? parsed : [course.detail_image_url];
      } catch {
        detailUrls = [course.detail_image_url];
      }
    }
    setForm({
      title: course.title,
      category: course.category,
      description: course.description,
      price: course.price,
      thumbnail_url: course.thumbnail_url || '',
      detail_image_urls: detailUrls,
      teacher_id: course.teacher_id || '',
      is_active: course.is_active,
      sort_order: course.sort_order,
    });
    setDialogOpen(true);
  }

  async function handleUpload(file: File, field: 'thumbnail_url' | 'detail_image_url') {
    setUploading(field);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/boss/upload', { method: 'POST', body: fd });
      if (!res.ok) throw new Error((await res.json()).error || '업로드 실패');
      const { url } = await res.json();
      if (field === 'detail_image_url') {
        setForm((prev) => ({ ...prev, detail_image_urls: [...prev.detail_image_urls, url] }));
      } else {
        setForm((prev) => ({ ...prev, [field]: url }));
      }
      toast.success('이미지가 업로드되었습니다');
    } catch (err) {
      toast.error('업로드 실패', { description: err instanceof Error ? err.message : '알 수 없는 오류' });
    } finally {
      setUploading(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const isEdit = editingId !== null;
      const { detail_image_urls, ...rest } = form;
      const payload = {
        ...rest,
        thumbnail_url: form.thumbnail_url || null,
        detail_image_url: detail_image_urls.length > 0 ? JSON.stringify(detail_image_urls) : null,
        teacher_id: form.teacher_id || null,
      };
      const res = await fetch('/api/boss/courses', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isEdit ? { id: editingId, ...payload } : payload),
      });
      if (!res.ok) throw new Error((await res.json()).error || '저장 실패');
      toast.success(isEdit ? '코스가 수정되었습니다' : '코스가 추가되었습니다');
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
      const res = await fetch('/api/boss/courses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error((await res.json()).error || '삭제 실패');
      toast.success('코스가 삭제되었습니다');
      router.refresh();
    } catch (err) {
      toast.error('삭제 실패', { description: err instanceof Error ? err.message : '알 수 없는 오류' });
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">총 {courses.length}개</p>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" />
          코스 추가
        </Button>
      </div>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="all">전체</TabsTrigger>
          {CATEGORIES.map((cat) => (
            <TabsTrigger key={cat} value={cat}>
              {CATEGORY_LABELS[cat]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">순서</TableHead>
              <TableHead className="w-[60px]">썸네일</TableHead>
              <TableHead>제목</TableHead>
              <TableHead className="hidden md:table-cell">카테고리</TableHead>
              <TableHead className="hidden md:table-cell">선생님</TableHead>
              <TableHead className="hidden lg:table-cell">가격</TableHead>
              <TableHead className="w-[70px]">활성</TableHead>
              <TableHead className="w-[100px]">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((course) => (
              <TableRow key={course.id}>
                <TableCell className="text-muted-foreground">{course.sort_order}</TableCell>
                <TableCell>
                  {course.thumbnail_url ? (
                    <Image
                      src={course.thumbnail_url}
                      alt={course.title}
                      width={40}
                      height={40}
                      className="rounded object-cover w-10 h-10"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{course.title}</TableCell>
                <TableCell className="hidden md:table-cell">
                  <Badge variant="secondary">{CATEGORY_LABELS[course.category]}</Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {course.teacher_name || '-'}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {formatPrice(course.price)}원
                </TableCell>
                <TableCell>
                  <Badge variant={course.is_active ? 'default' : 'secondary'}>
                    {course.is_active ? '활성' : '비활성'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(course)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(course.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  코스가 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? '코스 수정' : '코스 추가'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>제목</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="코스 제목"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>카테고리</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm({ ...form, category: v as CourseCategory })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {CATEGORY_LABELS[cat]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>가격 (원)</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>설명</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>담당 선생님</Label>
              <Select
                value={form.teacher_id || 'none'}
                onValueChange={(v) => setForm({ ...form, teacher_id: v === 'none' ? '' : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="선택 안 함" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">선택 안 함</SelectItem>
                  {teachers.filter((t) => t.user_id).map((t) => (
                    <SelectItem key={t.id} value={t.user_id!}>
                      {t.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>썸네일 이미지</Label>
              <div className="flex items-center gap-3">
                {form.thumbnail_url ? (
                  <Image
                    src={form.thumbnail_url}
                    alt="thumbnail"
                    width={64}
                    height={64}
                    className="rounded object-cover w-16 h-16"
                  />
                ) : (
                  <div className="w-16 h-16 rounded bg-muted flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <input
                    ref={thumbInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload(file, 'thumbnail_url');
                      e.target.value = '';
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => thumbInputRef.current?.click()}
                    disabled={uploading === 'thumbnail_url'}
                  >
                    {uploading === 'thumbnail_url' ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
                    {uploading === 'thumbnail_url' ? '업로드 중...' : '썸네일 업로드'}
                  </Button>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>상세 이미지 ({form.detail_image_urls.length}개)</Label>
              {form.detail_image_urls.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {form.detail_image_urls.map((url, idx) => (
                    <div key={idx} className="relative flex-shrink-0">
                      <Image
                        src={url}
                        alt={`detail-${idx + 1}`}
                        width={64}
                        height={64}
                        className="rounded object-cover w-16 h-16"
                      />
                      <button
                        type="button"
                        className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center"
                        onClick={() => setForm((prev) => ({
                          ...prev,
                          detail_image_urls: prev.detail_image_urls.filter((_, i) => i !== idx),
                        }))}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div>
                <input
                  ref={detailInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(file, 'detail_image_url');
                    e.target.value = '';
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => detailInputRef.current?.click()}
                  disabled={uploading === 'detail_image_url'}
                >
                  {uploading === 'detail_image_url' ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
                  {uploading === 'detail_image_url' ? '업로드 중...' : '이미지 추가'}
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>정렬 순서</Label>
                <Input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="flex items-center gap-2 pt-7">
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(v: boolean) => setForm({ ...form, is_active: v })}
                />
                <Label>활성</Label>
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
        description="정말 이 코스를 삭제하시겠습니까?"
        onConfirm={() => {
          const id = deleteId;
          setDeleteId(null);
          if (id) handleDelete(id);
        }}
      />
    </div>
  );
}
