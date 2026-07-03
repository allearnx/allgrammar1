'use client';

import { useRef, useState } from 'react';
import { toast } from 'sonner';
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
import { Plus, ImagePlus, X } from 'lucide-react';
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
  const [coverUrl, setCoverUrl] = useState(book?.cover_image_url ?? '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // 같은 파일 재선택 가능하도록
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/naesin/upload-image', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '업로드 실패');
      setCoverUrl(data.url);
      toast.success('표지 이미지가 업로드되었습니다');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '표지 업로드 중 오류가 발생했습니다');
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      if (mode === 'add') {
        const data = await fetchWithToast<VocaBook>('/api/voca/books', {
          body: { title: title.trim(), description: description.trim() || null, cover_image_url: coverUrl || null },
          successMessage: '교재가 추가되었습니다',
          errorMessage: '교재 추가 중 오류가 발생했습니다',
          logContext: 'voca_admin.index',
        });
        onSave(data);
        setOpen(false);
        setTitle('');
        setDescription('');
        setCoverUrl('');
      } else {
        const data = await fetchWithToast<VocaBook>(`/api/voca/books/${book!.id}`, {
          method: 'PATCH',
          body: { id: book!.id, title: title.trim(), description: description.trim() || null, cover_image_url: coverUrl || null },
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
          <div>
            <Label>표지 이미지 (선택)</Label>
            <p className="text-xs text-muted-foreground mb-2">
              홍보 페이지 교재 카드에 표시됩니다. 표지가 있는 교재만 노출돼요.
            </p>
            {coverUrl ? (
              <div className="relative inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element -- Supabase Storage 외부 URL 미리보기 */}
                <img src={coverUrl} alt="교재 표지 미리보기" className="h-36 rounded-lg border object-cover" />
                <button
                  type="button"
                  onClick={() => setCoverUrl('')}
                  className="absolute -right-2 -top-2 rounded-full bg-gray-800 p-1 text-white hover:bg-gray-600"
                  aria-label="표지 제거"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                <ImagePlus className="h-4 w-4 mr-1.5" />
                {uploading ? '업로드 중...' : '이미지 선택'}
              </Button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleCoverUpload}
            />
          </div>
          <Button type="submit" className="w-full" disabled={saving || uploading || !title.trim()}>
            {saving ? '저장 중...' : mode === 'add' ? '추가' : '저장'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );

  return dialog;
}
