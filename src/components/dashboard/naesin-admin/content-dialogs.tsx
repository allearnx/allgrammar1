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
import { FileText, GraduationCap, ClipboardList, Brain, Upload, Loader2, Check, Wand2, X } from 'lucide-react';
import { toast } from 'sonner';
import type { BlankItem } from '@/types/textbook';

type DifficultyKey = 'easy' | 'medium' | 'hard';

const AUTO_INTERVAL: Record<DifficultyKey, number> = { easy: 5, medium: 3, hard: 2 };
const DIFFICULTY_LABEL: Record<DifficultyKey, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };

function generateAutoBlanks(originalText: string, difficulty: DifficultyKey): BlankItem[] {
  const words = originalText.trim().split(/\s+/);
  const interval = AUTO_INTERVAL[difficulty];
  return words
    .map((w, i) => ({ index: i, answer: w }))
    .filter((_, i) => i % interval === interval - 1);
}

function BlankConfigurator({
  difficulty,
  originalText,
  blanks,
  onUpdate,
}: {
  difficulty: DifficultyKey;
  originalText: string;
  blanks: BlankItem[] | null;
  onUpdate: (blanks: BlankItem[] | null) => void;
}) {
  const [extracting, setExtracting] = useState(false);
  const label = DIFFICULTY_LABEL[difficulty];

  async function handlePdfUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!originalText.trim()) {
      toast.error('영어 원문을 먼저 입력해주세요.');
      return;
    }

    setExtracting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('original_text', originalText);

      const res = await fetch('/api/naesin/passages/extract-blanks', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || '추출 실패');
      }
      const data = await res.json();
      onUpdate(data.blanks);
      toast.success(`${label}: ${data.blanks.length}개 빈칸 추출됨`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'PDF 추출 실패');
    } finally {
      setExtracting(false);
    }
  }

  function handleAutoGenerate() {
    if (!originalText.trim()) {
      toast.error('영어 원문을 먼저 입력해주세요.');
      return;
    }
    const generated = generateAutoBlanks(originalText, difficulty);
    onUpdate(generated);
    toast.success(`${label}: ${generated.length}개 빈칸 자동 생성됨`);
  }

  const hasOriginal = originalText.trim().length > 0;

  return (
    <div className="flex items-center gap-1.5">
      <span className="min-w-[52px] text-xs font-medium">{label}</span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-7 text-xs"
        disabled={!hasOriginal}
        onClick={handleAutoGenerate}
      >
        <Wand2 className="h-3 w-3 mr-1" />자동
      </Button>
      <input
        type="file"
        accept=".pdf"
        className="hidden"
        id={`pdf-${difficulty}`}
        onChange={handlePdfUpload}
        disabled={extracting || !hasOriginal}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-7 text-xs"
        disabled={extracting || !hasOriginal}
        onClick={() => document.getElementById(`pdf-${difficulty}`)?.click()}
      >
        {extracting ? (
          <><Loader2 className="h-3 w-3 mr-1 animate-spin" />추출 중...</>
        ) : (
          <><Upload className="h-3 w-3 mr-1" />PDF</>
        )}
      </Button>
      {blanks ? (
        <span className="text-xs text-green-600 flex items-center gap-0.5 whitespace-nowrap">
          <Check className="h-3 w-3" />{blanks.length}개
          <button type="button" className="ml-0.5 text-muted-foreground hover:text-destructive" onClick={() => onUpdate(null)}>
            <X className="h-3 w-3" />
          </button>
        </span>
      ) : (
        <span className="text-xs text-muted-foreground">미설정</span>
      )}
    </div>
  );
}

