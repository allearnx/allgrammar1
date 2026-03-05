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
import { FileText, GraduationCap, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';

export function AddPassageDialog({ unitId, onAdd }: { unitId: string; onAdd: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [originalText, setOriginalText] = useState('');
  const [koreanTranslation, setKoreanTranslation] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      // Auto-generate simple blanks from the text
      const words = originalText.split(/\s+/);
      const blanksEasy = words
        .map((w, i) => ({ index: i, answer: w }))
        .filter((_, i) => i % 5 === 2) // every 5th word
        .slice(0, 10);

      // Auto-generate sentences
      const originalSentences = originalText.split(/[.!?]+/).filter((s) => s.trim());
      const koreanSentences = koreanTranslation.split(/[.!?。]+/).filter((s) => s.trim());
      const sentences = originalSentences.map((s, i) => ({
        original: s.trim() + '.',
        korean: koreanSentences[i]?.trim() || '',
        words: s.trim().split(/\s+/),
      }));

      const res = await fetch('/api/naesin/passages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unit_id: unitId,
          title,
          original_text: originalText,
          korean_translation: koreanTranslation,
          blanks_easy: blanksEasy.length > 0 ? blanksEasy : null,
          sentences: sentences.length > 0 ? sentences : null,
        }),
      });
      if (!res.ok) throw new Error();
      onAdd();
      setOpen(false);
      setTitle('');
      setOriginalText('');
      setKoreanTranslation('');
      toast.success('지문이 추가되었습니다');
    } catch {
      toast.error('지문 추가 실패');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <FileText className="h-3.5 w-3.5 mr-1" />
          지문 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>교과서 지문 추가</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label htmlFor="passage-title">제목</Label>
            <Input id="passage-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="본문 1" required />
          </div>
          <div>
            <Label htmlFor="passage-original">영어 원문</Label>
            <Textarea id="passage-original" value={originalText} onChange={(e) => setOriginalText(e.target.value)} rows={4} required />
          </div>
          <div>
            <Label htmlFor="passage-korean">한국어 번역</Label>
            <Textarea id="passage-korean" value={koreanTranslation} onChange={(e) => setKoreanTranslation(e.target.value)} rows={4} required />
          </div>
          <p className="text-xs text-muted-foreground">빈칸과 문장 배열은 원문에서 자동 생성됩니다.</p>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? '저장 중...' : '추가'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AddGrammarDialog({ unitId, onAdd }: { unitId: string; onAdd: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [contentType, setContentType] = useState<'video' | 'text'>('video');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [textContent, setTextContent] = useState('');
  const [saving, setSaving] = useState(false);

  function extractVideoId(url: string): string | null {
    const match = url.match(/(?:youtu\.be\/|v=)([^&\s]+)/);
    return match ? match[1] : null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const videoId = contentType === 'video' ? extractVideoId(youtubeUrl) : null;
      const res = await fetch('/api/naesin/grammar-lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unit_id: unitId,
          title,
          content_type: contentType,
          youtube_url: contentType === 'video' ? youtubeUrl : null,
          youtube_video_id: videoId,
          text_content: contentType === 'text' ? textContent : null,
        }),
      });
      if (!res.ok) throw new Error();
      onAdd();
      setOpen(false);
      setTitle('');
      setYoutubeUrl('');
      setTextContent('');
      toast.success('문법 설명이 추가되었습니다');
    } catch {
      toast.error('문법 설명 추가 실패');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <GraduationCap className="h-3.5 w-3.5 mr-1" />
          문법 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>문법 설명 추가</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label htmlFor="grammar-title">제목</Label>
            <Input id="grammar-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="grammar-content-type">콘텐츠 유형</Label>
            <Select value={contentType} onValueChange={(v) => setContentType(v as 'video' | 'text')}>
              <SelectTrigger id="grammar-content-type"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="video">영상</SelectItem>
                <SelectItem value="text">텍스트</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {contentType === 'video' ? (
            <div>
              <Label htmlFor="grammar-youtube">YouTube URL</Label>
              <Input id="grammar-youtube" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." required />
            </div>
          ) : (
            <div>
              <Label htmlFor="grammar-text">텍스트 내용</Label>
              <Textarea id="grammar-text" value={textContent} onChange={(e) => setTextContent(e.target.value)} rows={6} required />
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

export function AddOmrDialog({ unitId, onAdd }: { unitId: string; onAdd: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [totalQuestions, setTotalQuestions] = useState('');
  const [answerKeyText, setAnswerKeyText] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const answerKey = answerKeyText.split(',').map((s) => Number(s.trim()));
      if (answerKey.length !== Number(totalQuestions)) {
        toast.error('정답 개수와 문항 수가 일치하지 않습니다');
        setSaving(false);
        return;
      }

      const res = await fetch('/api/naesin/omr-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unit_id: unitId,
          title,
          total_questions: Number(totalQuestions),
          answer_key: answerKey,
        }),
      });
      if (!res.ok) throw new Error();
      onAdd();
      setOpen(false);
      setTitle('');
      setTotalQuestions('');
      setAnswerKeyText('');
      toast.success('OMR 시트가 추가되었습니다');
    } catch {
      toast.error('OMR 시트 추가 실패');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <ClipboardList className="h-3.5 w-3.5 mr-1" />
          OMR 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>OMR 시트 추가</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label htmlFor="omr-title">제목</Label>
            <Input id="omr-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="1차 내신 대비" required />
          </div>
          <div>
            <Label htmlFor="omr-total">총 문항 수</Label>
            <Input id="omr-total" type="number" value={totalQuestions} onChange={(e) => setTotalQuestions(e.target.value)} placeholder="25" required />
          </div>
          <div>
            <Label htmlFor="omr-answers">정답 (쉼표 구분, 1~5)</Label>
            <Textarea
              id="omr-answers"
              value={answerKeyText}
              onChange={(e) => setAnswerKeyText(e.target.value)}
              placeholder="3, 1, 5, 2, 4, 1, 3, ..."
              rows={3}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? '저장 중...' : '추가'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
