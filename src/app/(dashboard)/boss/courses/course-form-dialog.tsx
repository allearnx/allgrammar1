'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { BookOpen, Upload, Loader2, X } from 'lucide-react';
import { CATEGORY_LABELS } from '@/types/public';
import type { CourseCategory } from '@/types/public';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import type { CourseFormData, TeacherOption } from './types';
import { CATEGORIES } from './types';

interface CourseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingId: string | null;
  form: CourseFormData;
  setForm: React.Dispatch<React.SetStateAction<CourseFormData>>;
  teachers: TeacherOption[];
  onSubmit: (e: React.FormEvent) => void;
  saving: boolean;
}

export function CourseFormDialog({
  open,
  onOpenChange,
  editingId,
  form,
  setForm,
  teachers,
  onSubmit,
  saving,
}: CourseFormDialogProps) {
  const [uploading, setUploading] = useState<string | null>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);
  const detailInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(file: File, field: 'thumbnail_url' | 'detail_image_url') {
    setUploading(field);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { url } = await fetchWithToast<{ url: string }>('/api/boss/upload', {
        body: fd,
        successMessage: '이미지가 업로드되었습니다',
        errorMessage: '업로드 실패',
      });
      if (field === 'detail_image_url') {
        setForm((prev) => ({ ...prev, detail_image_urls: [...prev.detail_image_urls, url] }));
      } else {
        setForm((prev) => ({ ...prev, [field]: url }));
      }
    } catch {
      // error already toasted
    } finally {
      setUploading(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingId ? '코스 수정' : '코스 추가'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
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
            />
          </div>
          <div className="space-y-2">
            <Label>담당 선생님</Label>
            <div className="flex gap-2">
              <Select
                value={form.teacher_id || undefined}
                onValueChange={(v) => setForm({ ...form, teacher_id: v })}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="선택 안 함" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.teacher_id && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 shrink-0"
                  onClick={() => setForm({ ...form, teacher_id: '' })}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
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
  );
}