export function AddPassageDialog({ unitId, onAdd }: { unitId: string; onAdd: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [originalText, setOriginalText] = useState('');
  const [koreanTranslation, setKoreanTranslation] = useState('');
  const [blanksEasy, setBlanksEasy] = useState<BlankItem[] | null>(null);
  const [blanksMedium, setBlanksMedium] = useState<BlankItem[] | null>(null);
  const [blanksHard, setBlanksHard] = useState<BlankItem[] | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      // Use PDF-extracted blanks if available, otherwise auto-generate Easy
      let finalBlanksEasy = blanksEasy;
      if (!finalBlanksEasy) {
        const words = originalText.split(/\s+/);
        finalBlanksEasy = words
          .map((w, i) => ({ index: i, answer: w }))
          .filter((_, i) => i % 5 === 2)
          .slice(0, 10);
      }

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
          blanks_easy: finalBlanksEasy.length > 0 ? finalBlanksEasy : null,
          blanks_medium: blanksMedium,
          blanks_hard: blanksHard,
          sentences: sentences.length > 0 ? sentences : null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || '요청에 실패했습니다');
      }
      onAdd();
      setOpen(false);
      setTitle('');
      setOriginalText('');
      setKoreanTranslation('');
      setBlanksEasy(null);
      setBlanksMedium(null);
      setBlanksHard(null);
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

          <div className="space-y-2 rounded-md border p-3">
            <p className="text-xs font-medium">빈칸 설정</p>
            <p className="text-xs text-muted-foreground">난이도별로 자동 생성 또는 PDF에서 추출할 수 있습니다.</p>
            <BlankConfigurator difficulty="easy" originalText={originalText} blanks={blanksEasy} onUpdate={setBlanksEasy} />
            <BlankConfigurator difficulty="medium" originalText={originalText} blanks={blanksMedium} onUpdate={setBlanksMedium} />
            <BlankConfigurator difficulty="hard" originalText={originalText} blanks={blanksHard} onUpdate={setBlanksHard} />
            {!blanksEasy && !blanksMedium && !blanksHard && (
              <p className="text-xs text-muted-foreground">미설정 시 Easy 빈칸은 자동 생성됩니다.</p>
            )}
          </div>

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
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || '요청에 실패했습니다');
      }
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
          문법 영상 올리기
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
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || '요청에 실패했습니다');
      }
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

export function AddProblemDialog({ unitId, onAdd }: { unitId: string; onAdd: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [mode, setMode] = useState<'interactive' | 'image_answer'>('interactive');
  const [totalQuestions, setTotalQuestions] = useState('');
  const [answerKeyText, setAnswerKeyText] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const answerKey = answerKeyText.split(',').map((s) => s.trim()).filter(Boolean);
      if (answerKey.length !== Number(totalQuestions)) {
        toast.error('정답 개수와 문항 수가 일치하지 않습니다');
        setSaving(false);
        return;
      }

      const res = await fetch('/api/naesin/problems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unitId,
          title,
          mode,
          answerKey,
          category: 'problem',
          pdfUrl: pdfUrl || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || '요청에 실패했습니다');
      }
      onAdd();
      setOpen(false);
      setTitle('');
      setTotalQuestions('');
      setAnswerKeyText('');
      setPdfUrl('');
      toast.success('문제풀이 시트가 추가되었습니다');
    } catch {
      toast.error('문제풀이 시트 추가 실패');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <ClipboardList className="h-3.5 w-3.5 mr-1" />
          문제풀이 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>문제풀이 시트 추가</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label htmlFor="problem-title">제목</Label>
            <Input id="problem-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="1과 문제풀이" required />
          </div>
          <div>
            <Label htmlFor="problem-mode">풀이 방식</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as 'interactive' | 'image_answer')}>
              <SelectTrigger id="problem-mode"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="interactive">직접 입력</SelectItem>
                <SelectItem value="image_answer">OMR 이미지</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="problem-total">총 문항 수</Label>
            <Input id="problem-total" type="number" value={totalQuestions} onChange={(e) => setTotalQuestions(e.target.value)} placeholder="25" required />
          </div>
          <div>
            <Label htmlFor="problem-answers">정답 (쉼표 구분)</Label>
            <Textarea
              id="problem-answers"
              value={answerKeyText}
              onChange={(e) => setAnswerKeyText(e.target.value)}
              placeholder="3, 1, 5, 2, 4, 1, 3, ..."
              rows={3}
              required
            />
          </div>
          <div>
            <Label htmlFor="problem-pdf">PDF URL (선택)</Label>
            <Input id="problem-pdf" value={pdfUrl} onChange={(e) => setPdfUrl(e.target.value)} placeholder="https://..." />
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? '저장 중...' : '추가'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AddLastReviewDialog({ unitId, onAdd }: { unitId: string; onAdd: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [contentType, setContentType] = useState<'video' | 'pdf' | 'text'>('video');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
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
      const res = await fetch('/api/naesin/last-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unitId,
          contentType,
          title,
          youtubeUrl: contentType === 'video' ? youtubeUrl : null,
          youtubeVideoId: videoId,
          pdfUrl: contentType === 'pdf' ? pdfUrl : null,
          textContent: contentType === 'text' ? textContent : null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || '요청에 실패했습니다');
      }
      onAdd();
      setOpen(false);
      setTitle('');
      setYoutubeUrl('');
      setPdfUrl('');
      setTextContent('');
      toast.success('직전보강 자료가 추가되었습니다');
    } catch {
      toast.error('직전보강 자료 추가 실패');
    } finally {
      setSaving(false);
    }
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
        <form onSubmit={handleSubmit} className="space-y-3">
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
