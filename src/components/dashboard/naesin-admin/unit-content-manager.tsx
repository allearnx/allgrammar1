'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  BookOpen,
  FileText,
  GraduationCap,
  ClipboardList,
  Trash2,
  ChevronDown,
  ChevronRight,
  Pencil,
} from 'lucide-react';
import { toast } from 'sonner';
import type { NaesinVocabulary } from '@/types/database';
import { AddVocabDialog, BulkVocabUpload, PdfVocabExtract } from './vocab-dialogs';
import { AddPassageDialog, AddGrammarDialog, AddOmrDialog } from './content-dialogs';
import { CreateQuizSetFromSelection, VocabQuizSetManager } from './quiz-set-manager';

export function UnitContentManager({ unitId }: { unitId: string }) {
  const [vocabList, setVocabList] = useState<NaesinVocabulary[]>([]);
  const [showVocabList, setShowVocabList] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ front_text: '', back_text: '', part_of_speech: '', example_sentence: '', synonyms: '', antonyms: '' });
  const [passageCount, setPassageCount] = useState<number | null>(null);
  const [grammarCount, setGrammarCount] = useState<number | null>(null);
  const [omrCount, setOmrCount] = useState<number | null>(null);

  useEffect(() => {
    loadCounts();
  }, [unitId]);

  async function loadCounts() {
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const [v, p, g, o] = await Promise.all([
        supabase.from('naesin_vocabulary').select('*').eq('unit_id', unitId).order('sort_order'),
        supabase.from('naesin_passages').select('*', { count: 'exact', head: true }).eq('unit_id', unitId),
        supabase.from('naesin_grammar_lessons').select('*', { count: 'exact', head: true }).eq('unit_id', unitId),
        supabase.from('naesin_omr_sheets').select('*', { count: 'exact', head: true }).eq('unit_id', unitId),
      ]);
      setVocabList((v.data as NaesinVocabulary[]) || []);
      setPassageCount(p.count ?? 0);
      setGrammarCount(g.count ?? 0);
      setOmrCount(o.count ?? 0);
      setSelectedIds(new Set());
    } catch {
      toast.error('데이터를 불러오지 못했습니다');
    }
  }

  async function handleDeleteOne(id: string) {
    if (!confirm('이 단어를 삭제하시겠습니까?')) return;
    try {
      const res = await fetch('/api/naesin/vocabulary', {
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
    } catch {
      toast.error('단어 삭제 중 오류가 발생했습니다');
    }
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return;
    if (!confirm(`선택한 ${selectedIds.size}개 단어를 삭제하시겠습니까?`)) return;
    setDeleting(true);
    try {
      const results = await Promise.all(
        Array.from(selectedIds).map((id) =>
          fetch('/api/naesin/vocabulary', {
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
    } catch {
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
    if (selectedIds.size === vocabList.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(vocabList.map((v) => v.id)));
    }
  }

  function startEdit(v: NaesinVocabulary) {
    setEditingId(v.id);
    setEditForm({
      front_text: v.front_text,
      back_text: v.back_text,
      part_of_speech: v.part_of_speech || '',
      example_sentence: v.example_sentence || '',
      synonyms: v.synonyms || '',
      antonyms: v.antonyms || '',
    });
  }

  async function saveEdit() {
    if (!editingId) return;
    try {
      const res = await fetch('/api/naesin/vocabulary', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingId, ...editForm }),
      });
      if (res.ok) {
        const updated = await res.json();
        setVocabList((prev) => prev.map((v) => (v.id === editingId ? updated : v)));
        setEditingId(null);
        toast.success('단어가 수정되었습니다');
      } else {
        toast.error('수정 실패');
      }
    } catch {
      toast.error('단어 수정 중 오류가 발생했습니다');
    }
  }

  const sections = [
    { label: '단어', icon: BookOpen, count: vocabList.length, color: 'text-blue-500', toggle: () => setShowVocabList(!showVocabList) },
    { label: '교과서 지문', icon: FileText, count: passageCount, color: 'text-orange-500' },
    { label: '문법 설명', icon: GraduationCap, count: grammarCount, color: 'text-green-500' },
    { label: 'OMR 시트', icon: ClipboardList, count: omrCount, color: 'text-purple-500' },
  ];

  return (
    <div className="mt-4 space-y-3 border-t pt-3">
      <div className="grid gap-2 sm:grid-cols-2">
        {sections.map((s) => (
          <div
            key={s.label}
            className={`flex items-center gap-2 p-2 rounded-lg bg-muted/50 ${s.toggle ? 'cursor-pointer hover:bg-muted' : ''}`}
            onClick={s.toggle}
          >
            <s.icon className={`h-4 w-4 ${s.color}`} />
            <span className="text-sm">{s.label}</span>
            <Badge variant="secondary" className="ml-auto">
              {s.count === null ? '...' : s.count}개
            </Badge>
            {s.toggle && (showVocabList ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />)}
          </div>
        ))}
      </div>

      {/* 단어 목록 */}
      {showVocabList && vocabList.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={selectedIds.size === vocabList.length}
                onCheckedChange={toggleSelectAll}
              />
              전체 선택
            </label>
            {selectedIds.size > 0 && (
              <Button
                size="sm"
                variant="destructive"
                onClick={handleBulkDelete}
                disabled={deleting}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                {deleting ? '삭제 중...' : `${selectedIds.size}개 삭제`}
              </Button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto space-y-1 rounded-lg border p-2">
            {vocabList.map((v) => (
              <div key={v.id} className="rounded hover:bg-muted/50">
                <div className="flex items-center gap-2 py-1.5 px-2 group">
                  <Checkbox
                    checked={selectedIds.has(v.id)}
                    onCheckedChange={() => toggleSelect(v.id)}
                  />
                  <span className="text-sm font-medium flex-1 truncate">{v.front_text}</span>
                  <span className="text-sm text-muted-foreground truncate max-w-[120px]">{v.back_text}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100"
                    onClick={() => editingId === v.id ? setEditingId(null) : startEdit(v)}
                    aria-label="수정"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100"
                    onClick={() => handleDeleteOne(v.id)}
                    aria-label="삭제"
                  >
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

      {/* 시험지 관리 */}
      {showVocabList && vocabList.length > 0 && selectedIds.size > 0 && (
        <div className="border rounded-lg p-3 bg-blue-50/50">
          <CreateQuizSetFromSelection
            unitId={unitId}
            vocabList={vocabList}
            selectedIds={selectedIds}
            onCreated={() => { setSelectedIds(new Set()); toast.success('시험지가 생성되었습니다'); }}
          />
        </div>
      )}

      <VocabQuizSetManager unitId={unitId} />

      <div className="flex flex-wrap gap-2">
        <AddVocabDialog unitId={unitId} onAdd={loadCounts} />
        <BulkVocabUpload unitId={unitId} onAdd={loadCounts} />
        <PdfVocabExtract unitId={unitId} onAdd={loadCounts} />
        <AddPassageDialog unitId={unitId} onAdd={loadCounts} />
        <AddGrammarDialog unitId={unitId} onAdd={loadCounts} />
        <AddOmrDialog unitId={unitId} onAdd={loadCounts} />
      </div>
    </div>
  );
}
