'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { BookOpen, Plus, Trash2, Pencil, Upload, FileText, Loader2, Check, X as XIcon } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import type { VocaVocabulary } from '@/types/voca';

export function DayContentManager({ dayId }: { dayId: string }) {
  const [vocabList, setVocabList] = useState<VocaVocabulary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    front_text: '', back_text: '', part_of_speech: '', example_sentence: '',
    synonyms: '', antonyms: '', spelling_hint: '', spelling_answer: '', idioms: '',
  });
  const [deleteVocabId, setDeleteVocabId] = useState<string | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  useEffect(() => { loadVocab(); }, [dayId]);

  async function loadVocab() {
    setLoading(true);
    try {
      const res = await fetch(`/api/voca/vocabulary?dayId=${dayId}`);
      const data = await res.json();
      setVocabList(data || []);
      setSelectedIds(new Set());
    } catch (err) {
      console.error(err);
      toast.error('단어 목록을 불러오지 못했습니다');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteOne(id: string) {
    try {
      const res = await fetch('/api/voca/vocabulary', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setVocabList((prev) => prev.filter((v) => v.id !== id));
        setSelectedIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
        toast.success('단어가 삭제되었습니다');
      } else {
        toast.error('삭제 실패');
      }
    } catch (err) {
      console.error(err);
      toast.error('단어 삭제 중 오류가 발생했습니다');
    }
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return;
    setDeleting(true);
    try {
      const results = await Promise.all(
        Array.from(selectedIds).map((id) =>
          fetch('/api/voca/vocabulary', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
          })
        )
      );
      const successCount = results.filter((r) => r.ok).length;
      setVocabList((prev) => prev.filter((v) => !selectedIds.has(v.id)));
      setSelectedIds(new Set());
      toast.success(`${successCount}개 단어가 삭제되었습니다`);
    } catch (err) {
      console.error(err);
      toast.error('일괄 삭제 중 오류가 발생했습니다');
    } finally {
      setDeleting(false);
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === vocabList.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(vocabList.map((v) => v.id)));
  }

  function startEdit(v: VocaVocabulary) {
    setEditingId(v.id);
    setEditForm({
      front_text: v.front_text,
      back_text: v.back_text,
      part_of_speech: v.part_of_speech || '',
      example_sentence: v.example_sentence || '',
      synonyms: v.synonyms || '',
      antonyms: v.antonyms || '',
      spelling_hint: v.spelling_hint || '',
      spelling_answer: v.spelling_answer || '',
      idioms: v.idioms ? JSON.stringify(v.idioms, null, 2) : '',
    });
  }

  async function saveEdit() {
    if (!editingId) return;
    try {
      let parsedIdioms = null;
      if (editForm.idioms.trim()) {
        try {
          parsedIdioms = JSON.parse(editForm.idioms);
        } catch {
          toast.error('숙어 JSON 형식이 올바르지 않습니다');
          return;
        }
      }
      const { idioms: _, ...rest } = editForm;
      const res = await fetch('/api/voca/vocabulary', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingId, ...rest, idioms: parsedIdioms }),
      });
      if (res.ok) {
        const updated = await res.json();
        setVocabList((prev) => prev.map((v) => (v.id === editingId ? updated : v)));
        setEditingId(null);
        toast.success('단어가 수정되었습니다');
      } else {
        toast.error('수정 실패');
      }
    } catch (err) {
      console.error(err);
      toast.error('단어 수정 중 오류가 발생했습니다');
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground mt-3">로딩 중...</p>;

  return (
    <div className="mt-4 space-y-3 border-t pt-3">
      <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
        <BookOpen className="h-4 w-4 text-blue-500" />
        <span className="text-sm">단어</span>
        <Badge variant="secondary" className="ml-auto">{vocabList.length}개</Badge>
      </div>

      {vocabList.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox checked={selectedIds.size === vocabList.length && vocabList.length > 0} onCheckedChange={toggleSelectAll} />
              전체 선택
            </label>
            {selectedIds.size > 0 && (
              <Button size="sm" variant="destructive" onClick={() => setBulkDeleteOpen(true)} disabled={deleting}>
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                {deleting ? '삭제 중...' : `${selectedIds.size}개 삭제`}
              </Button>
            )}
          </div>
          <div className="max-h-[70vh] overflow-y-auto space-y-1 rounded-lg border p-2">
            {vocabList.map((v) => (
              <div key={v.id} className="rounded hover:bg-muted/50">
                <div className="flex items-center gap-2 py-1.5 px-2 group">
                  <Checkbox checked={selectedIds.has(v.id)} onCheckedChange={() => toggleSelect(v.id)} />
                  <span className="text-sm font-medium flex-1 truncate">{v.front_text}</span>
                  <span className="text-sm text-muted-foreground truncate max-w-[120px]">{v.back_text}</span>
                  {v.synonyms && <Badge variant="outline" className="text-[10px] h-4 px-1">유</Badge>}
                  {v.antonyms && <Badge variant="outline" className="text-[10px] h-4 px-1">반</Badge>}
                  {v.idioms && v.idioms.length > 0 && <Badge variant="outline" className="text-[10px] h-4 px-1 border-blue-300 text-blue-600">숙</Badge>}
                  <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => editingId === v.id ? setEditingId(null) : startEdit(v)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => setDeleteVocabId(v.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
                {editingId === v.id && (
                  <div className="px-2 pb-2 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Input className="h-7 text-sm" value={editForm.front_text} onChange={(e) => setEditForm({ ...editForm, front_text: e.target.value })} placeholder="영어" />
                      <Input className="h-7 text-sm" value={editForm.back_text} onChange={(e) => setEditForm({ ...editForm, back_text: e.target.value })} placeholder="한국어" />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <Input className="h-7 text-sm" value={editForm.part_of_speech} onChange={(e) => setEditForm({ ...editForm, part_of_speech: e.target.value })} placeholder="품사" />
                      <Input className="h-7 text-sm col-span-2" value={editForm.example_sentence} onChange={(e) => setEditForm({ ...editForm, example_sentence: e.target.value })} placeholder="예문" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input className="h-7 text-sm" value={editForm.synonyms} onChange={(e) => setEditForm({ ...editForm, synonyms: e.target.value })} placeholder="유의어" />
                      <Input className="h-7 text-sm" value={editForm.antonyms} onChange={(e) => setEditForm({ ...editForm, antonyms: e.target.value })} placeholder="반의어" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input className="h-7 text-sm" value={editForm.spelling_hint} onChange={(e) => setEditForm({ ...editForm, spelling_hint: e.target.value })} placeholder="스펠링 힌트" />
                      <Input className="h-7 text-sm" value={editForm.spelling_answer} onChange={(e) => setEditForm({ ...editForm, spelling_answer: e.target.value })} placeholder="스펠링 정답" />
                    </div>
                    <div>
                      <Textarea className="text-xs font-mono" rows={3} value={editForm.idioms} onChange={(e) => setEditForm({ ...editForm, idioms: e.target.value })} placeholder='숙어 JSON: [{"en":"...", "ko":"...", "example_en":"...", "example_ko":"..."}]' />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="outline" className="h-7" onClick={() => setEditingId(null)}>취소</Button>
                      <Button size="sm" className="h-7" onClick={saveEdit}>저장</Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <AddVocabDialog dayId={dayId} onAdd={loadVocab} />
        <BulkVocabUpload dayId={dayId} onAdd={loadVocab} />
        <PdfVocabExtract dayId={dayId} onAdd={loadVocab} />
      </div>

      <ConfirmDialog
        open={deleteVocabId !== null}
        onOpenChange={(open) => { if (!open) setDeleteVocabId(null); }}
        description="이 단어를 삭제하시겠습니까?"
        onConfirm={() => { const id = deleteVocabId; setDeleteVocabId(null); if (id) handleDeleteOne(id); }}
      />
      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        description={`선택한 ${selectedIds.size}개 단어를 삭제하시겠습니까?`}
        onConfirm={() => { setBulkDeleteOpen(false); handleBulkDelete(); }}
      />
    </div>
  );
}

function AddVocabDialog({ dayId, onAdd }: { dayId: string; onAdd: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    front_text: '', back_text: '', part_of_speech: '', example_sentence: '',
    synonyms: '', antonyms: '', spelling_hint: '', spelling_answer: '',
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.front_text.trim() || !form.back_text.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/voca/vocabulary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          day_id: dayId,
          front_text: form.front_text.trim(),
          back_text: form.back_text.trim(),
          part_of_speech: form.part_of_speech.trim() || null,
          example_sentence: form.example_sentence.trim() || null,
          synonyms: form.synonyms.trim() || null,
          antonyms: form.antonyms.trim() || null,
          spelling_hint: form.spelling_hint.trim() || null,
          spelling_answer: form.spelling_answer.trim() || null,
        }),
      });
      if (!res.ok) throw new Error();
      onAdd();
      setOpen(false);
      setForm({ front_text: '', back_text: '', part_of_speech: '', example_sentence: '', synonyms: '', antonyms: '', spelling_hint: '', spelling_answer: '' });
      toast.success('단어가 추가되었습니다');
    } catch (err) {
      console.error(err);
      toast.error('단어 추가 중 오류가 발생했습니다');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" />단어 추가</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>단어 추가</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>영어 *</Label><Input value={form.front_text} onChange={(e) => setForm({ ...form, front_text: e.target.value })} /></div>
            <div><Label>한국어 *</Label><Input value={form.back_text} onChange={(e) => setForm({ ...form, back_text: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>품사</Label><Input value={form.part_of_speech} onChange={(e) => setForm({ ...form, part_of_speech: e.target.value })} /></div>
            <div className="col-span-2"><Label>예문</Label><Input value={form.example_sentence} onChange={(e) => setForm({ ...form, example_sentence: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>유의어</Label><Input value={form.synonyms} onChange={(e) => setForm({ ...form, synonyms: e.target.value })} /></div>
            <div><Label>반의어</Label><Input value={form.antonyms} onChange={(e) => setForm({ ...form, antonyms: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>스펠링 힌트</Label><Input value={form.spelling_hint} onChange={(e) => setForm({ ...form, spelling_hint: e.target.value })} /></div>
            <div><Label>스펠링 정답</Label><Input value={form.spelling_answer} onChange={(e) => setForm({ ...form, spelling_answer: e.target.value })} /></div>
          </div>
          <Button type="submit" className="w-full" disabled={saving || !form.front_text.trim() || !form.back_text.trim()}>
            {saving ? '저장 중...' : '추가'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function BulkVocabUpload({ dayId, onAdd }: { dayId: string; onAdd: () => void }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const lines = text.trim().split('\n').filter((l) => l.trim());
    if (lines.length === 0) return;

    const items = lines.map((line) => {
      const parts = line.split('\t').length > 1 ? line.split('\t') : line.split(',');
      return {
        front_text: (parts[0] || '').trim(),
        back_text: (parts[1] || '').trim(),
        part_of_speech: (parts[2] || '').trim() || null,
        example_sentence: (parts[3] || '').trim() || null,
        synonyms: (parts[4] || '').trim() || null,
        antonyms: (parts[5] || '').trim() || null,
        spelling_hint: (parts[6] || '').trim() || null,
        spelling_answer: (parts[7] || '').trim() || null,
      };
    }).filter((i) => i.front_text && i.back_text);

    if (items.length === 0) { toast.error('유효한 단어가 없습니다'); return; }

    setSaving(true);
    try {
      const res = await fetch('/api/voca/vocabulary/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day_id: dayId, items }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      onAdd();
      setOpen(false);
      setText('');
      toast.success(`${data.count}개 단어가 추가되었습니다`);
    } catch (err) {
      console.error(err);
      toast.error('대량 업로드 중 오류가 발생했습니다');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline"><Upload className="h-4 w-4 mr-1" />대량 업로드</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>단어 대량 업로드</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label>탭/쉼표 구분 (영어, 한국어, 품사, 예문, 유의어, 반의어, 힌트, 정답)</Label>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={8}
              placeholder={`big\t큰\tadj.\tThe house is big.\tlarge\tsmall\n`}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            줄바꿈으로 구분. 최소 영어, 한국어 2열 필수.
          </p>
          <Button type="submit" className="w-full" disabled={saving || !text.trim()}>
            {saving ? '업로드 중...' : '업로드'}
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
  idioms: { en: string; ko: string; example_en?: string; example_ko?: string }[] | null;
  selected: boolean;
}

function PdfVocabExtract({ dayId, onAdd }: { dayId: string; onAdd: () => void }) {
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

      const res = await fetch('/api/voca/vocabulary/extract-pdf', {
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

      const res = await fetch('/api/voca/vocabulary/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day_id: dayId, items }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || '요청에 실패했습니다');
      }
      const data = await res.json();
      onAdd();
      setOpen(false);
      reset();
      toast.success(`${data.count}개 단어가 추가되었습니다`);
    } catch (err) {
      console.error(err);
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
              PDF를 업로드하면 AI가 핵심 단어를 자동으로 추출합니다.
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
              <Button size="sm" variant="outline" onClick={() => reset()}>
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
                          <XIcon className="h-3.5 w-3.5 text-destructive" />
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
