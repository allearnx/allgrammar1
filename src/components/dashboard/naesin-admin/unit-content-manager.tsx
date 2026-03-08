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
  Brain,
} from 'lucide-react';
import { toast } from 'sonner';
import type { NaesinVocabulary, NaesinGrammarLesson } from '@/types/database';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { AddVocabDialog, BulkVocabUpload, PdfVocabExtract } from './vocab-dialogs';
import { AddPassageDialog, AddGrammarDialog, AddOmrDialog, AddProblemDialog, AddLastReviewDialog } from './content-dialogs';
import { CreateQuizSetFromSelection, VocabQuizSetManager } from './quiz-set-manager';
import { ChatQuestionManager } from './chat-question-manager';

export function UnitContentManager({ unitId }: { unitId: string }) {
  const [vocabList, setVocabList] = useState<NaesinVocabulary[]>([]);
  const [showVocabList, setShowVocabList] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ front_text: '', back_text: '', part_of_speech: '', example_sentence: '', synonyms: '', antonyms: '' });
  const [deleteVocabId, setDeleteVocabId] = useState<string | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [passageList, setPassageList] = useState<{ id: string; title: string }[]>([]);
  const [showPassageList, setShowPassageList] = useState(false);
  const [deletePassageId, setDeletePassageId] = useState<string | null>(null);
  const [grammarCount, setGrammarCount] = useState<number | null>(null);
  const [omrCount, setOmrCount] = useState<number | null>(null);
  const [problemCount, setProblemCount] = useState<number | null>(null);
  const [lastReviewCount, setLastReviewCount] = useState<number | null>(null);
  // Grammar lesson management
  const [grammarList, setGrammarList] = useState<NaesinGrammarLesson[]>([]);
  const [showGrammarList, setShowGrammarList] = useState(false);
  const [deleteGrammarId, setDeleteGrammarId] = useState<string | null>(null);
  const [editingGrammarId, setEditingGrammarId] = useState<string | null>(null);
  const [grammarEditForm, setGrammarEditForm] = useState({ title: '', youtube_url: '', text_content: '' });

  useEffect(() => {
    loadCounts();
  }, [unitId]);

  async function loadCounts() {
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const [v, p, g, o, prob, lr] = await Promise.all([
        supabase.from('naesin_vocabulary').select('*').eq('unit_id', unitId).order('sort_order'),
        supabase.from('naesin_passages').select('id, title').eq('unit_id', unitId).order('created_at'),
        supabase.from('naesin_grammar_lessons').select('*').eq('unit_id', unitId).order('sort_order'),
        supabase.from('naesin_omr_sheets').select('*', { count: 'exact', head: true }).eq('unit_id', unitId),
        supabase.from('naesin_problem_sheets').select('*', { count: 'exact', head: true }).eq('unit_id', unitId).eq('category', 'problem'),
        supabase.from('naesin_last_review_content').select('*', { count: 'exact', head: true }).eq('unit_id', unitId),
      ]);
      setVocabList((v.data as NaesinVocabulary[]) || []);
      setPassageList((p.data as { id: string; title: string }[]) || []);
      setGrammarList((g.data as NaesinGrammarLesson[]) || []);
      setGrammarCount(g.data?.length ?? 0);
      setOmrCount(o.count ?? 0);
      setProblemCount(prob.count ?? 0);
      setLastReviewCount(lr.count ?? 0);
      setSelectedIds(new Set());
    } catch {
      toast.error('데이터를 불러오지 못했습니다');
    }
  }

  async function handleDeleteOne(id: string) {
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

  function startGrammarEdit(lesson: NaesinGrammarLesson) {
    setEditingGrammarId(lesson.id);
    setGrammarEditForm({
      title: lesson.title,
      youtube_url: lesson.youtube_url || '',
      text_content: lesson.text_content || '',
    });
  }

  async function saveGrammarEdit() {
    if (!editingGrammarId) return;
    const lesson = grammarList.find((l) => l.id === editingGrammarId);
    if (!lesson) return;
    try {
      const updates: Record<string, unknown> = { id: editingGrammarId, title: grammarEditForm.title };
      if (lesson.content_type === 'video') {
        updates.youtube_url = grammarEditForm.youtube_url || null;
        const match = grammarEditForm.youtube_url.match(/(?:youtu\.be\/|v=)([^&\s]+)/);
        updates.youtube_video_id = match ? match[1] : null;
      } else {
        updates.text_content = grammarEditForm.text_content || null;
      }
      const res = await fetch('/api/naesin/grammar-lessons', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const updated = await res.json();
        setGrammarList((prev) => prev.map((l) => (l.id === editingGrammarId ? updated : l)));
        setEditingGrammarId(null);
        toast.success('문법 설명이 수정되었습니다');
      } else {
        toast.error('수정 실패');
      }
    } catch {
      toast.error('문법 설명 수정 중 오류가 발생했습니다');
    }
  }

  async function handleDeletePassage(id: string) {
    try {
      const res = await fetch('/api/naesin/passages', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setPassageList((prev) => prev.filter((p) => p.id !== id));
        toast.success('지문이 삭제되었습니다');
      } else {
        toast.error('삭제 실패');
      }
    } catch {
      toast.error('지문 삭제 중 오류가 발생했습니다');
    }
  }

  async function handleDeleteGrammar(id: string) {
    try {
      const res = await fetch('/api/naesin/grammar-lessons', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setGrammarList((prev) => prev.filter((l) => l.id !== id));
        setGrammarCount((prev) => (prev ?? 1) - 1);
        toast.success('문법 설명이 삭제되었습니다');
      } else {
        toast.error('삭제 실패');
      }
    } catch {
      toast.error('문법 설명 삭제 중 오류가 발생했습니다');
    }
  }

  const sections = [
    { label: '단어', icon: BookOpen, count: vocabList.length, color: 'text-blue-500', toggle: () => setShowVocabList(!showVocabList), expanded: showVocabList },
    { label: '교과서 지문', icon: FileText, count: passageList.length, color: 'text-orange-500', toggle: () => setShowPassageList(!showPassageList), expanded: showPassageList },
    { label: '문법 설명', icon: GraduationCap, count: grammarCount, color: 'text-green-500', toggle: () => setShowGrammarList(!showGrammarList), expanded: showGrammarList },
    { label: 'OMR 시트', icon: ClipboardList, count: omrCount, color: 'text-purple-500' },
    { label: '문제풀이', icon: ClipboardList, count: problemCount, color: 'text-red-500' },
    { label: '직전보강', icon: Brain, count: lastReviewCount, color: 'text-amber-500' },
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
            {s.toggle && (s.expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />)}
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
                onClick={() => setBulkDeleteOpen(true)}
                disabled={deleting}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                {deleting ? '삭제 중...' : `${selectedIds.size}개 삭제`}
              </Button>
            )}
          </div>
          <div className="max-h-[70vh] overflow-y-auto space-y-1 rounded-lg border p-2">
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
                    onClick={() => setDeleteVocabId(v.id)}
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

      {/* 교과서 지문 목록 */}
      {showPassageList && passageList.length > 0 && (
        <div className="space-y-1 rounded-lg border p-2">
          {passageList.map((passage) => (
            <div key={passage.id} className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-muted/50 group">
              <FileText className="h-3.5 w-3.5 text-orange-500 shrink-0" />
              <span className="text-sm flex-1 truncate">{passage.title}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100"
                onClick={() => setDeletePassageId(passage.id)}
                aria-label="삭제"
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* 문법 설명 목록 */}
      {showGrammarList && grammarList.length > 0 && (
        <div className="space-y-1 rounded-lg border p-2">
          {grammarList.map((lesson) => (
            <div key={lesson.id} className="rounded hover:bg-muted/50">
              <div className="flex items-center gap-2 py-1.5 px-2 group">
                <Badge variant="outline" className="text-[10px] h-4 px-1 shrink-0">
                  {lesson.content_type === 'video' ? '영상' : '텍스트'}
                </Badge>
                <span className="text-sm font-medium flex-1 truncate">{lesson.title}</span>
                {lesson.youtube_video_id && (
                  <span className="text-xs text-muted-foreground truncate max-w-[100px]">{lesson.youtube_video_id}</span>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100"
                  onClick={() => editingGrammarId === lesson.id ? setEditingGrammarId(null) : startGrammarEdit(lesson)}
                  aria-label="수정"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100"
                  onClick={() => setDeleteGrammarId(lesson.id)}
                  aria-label="삭제"
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
              {editingGrammarId === lesson.id && (
                <div className="px-2 pb-2 space-y-2">
                  <Input className="h-7 text-sm" value={grammarEditForm.title} onChange={(e) => setGrammarEditForm({ ...grammarEditForm, title: e.target.value })} placeholder="제목" />
                  {lesson.content_type === 'video' ? (
                    <Input className="h-7 text-sm" value={grammarEditForm.youtube_url} onChange={(e) => setGrammarEditForm({ ...grammarEditForm, youtube_url: e.target.value })} placeholder="YouTube URL" />
                  ) : (
                    <Input className="h-7 text-sm" value={grammarEditForm.text_content} onChange={(e) => setGrammarEditForm({ ...grammarEditForm, text_content: e.target.value })} placeholder="텍스트 내용" />
                  )}
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="outline" className="h-7" onClick={() => setEditingGrammarId(null)}>취소</Button>
                    <Button size="sm" className="h-7" onClick={saveGrammarEdit}>저장</Button>
                  </div>
                </div>
              )}
              <div className="px-2 pb-2">
                <ChatQuestionManager lessonId={lesson.id} lessonTitle={lesson.title} />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <AddVocabDialog unitId={unitId} onAdd={loadCounts} />
        <BulkVocabUpload unitId={unitId} onAdd={loadCounts} />
        <PdfVocabExtract unitId={unitId} onAdd={loadCounts} />
        <AddPassageDialog unitId={unitId} onAdd={loadCounts} />
        <AddGrammarDialog unitId={unitId} onAdd={loadCounts} />
        <AddOmrDialog unitId={unitId} onAdd={loadCounts} />
        <AddProblemDialog unitId={unitId} onAdd={loadCounts} />
        <AddLastReviewDialog unitId={unitId} onAdd={loadCounts} />
      </div>

      <ConfirmDialog
        open={deleteVocabId !== null}
        onOpenChange={(open) => { if (!open) setDeleteVocabId(null); }}
        description="이 단어를 삭제하시겠습니까?"
        onConfirm={() => {
          const id = deleteVocabId;
          setDeleteVocabId(null);
          if (id) handleDeleteOne(id);
        }}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        description={`선택한 ${selectedIds.size}개 단어를 삭제하시겠습니까?`}
        onConfirm={() => {
          setBulkDeleteOpen(false);
          handleBulkDelete();
        }}
      />

      <ConfirmDialog
        open={deletePassageId !== null}
        onOpenChange={(open) => { if (!open) setDeletePassageId(null); }}
        description="이 지문을 삭제하시겠습니까? 관련된 빈칸/배열/영작 데이터도 함께 삭제됩니다."
        onConfirm={() => {
          const id = deletePassageId;
          setDeletePassageId(null);
          if (id) handleDeletePassage(id);
        }}
      />

      <ConfirmDialog
        open={deleteGrammarId !== null}
        onOpenChange={(open) => { if (!open) setDeleteGrammarId(null); }}
        description="이 문법 설명을 삭제하시겠습니까?"
        onConfirm={() => {
          const id = deleteGrammarId;
          setDeleteGrammarId(null);
          if (id) handleDeleteGrammar(id);
        }}
      />
    </div>
  );
}
