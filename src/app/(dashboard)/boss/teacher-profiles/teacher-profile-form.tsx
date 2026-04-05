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
import { UserCircle, Upload, Loader2 } from 'lucide-react';
import { fetchWithToast } from '@/lib/fetch-with-toast';

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

interface TeacherProfileFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingId: string | null;
  initialForm?: FormData;
  onSuccess: () => void;
}

export function TeacherProfileForm({
  open,
  onOpenChange,
  editingId,
  initialForm,
  onSuccess,
}: TeacherProfileFormProps) {
  const [form, setForm] = useState<FormData>(initialForm ?? defaultForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { url } = await fetchWithToast<{ url: string }>('/api/boss/upload', {
        body: fd,
        successMessage: '이미지가 업로드되었습니다',
        errorMessage: '업로드 실패',
      });
      setForm((prev) => ({ ...prev, image_url: url }));
    } catch {
      // error already toasted
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
      const payload = { ...form, image_url: form.image_url || null };
      await fetchWithToast('/api/boss/teacher-profiles', {
        method: isEdit ? 'PATCH' : 'POST',
        body: isEdit ? { id: editingId, ...payload } : payload,
        successMessage: isEdit ? '프로필이 수정되었습니다' : '프로필이 추가되었습니다',
        errorMessage: '저장 실패',
      });
      onOpenChange(false);
      onSuccess();
    } catch {
      // error already toasted
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
  );
}

export { defaultForm };
export type { FormData };
