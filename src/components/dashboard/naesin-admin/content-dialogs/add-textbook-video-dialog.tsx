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
import { PlayCircle } from 'lucide-react';
import { useFormDialog } from '@/hooks/use-form-dialog';
import { fetchWithToast } from '@/lib/fetch-with-toast';

export function AddTextbookVideoDialog({ unitId, onAdd }: { unitId: string; onAdd: () => void }) {
  const { open, setOpen, saving, handleSubmit } = useFormDialog({
    onSuccess: onAdd,
    logContext: 'admin.add_textbook_video',
    successMessage: '교과서 설명 영상이 추가되었습니다',
    errorMessage: '교과서 설명 영상 추가 실패',
  });
  const [title, setTitle] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await handleSubmit(async () => {
      await fetchWithToast('/api/naesin/textbook-videos', {
        body: { unitId, title, youtubeUrl },
        silent: true,
      });
    }, () => { setTitle(''); setYoutubeUrl(''); });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <PlayCircle className="h-3.5 w-3.5 mr-1" />
          본문 영상 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>교과서 본문 설명 영상 추가</DialogTitle></DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <Label htmlFor="tbv-title">제목</Label>
            <Input id="tbv-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="1과 본문 설명" required />
          </div>
          <div>
            <Label htmlFor="tbv-youtube">YouTube URL</Label>
            <Input id="tbv-youtube" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." required />
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? '저장 중...' : '추가'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
