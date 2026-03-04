'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  BookOpen,
  FileText,
  GraduationCap,
  ClipboardList,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import type { NaesinTextbook, NaesinUnit } from '@/types/database';

interface NaesinAdminClientProps {
  textbooks: NaesinTextbook[];
}

export function NaesinAdminClient({ textbooks: initialTextbooks }: NaesinAdminClientProps) {
  const [textbooks, setTextbooks] = useState(initialTextbooks);
  const [selectedTextbook, setSelectedTextbook] = useState<NaesinTextbook | null>(null);
  const [units, setUnits] = useState<NaesinUnit[]>([]);
  const [expandedUnit, setExpandedUnit] = useState<string | null>(null);

  // Load units when textbook selected
  useEffect(() => {
    if (!selectedTextbook) {
      setUnits([]);
      return;
    }
    loadUnits(selectedTextbook.id);
  }, [selectedTextbook?.id]);

  async function loadUnits(textbookId: string) {
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    const { data } = await supabase
      .from('naesin_units')
      .select('*')
      .eq('textbook_id', textbookId)
      .order('sort_order');
    setUnits(data || []);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">내신 콘텐츠 관리</h2>
        <AddTextbookDialog onAdd={(tb) => setTextbooks([...textbooks, tb])} />
      </div>

      {/* Textbook list */}
      {textbooks.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          등록된 교과서가 없습니다. 교과서를 추가해주세요.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {textbooks.map((tb) => (
            <Card
              key={tb.id}
              className={`cursor-pointer transition-shadow hover:shadow-md ${
                selectedTextbook?.id === tb.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedTextbook(tb)}
            >
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{tb.display_name}</p>
                    <p className="text-sm text-muted-foreground">
                      중{tb.grade} · {tb.publisher}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {!tb.is_active && (
                      <Badge variant="secondary">비활성</Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!confirm('이 교과서를 삭제하시겠습니까?')) return;
                        const res = await fetch('/api/naesin/textbooks', {
                          method: 'DELETE',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ id: tb.id }),
                        });
                        if (res.ok) {
                          setTextbooks(textbooks.filter((t) => t.id !== tb.id));
                          if (selectedTextbook?.id === tb.id) setSelectedTextbook(null);
                          toast.success('교과서가 삭제되었습니다');
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Units section */}
      {selectedTextbook && (
        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              {selectedTextbook.display_name} - 단원 목록
            </h3>
            <AddUnitDialog
              textbookId={selectedTextbook.id}
              onAdd={(unit) => setUnits([...units, unit])}
            />
          </div>

          {units.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              단원이 없습니다. 단원을 추가해주세요.
            </p>
          ) : (
            <div className="space-y-2">
              {units.map((unit) => (
                <UnitCard
                  key={unit.id}
                  unit={unit}
                  expanded={expandedUnit === unit.id}
                  onToggle={() =>
                    setExpandedUnit(expandedUnit === unit.id ? null : unit.id)
                  }
                  onDelete={() => {
                    setUnits(units.filter((u) => u.id !== unit.id));
                    toast.success('단원이 삭제되었습니다');
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// Dialog components
// ============================================

function AddTextbookDialog({ onAdd }: { onAdd: (tb: NaesinTextbook) => void }) {
  const [open, setOpen] = useState(false);
  const [grade, setGrade] = useState('1');
  const [publisher, setPublisher] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/naesin/textbooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade: Number(grade),
          publisher,
          display_name: displayName,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '알 수 없는 오류');
      onAdd(data);
      setOpen(false);
      setPublisher('');
      setDisplayName('');
      toast.success('교과서가 추가되었습니다');
    } catch (err) {
      toast.error(`교과서 추가 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" />
          교과서 추가
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>교과서 추가</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>학년</Label>
            <Select value={grade} onValueChange={setGrade}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">중1</SelectItem>
                <SelectItem value="2">중2</SelectItem>
                <SelectItem value="3">중3</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>출판사</Label>
            <Input value={publisher} onChange={(e) => setPublisher(e.target.value)} placeholder="능률, 동아 등" required />
          </div>
          <div>
            <Label>표시 이름</Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="능률 중1 영어" required />
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? '저장 중...' : '추가'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const UNIT_OPTIONS = [
  { value: '1', label: 'Lesson 1' },
  { value: '2', label: 'Lesson 2' },
  { value: '3', label: 'Lesson 3' },
  { value: '4', label: 'Lesson 4' },
  { value: '5', label: 'Lesson 5' },
  { value: '6', label: 'Lesson 6' },
  { value: '7', label: 'Lesson 7' },
  { value: '8', label: 'Lesson 8' },
  { value: '9', label: 'Special Lesson' },
];

function AddUnitDialog({ textbookId, onAdd }: { textbookId: string; onAdd: (unit: NaesinUnit) => void }) {
  const [open, setOpen] = useState(false);
  const [unitValue, setUnitValue] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!unitValue) return;
    setSaving(true);
    try {
      const selected = UNIT_OPTIONS.find((o) => o.value === unitValue);
      const res = await fetch('/api/naesin/units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          textbook_id: textbookId,
          unit_number: Number(unitValue),
          title: selected?.label || `Lesson ${unitValue}`,
          sort_order: Number(unitValue),
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      onAdd(data);
      setOpen(false);
      setUnitValue('');
      toast.success('단원이 추가되었습니다');
    } catch {
      toast.error('단원 추가 중 오류가 발생했습니다');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" />
          단원 추가
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>단원 추가</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>단원 선택</Label>
            <Select value={unitValue} onValueChange={setUnitValue}>
              <SelectTrigger><SelectValue placeholder="단원을 선택하세요" /></SelectTrigger>
              <SelectContent>
                {UNIT_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={saving || !unitValue}>
            {saving ? '저장 중...' : '추가'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// Unit card with expandable content sections
// ============================================

function UnitCard({
  unit,
  expanded,
  onToggle,
  onDelete,
}: {
  unit: NaesinUnit;
  expanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <Card>
      <CardContent className="py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={onToggle}
            className="flex items-center gap-2 text-left flex-1"
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4 shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0" />
            )}
            <span className="font-medium">
              {unit.title}
            </span>
          </button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={async () => {
              if (!confirm('이 단원을 삭제하시겠습니까?')) return;
              const res = await fetch('/api/naesin/units', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: unit.id }),
              });
              if (res.ok) onDelete();
            }}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>

        {expanded && <UnitContentManager unitId={unit.id} />}
      </CardContent>
    </Card>
  );
}

// ============================================
// Unit content manager (4 sections)
// ============================================

function UnitContentManager({ unitId }: { unitId: string }) {
  const [vocabCount, setVocabCount] = useState<number | null>(null);
  const [passageCount, setPassageCount] = useState<number | null>(null);
  const [grammarCount, setGrammarCount] = useState<number | null>(null);
  const [omrCount, setOmrCount] = useState<number | null>(null);

  useEffect(() => {
    loadCounts();
  }, [unitId]);

  async function loadCounts() {
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    const [v, p, g, o] = await Promise.all([
      supabase.from('naesin_vocabulary').select('*', { count: 'exact', head: true }).eq('unit_id', unitId),
      supabase.from('naesin_passages').select('*', { count: 'exact', head: true }).eq('unit_id', unitId),
      supabase.from('naesin_grammar_lessons').select('*', { count: 'exact', head: true }).eq('unit_id', unitId),
      supabase.from('naesin_omr_sheets').select('*', { count: 'exact', head: true }).eq('unit_id', unitId),
    ]);
    setVocabCount(v.count ?? 0);
    setPassageCount(p.count ?? 0);
    setGrammarCount(g.count ?? 0);
    setOmrCount(o.count ?? 0);
  }

  const sections = [
    { label: '단어', icon: BookOpen, count: vocabCount, color: 'text-blue-500' },
    { label: '교과서 지문', icon: FileText, count: passageCount, color: 'text-orange-500' },
    { label: '문법 설명', icon: GraduationCap, count: grammarCount, color: 'text-green-500' },
    { label: 'OMR 시트', icon: ClipboardList, count: omrCount, color: 'text-purple-500' },
  ];

  return (
    <div className="mt-4 space-y-3 border-t pt-3">
      <div className="grid gap-2 sm:grid-cols-2">
        {sections.map((s) => (
          <div key={s.label} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
            <s.icon className={`h-4 w-4 ${s.color}`} />
            <span className="text-sm">{s.label}</span>
            <Badge variant="secondary" className="ml-auto">
              {s.count === null ? '...' : s.count}개
            </Badge>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <AddVocabDialog unitId={unitId} onAdd={loadCounts} />
        <BulkVocabUpload unitId={unitId} onAdd={loadCounts} />
        <AddPassageDialog unitId={unitId} onAdd={loadCounts} />
        <AddGrammarDialog unitId={unitId} onAdd={loadCounts} />
        <AddOmrDialog unitId={unitId} onAdd={loadCounts} />
      </div>
    </div>
  );
}

// ============================================
// Content add dialogs
// ============================================

function AddVocabDialog({ unitId, onAdd }: { unitId: string; onAdd: () => void }) {
  const [open, setOpen] = useState(false);
  const [frontText, setFrontText] = useState('');
  const [backText, setBackText] = useState('');
  const [exampleSentence, setExampleSentence] = useState('');
  const [synonyms, setSynonyms] = useState('');
  const [antonyms, setAntonyms] = useState('');
  const [quizOptions, setQuizOptions] = useState('');
  const [correctIndex, setCorrectIndex] = useState('');
  const [spellingAnswer, setSpellingAnswer] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const options = quizOptions.trim() ? quizOptions.split(',').map((s) => s.trim()) : null;
      const res = await fetch('/api/naesin/vocabulary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unit_id: unitId,
          front_text: frontText,
          back_text: backText,
          example_sentence: exampleSentence || null,
          synonyms: synonyms || null,
          antonyms: antonyms || null,
          quiz_options: options,
          quiz_correct_index: correctIndex ? Number(correctIndex) : null,
          spelling_answer: spellingAnswer || null,
        }),
      });
      if (!res.ok) throw new Error();
      onAdd();
      setOpen(false);
      setFrontText('');
      setBackText('');
      setExampleSentence('');
      setSynonyms('');
      setAntonyms('');
      setQuizOptions('');
      setCorrectIndex('');
      setSpellingAnswer('');
      toast.success('단어가 추가되었습니다');
    } catch {
      toast.error('단어 추가 실패');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <BookOpen className="h-3.5 w-3.5 mr-1" />
          단어 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>단어 추가</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label>앞면 (영어)</Label>
            <Input value={frontText} onChange={(e) => setFrontText(e.target.value)} placeholder="apple" required />
          </div>
          <div>
            <Label>뒷면 (한국어)</Label>
            <Input value={backText} onChange={(e) => setBackText(e.target.value)} placeholder="사과" required />
          </div>
          <div>
            <Label>예문 (선택)</Label>
            <Input value={exampleSentence} onChange={(e) => setExampleSentence(e.target.value)} placeholder="I eat an apple every day." />
          </div>
          <div>
            <Label>유의어 (선택, /로 구분)</Label>
            <Input value={synonyms} onChange={(e) => setSynonyms(e.target.value)} placeholder="glad / joyful" />
          </div>
          <div>
            <Label>반의어 (선택, /로 구분)</Label>
            <Input value={antonyms} onChange={(e) => setAntonyms(e.target.value)} placeholder="sad / unhappy" />
          </div>
          <div>
            <Label>퀴즈 선택지 (쉼표 구분)</Label>
            <Input value={quizOptions} onChange={(e) => setQuizOptions(e.target.value)} placeholder="사과, 바나나, 포도, 딸기" />
          </div>
          <div>
            <Label>정답 인덱스 (0부터)</Label>
            <Input type="number" value={correctIndex} onChange={(e) => setCorrectIndex(e.target.value)} placeholder="0" />
          </div>
          <div>
            <Label>스펠링 정답</Label>
            <Input value={spellingAnswer} onChange={(e) => setSpellingAnswer(e.target.value)} placeholder="apple" />
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? '저장 중...' : '추가'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function BulkVocabUpload({ unitId, onAdd }: { unitId: string; onAdd: () => void }) {
  const [open, setOpen] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      // Parse: front_text, back_text, example_sentence, synonyms, antonyms
      const lines = csvText.trim().split('\n').filter((l) => l.trim());
      const items = lines.map((line) => {
        const parts = line.split(',').map((s) => s.trim());
        return {
          front_text: parts[0] || '',
          back_text: parts[1] || '',
          example_sentence: parts[2] || null,
          synonyms: parts[3] || null,
          antonyms: parts[4] || null,
          spelling_answer: parts[0] || null,
        };
      });

      const res = await fetch('/api/naesin/vocabulary/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unit_id: unitId, items }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      onAdd();
      setOpen(false);
      setCsvText('');
      toast.success(`${data.count}개 단어가 추가되었습니다`);
    } catch {
      toast.error('일괄 업로드 실패');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Upload className="h-3.5 w-3.5 mr-1" />
          단어 일괄 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>단어 일괄 추가</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label>한 줄에 하나씩: 영어, 한국어, 예문, 유의어, 반의어</Label>
            <Textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder={`apple, 사과, I eat an apple., fruit, vegetable\nhappy, 행복한, I am happy., glad/joyful, sad/unhappy\ngrape, 포도`}
              rows={8}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? '업로드 중...' : '일괄 추가'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddPassageDialog({ unitId, onAdd }: { unitId: string; onAdd: () => void }) {
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
            <Label>제목</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="본문 1" required />
          </div>
          <div>
            <Label>영어 원문</Label>
            <Textarea value={originalText} onChange={(e) => setOriginalText(e.target.value)} rows={4} required />
          </div>
          <div>
            <Label>한국어 번역</Label>
            <Textarea value={koreanTranslation} onChange={(e) => setKoreanTranslation(e.target.value)} rows={4} required />
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

function AddGrammarDialog({ unitId, onAdd }: { unitId: string; onAdd: () => void }) {
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
            <Label>제목</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div>
            <Label>콘텐츠 유형</Label>
            <Select value={contentType} onValueChange={(v) => setContentType(v as 'video' | 'text')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="video">영상</SelectItem>
                <SelectItem value="text">텍스트</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {contentType === 'video' ? (
            <div>
              <Label>YouTube URL</Label>
              <Input value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." required />
            </div>
          ) : (
            <div>
              <Label>텍스트 내용</Label>
              <Textarea value={textContent} onChange={(e) => setTextContent(e.target.value)} rows={6} required />
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

function AddOmrDialog({ unitId, onAdd }: { unitId: string; onAdd: () => void }) {
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
            <Label>제목</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="1차 내신 대비" required />
          </div>
          <div>
            <Label>총 문항 수</Label>
            <Input type="number" value={totalQuestions} onChange={(e) => setTotalQuestions(e.target.value)} placeholder="25" required />
          </div>
          <div>
            <Label>정답 (쉼표 구분, 1~5)</Label>
            <Textarea
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
