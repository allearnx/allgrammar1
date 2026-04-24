'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Brain } from 'lucide-react';
import { extractVideoId } from '@/lib/utils/youtube';
import { useFormDialog } from '@/hooks/use-form-dialog';
import { fetchWithToast } from '@/lib/fetch-with-toast';

export function AddLastReviewDialog({ unitId, onAdd }: { unitId: string; onAdd: () => void }) {
  const { open, setOpen, saving, handleSubmit } = useFormDialog({
    onSuccess: onAdd,
    logContext: 'admin.add_last_review',
    successMessage: '직전보강 자료가 추가되었습니다',
    errorMessage: '직전보강 자료 추가 실패',
  });
  const [title, setTitle] = useState('');
  const [contentType, setContentType] = useState<'video' | 'pdf' | 'text'>('video');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [textContent, setTextContent] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await handleSubmit(async () => {
      const videoId = contentType === 'video' ? extractVideoId(youtubeUrl) : null;
      await fetchWithToast('/api/naesin/last-review', {
        body: {
          unitId,
          contentType,
          title,
          youtubeUrl: contentType === 'video' ? youtubeUrl : null,
          youtubeVideoId: videoId,
          pdfUrl: contentType === 'pdf' ? pdfUrl : null,
          textContent: contentType === 'text' ? textContent : null,
        },
        silent: true,
      });
    }, () => { setTitle(''); setYoutubeUrl(''); setPdfUrl(''); setTextContent(''); });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Brain className="h-3.5 w-3.5 mr-1" />
          직전보강 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>직전보강 자료 추가</DialogTitle></DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <Label htmlFor="lastreview-title">제목</Label>
            <Input id="lastreview-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="lastreview-content-type">콘텐츠 유형</Label>
            <Select value={contentType} onValueChange={(v) => setContentType(v as 'video' | 'pdf' | 'text')}>
              <SelectTrigger id="lastreview-content-type"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="video">영상</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="text">텍스트</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {contentType === 'video' && (
            <div>
              <Label htmlFor="lastreview-youtube">YouTube URL</Label>
              <Input id="lastreview-youtube" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." required />
            </div>
          )}
          {contentType === 'pdf' && (
            <div>
              <Label htmlFor="lastreview-pdf">PDF URL</Label>
              <Input id="lastreview-pdf" value={pdfUrl} onChange={(e) => setPdfUrl(e.target.value)} placeholder="https://..." required />
            </div>
          )}
          {contentType === 'text' && (
            <div>
              <Label htmlFor="lastreview-text">텍스트 내용</Label>
              <Textarea id="lastreview-text" value={textContent} onChange={(e) => setTextContent(e.target.value)} rows={6} required />
            </div>
          )}
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? '저장 중...' : '추가'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
