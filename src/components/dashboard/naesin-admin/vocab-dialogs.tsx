'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { BookOpen, Upload, FileText, Loader2, Check, X } from 'lucide-react';
import { toast } from 'sonner';

export function AddVocabDialog({ unitId, onAdd }: { unitId: string; onAdd: () => void }) {
  const [open, setOpen] = useState(false);
  const [frontText, setFrontText] = useState('');
  const [backText, setBackText] = useState('');
  const [partOfSpeech, setPartOfSpeech] = useState('');
  const [exampleSentence, setExampleSentence] = useState('');
  const [synonyms, setSynonyms] = useState('');
  const [antonyms, setAntonyms] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/naesin/vocabulary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unit_id: unitId,
          front_text: frontText,
          back_text: backText,
          part_of_speech: partOfSpeech || null,
          example_sentence: exampleSentence || null,
          synonyms: synonyms || null,
          antonyms: antonyms || null,
        }),
      });
      if (!res.ok) throw new Error();
      onAdd();
      setOpen(false);
      setFrontText('');
      setBackText('');
      setPartOfSpeech('');
      setExampleSentence('');
      setSynonyms('');
      setAntonyms('');
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
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>단어 추가</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label htmlFor="vocab-front">앞면 (영어)</Label>
            <Input id="vocab-front" value={frontText} onChange={(e) => setFrontText(e.target.value)} placeholder="apple" required />
          </div>
          <div>
            <Label htmlFor="vocab-back">뒷면 (한국어)</Label>
            <Input id="vocab-back" value={backText} onChange={(e) => setBackText(e.target.value)} placeholder="사과" required />
          </div>
          <div>
            <Label htmlFor="vocab-pos">품사 (선택)</Label>
            <Input id="vocab-pos" value={partOfSpeech} onChange={(e) => setPartOfSpeech(e.target.value)} placeholder="n. / v. / adj. / adv." />
          </div>
          <div>
            <Label htmlFor="vocab-example">예문 (선택)</Label>
            <Input id="vocab-example" value={exampleSentence} onChange={(e) => setExampleSentence(e.target.value)} placeholder="I eat an apple every day." />
          </div>
          <div>
            <Label htmlFor="vocab-synonyms">유의어 (선택, /로 구분)</Label>
            <Input id="vocab-synonyms" value={synonyms} onChange={(e) => setSynonyms(e.target.value)} placeholder="glad / joyful" />
          </div>
          <div>
            <Label htmlFor="vocab-antonyms">반의어 (선택, /로 구분)</Label>
            <Input id="vocab-antonyms" value={antonyms} onChange={(e) => setAntonyms(e.target.value)} placeholder="sad / unhappy" />
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? '저장 중...' : '추가'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function BulkVocabUpload({ unitId, onAdd }: { unitId: string; onAdd: () => void }) {
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
          part_of_speech: parts[2] || null,
          example_sentence: parts[3] || null,
          synonyms: parts[4] || null,
          antonyms: parts[5] || null,
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
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>단어 일괄 추가</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label htmlFor="vocab-bulk-csv">한 줄에 하나씩: 영어, 한국어, 품사, 예문, 유의어, 반의어</Label>
            <Textarea
              id="vocab-bulk-csv"
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder={`apple, 사과, n., I eat an apple., fruit\nhappy, 행복한, adj., I am happy., glad, sad\ngrape, 포도`}
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

interface ExtractedWord {
  front_text: string;
  back_text: string;
  part_of_speech: string | null;
  example_sentence: string | null;
  synonyms: string | null;
  antonyms: string | null;
  selected: boolean;
}

export function PdfVocabExtract({ unitId, onAdd }: { unitId: string; onAdd: () => void }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [file, setFile] = useState<File | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [words, setWords] = useState<ExtractedWord[]>([]);

  function reset() {
    setStep(1);
    setFile(null);
    setExtracting(false);
    setSaving(false);
    setWords([]);
  }

  async function handleExtract() {
    if (!file) return;
    setExtracting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/naesin/vocabulary/extract-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '추출 실패');
      }

      const data = await res.json();
      setWords(
        data.items.map((item: Omit<ExtractedWord, 'selected'>) => ({
          ...item,
          selected: true,
        }))
      );
      setStep(2);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'PDF 단어 추출 실패');
    } finally {
      setExtracting(false);
    }
  }

  async function handleSave() {
    const selectedWords = words.filter((w) => w.selected);
    if (selectedWords.length === 0) {
      toast.error('저장할 단어를 선택해주세요.');
      return;
    }
    setSaving(true);
    try {
      const items = selectedWords.map(({ selected: _, ...rest }) => ({
        ...rest,
        spelling_answer: rest.front_text,
      }));

      const res = await fetch('/api/naesin/vocabulary/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unit_id: unitId, items }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      onAdd();
      setOpen(false);
      reset();
      toast.success(`${data.count}개 단어가 추가되었습니다`);
    } catch {
      toast.error('단어 저장 실패');
    } finally {
      setSaving(false);
    }
  }

  function updateWord(index: number, field: keyof ExtractedWord, value: string) {
    setWords((prev) =>
      prev.map((w, i) => (i === index ? { ...w, [field]: value || null } : w))
    );
  }

  function toggleWord(index: number) {
    setWords((prev) =>
      prev.map((w, i) => (i === index ? { ...w, selected: !w.selected } : w))
    );
  }

  function toggleAll() {
    const allSelected = words.every((w) => w.selected);
    setWords((prev) => prev.map((w) => ({ ...w, selected: !allSelected })));
  }

  const selectedCount = words.filter((w) => w.selected).length;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <FileText className="h-3.5 w-3.5 mr-1" />
          PDF 단어 추출
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 1 ? 'PDF 단어 추출' : `추출 결과 (${selectedCount}/${words.length}개 선택)`}
          </DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label>PDF 파일 선택</Label>
              <Input
                type="file"
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              교과서 PDF를 업로드하면 AI가 핵심 단어를 자동으로 추출합니다.
            </p>
            <Button
              className="w-full"
              onClick={handleExtract}
              disabled={!file || extracting}
            >
              {extracting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  추출 중... (30초~1분 소요)
                </>
              ) : (
                '단어 추출'
              )}
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={words.length > 0 && words.every((w) => w.selected)}
                  onCheckedChange={toggleAll}
                />
                전체 선택
              </label>
              <Button size="sm" variant="outline" onClick={() => { reset(); }}>
                다시 추출
              </Button>
            </div>

            <div className="max-h-96 overflow-y-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="p-2 w-8" scope="col" aria-label="선택"></th>
                    <th className="p-2 text-left" scope="col">단어</th>
                    <th className="p-2 text-left" scope="col">뜻</th>
                    <th className="p-2 text-left hidden sm:table-cell" scope="col">품사</th>
                    <th className="p-2 text-left hidden md:table-cell" scope="col">예문</th>
                    <th className="p-2 w-8" scope="col" aria-label="삭제"></th>
                  </tr>
                </thead>
                <tbody>
                  {words.map((w, i) => (
                    <tr
                      key={i}
                      className={`border-t hover:bg-muted/30 ${!w.selected ? 'opacity-40' : ''}`}
                    >
                      <td className="p-2">
                        <Checkbox
                          checked={w.selected}
                          onCheckedChange={() => toggleWord(i)}
                        />
                      </td>
                      <td className="p-1">
                        <Input className="h-7 text-sm font-medium" value={w.front_text} onChange={(e) => updateWord(i, 'front_text', e.target.value)} />
                      </td>
                      <td className="p-1">
                        <Input className="h-7 text-sm" value={w.back_text} onChange={(e) => updateWord(i, 'back_text', e.target.value)} />
                      </td>
                      <td className="p-1 hidden sm:table-cell">
                        <Input className="h-7 text-sm w-16" value={w.part_of_speech || ''} onChange={(e) => updateWord(i, 'part_of_speech', e.target.value)} />
                      </td>
                      <td className="p-1 hidden md:table-cell">
                        <Input className="h-7 text-sm" value={w.example_sentence || ''} onChange={(e) => updateWord(i, 'example_sentence', e.target.value)} placeholder="예문 입력" />
                      </td>
                      <td className="p-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() =>
                            setWords((prev) => prev.filter((_, idx) => idx !== i))
                          }
                          aria-label="삭제"
                        >
                          <X className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Button
              className="w-full"
              onClick={handleSave}
              disabled={saving || selectedCount === 0}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  저장 중...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  {selectedCount}개 단어 저장
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
