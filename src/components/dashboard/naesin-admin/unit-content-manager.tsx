'use client';

import { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  FileText,
  GraduationCap,
  ClipboardList,
  ChevronDown,
  ChevronRight,
  Brain,
} from 'lucide-react';
import { toast } from 'sonner';
import type { NaesinVocabulary, NaesinGrammarLesson, NaesinPassage } from '@/types/database';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { AddVocabDialog, BulkVocabUpload, PdfVocabExtract } from './vocab-dialogs';
import { AddPassageDialog, AddGrammarDialog, AddOmrDialog, AddProblemDialog, AddLastReviewDialog, BulkOmrUploadDialog, BulkProblemUploadDialog } from './content-dialogs';
import { VocabQuizSetManager } from './quiz-set-manager';
import { useListCrud } from '@/hooks/use-list-crud';
import { useInlineEdit } from '@/hooks/use-inline-edit';
import { useConfirmDelete } from '@/hooks/use-confirm-delete';
import { extractVideoId } from '@/lib/utils/youtube';
import { UnitVocabList } from './unit-vocab-list';
import { UnitPassageList, type PassageEditForm } from './unit-passage-list';
import { UnitGrammarList } from './unit-grammar-list';

export function UnitContentManager({ unitId }: { unitId: string }) {
  const vocab = useListCrud<NaesinVocabulary>({
    apiEndpoint: '/api/naesin/vocabulary',
    messages: {
      deleteSuccess: '단어가 삭제되었습니다',
      deleteError: '단어 삭제 중 오류가 발생했습니다',
      bulkSuccess: (n) => `${n}개 단어가 삭제되었습니다`,
      bulkError: '일괄 삭제 중 오류가 발생했습니다',
    },
  });

  const vocabEdit = useInlineEdit<NaesinVocabulary, { front_text: string; back_text: string; part_of_speech: string; example_sentence: string; synonyms: string; antonyms: string }>({
    apiEndpoint: '/api/naesin/vocabulary',
    toForm: (v) => ({
      front_text: v.front_text,
      back_text: v.back_text,
      part_of_speech: v.part_of_speech || '',
      example_sentence: v.example_sentence || '',
      synonyms: v.synonyms || '',
      antonyms: v.antonyms || '',
    }),
    toPayload: (id, form) => ({ id, ...form }),
    messages: { success: '단어가 수정되었습니다', error: '단어 수정 중 오류가 발생했습니다' },
  }, vocab.setItems);

  const vocabDelete = useConfirmDelete(vocab.handleDeleteOne);

  const [showVocabList, setShowVocabList] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const [passageList, setPassageList] = useState<NaesinPassage[]>([]);
  const [showPassageList, setShowPassageList] = useState(false);
  const [editingPassageId, setEditingPassageId] = useState<string | null>(null);
  const [passageEditForm, setPassageEditForm] = useState<PassageEditForm>({ title: '', sentences: [] });
  const [savingPassage, setSavingPassage] = useState(false);
  const passageDelete = useConfirmDelete(handleDeletePassage);

  const [grammarList, setGrammarList] = useState<NaesinGrammarLesson[]>([]);
  const [showGrammarList, setShowGrammarList] = useState(false);
  const grammarDelete = useConfirmDelete(handleDeleteGrammar);

  const grammarEdit = useInlineEdit<NaesinGrammarLesson, { title: string; youtube_url: string; text_content: string }>({
    apiEndpoint: '/api/naesin/grammar-lessons',
    toForm: (lesson) => ({
      title: lesson.title,
      youtube_url: lesson.youtube_url || '',
      text_content: lesson.text_content || '',
    }),
    toPayload: (id, form) => {
      const lesson = grammarList.find((l) => l.id === id);
      const updates: Record<string, unknown> = { id, title: form.title };
      if (lesson?.content_type === 'video') {
        updates.youtube_url = form.youtube_url || null;
        updates.youtube_video_id = extractVideoId(form.youtube_url) || null;
      } else {
        updates.text_content = form.text_content || null;
      }
      return updates;
    },
    messages: { success: '문법 설명이 수정되었습니다', error: '문법 설명 수정 중 오류가 발생했습니다' },
  }, setGrammarList);

  const [omrCount, setOmrCount] = useState<number | null>(null);
  const [problemCount, setProblemCount] = useState<number | null>(null);
  const [lastReviewCount, setLastReviewCount] = useState<number | null>(null);
  const [regeneratingGV, setRegeneratingGV] = useState<string | null>(null);

  const loadCounts = useCallback(async () => {
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const [v, p, g, o, prob, lr] = await Promise.all([
        supabase.from('naesin_vocabulary').select('*').eq('unit_id', unitId).order('sort_order'),
        supabase.from('naesin_passages').select('*').eq('unit_id', unitId).order('created_at'),
        supabase.from('naesin_grammar_lessons').select('*').eq('unit_id', unitId).order('sort_order'),
        supabase.from('naesin_omr_sheets').select('*', { count: 'exact', head: true }).eq('unit_id', unitId),
        supabase.from('naesin_problem_sheets').select('*', { count: 'exact', head: true }).eq('unit_id', unitId).eq('category', 'problem'),
        supabase.from('naesin_last_review_content').select('*', { count: 'exact', head: true }).eq('unit_id', unitId),
      ]);
      vocab.setItems((v.data as NaesinVocabulary[]) || []);
      setPassageList((p.data as NaesinPassage[]) || []);
      setGrammarList((g.data as NaesinGrammarLesson[]) || []);
      setOmrCount(o.count ?? 0);
      setProblemCount(prob.count ?? 0);
      setLastReviewCount(lr.count ?? 0);
      vocab.setSelectedIds(new Set());
    } catch (err) {
      console.error(err);
      toast.error('데이터를 불러오지 못했습니다');
    }
  }, [unitId, vocab]);

  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

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
    } catch (err) {
      console.error(err);
      toast.error('지문 삭제 중 오류가 발생했습니다');
    }
  }

  function startPassageEdit(passage: NaesinPassage) {
    setEditingPassageId(passage.id);
    const sentences = Array.isArray(passage.sentences) && passage.sentences.length > 0
      ? passage.sentences.map((s) => ({ original: s.original, korean: s.korean, acceptedAnswers: s.acceptedAnswers || [] }))
      : [{ original: passage.original_text, korean: passage.korean_translation, acceptedAnswers: [] as string[] }];
    setPassageEditForm({ title: passage.title, sentences });
  }

  function updateSentence(idx: number, field: 'original' | 'korean', value: string) {
    setPassageEditForm((prev) => ({
      ...prev,
      sentences: prev.sentences.map((s, i) => (i === idx ? { ...s, [field]: value } : s)),
    }));
  }

  function addSentence(afterIdx?: number) {
    setPassageEditForm((prev) => {
      const newSentence = { original: '', korean: '', acceptedAnswers: [] };
      if (afterIdx === undefined) {
        return { ...prev, sentences: [...prev.sentences, newSentence] };
      }
      const sentences = [...prev.sentences];
      sentences.splice(afterIdx + 1, 0, newSentence);
      return { ...prev, sentences };
    });
  }

  function removeSentence(idx: number) {
    if (passageEditForm.sentences.length <= 1) return;
    setPassageEditForm((prev) => ({
      ...prev,
      sentences: prev.sentences.filter((_, i) => i !== idx),
    }));
  }

  function addAcceptedAnswer(sentenceIdx: number) {
    setPassageEditForm((prev) => ({
      ...prev,
      sentences: prev.sentences.map((s, i) =>
        i === sentenceIdx ? { ...s, acceptedAnswers: [...s.acceptedAnswers, ''] } : s
      ),
    }));
  }

  function updateAcceptedAnswer(sentenceIdx: number, answerIdx: number, value: string) {
    setPassageEditForm((prev) => ({
      ...prev,
      sentences: prev.sentences.map((s, i) =>
        i === sentenceIdx
          ? { ...s, acceptedAnswers: s.acceptedAnswers.map((a, j) => (j === answerIdx ? value : a)) }
          : s
      ),
    }));
  }

  function removeAcceptedAnswer(sentenceIdx: number, answerIdx: number) {
    setPassageEditForm((prev) => ({
      ...prev,
      sentences: prev.sentences.map((s, i) =>
        i === sentenceIdx
          ? { ...s, acceptedAnswers: s.acceptedAnswers.filter((_, j) => j !== answerIdx) }
          : s
      ),
    }));
  }

  async function savePassageEdit() {
    if (!editingPassageId) return;
    setSavingPassage(true);
    try {
      const res = await fetch('/api/naesin/passages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingPassageId,
          title: passageEditForm.title,
          sentences: passageEditForm.sentences.map((s) => ({
            original: s.original,
            korean: s.korean,
            ...(s.acceptedAnswers.filter(Boolean).length > 0
              ? { acceptedAnswers: s.acceptedAnswers.filter(Boolean) }
              : {}),
          })),
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setPassageList((prev) => prev.map((p) => (p.id === editingPassageId ? updated : p)));
        setEditingPassageId(null);
        toast.success('지문이 수정되었습니다');
      } else {
        toast.error('수정 실패');
      }
    } catch (err) {
      console.error(err);
      toast.error('지문 수정 중 오류가 발생했습니다');
    } finally {
      setSavingPassage(false);
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
        toast.success('문법 설명이 삭제되었습니다');
      } else {
        toast.error('삭제 실패');
      }
    } catch (err) {
      console.error(err);
      toast.error('문법 설명 삭제 중 오류가 발생했습니다');
    }
  }

  async function regenerateGrammarVocab(passage: NaesinPassage) {
    if (!passage.sentences || passage.sentences.length === 0) {
      toast.error('문장 데이터가 없습니다');
      return;
    }
    setRegeneratingGV(passage.id);
    try {
      const gvRes = await fetch('/api/naesin/passages/extract-grammar-vocab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sentences: passage.sentences }),
      });
      if (!gvRes.ok) throw new Error('AI 생성 실패');
      const gvData = await gvRes.json();

      const patchRes = await fetch('/api/naesin/passages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: passage.id, grammar_vocab_items: gvData.items || [] }),
      });
      if (!patchRes.ok) throw new Error('저장 실패');
      const updated = await patchRes.json();
      setPassageList((prev) => prev.map((p) => (p.id === passage.id ? updated : p)));
      toast.success(`어법/어휘 문제 ${(gvData.items || []).length}개 생성됨`);
    } catch (err) {
      console.error(err);
      toast.error('어법/어휘 재생성 실패');
    } finally {
      setRegeneratingGV(null);
    }
  }

  function handlePassageTitleChange(title: string) {
    setPassageEditForm((prev) => ({ ...prev, title }));
  }

  const grammarCount = grammarList.length;
  const sections = [
    { label: '단어', icon: BookOpen, count: vocab.items.length, color: 'text-blue-500', toggle: () => setShowVocabList(!showVocabList), expanded: showVocabList },
    { label: '교과서 지문', icon: FileText, count: passageList.length, color: 'text-orange-500', toggle: () => setShowPassageList(!showPassageList), expanded: showPassageList },
    { label: '문법 설명', icon: GraduationCap, count: grammarCount, color: 'text-green-500', toggle: () => setShowGrammarList(!showGrammarList), expanded: showGrammarList },
    { label: 'OMR 시트', icon: ClipboardList, count: omrCount, color: 'text-indigo-500' },
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

      {showVocabList && vocab.items.length > 0 && (
        <UnitVocabList
          unitId={unitId}
          items={vocab.items}
          selectedIds={vocab.selectedIds}
          toggleSelectAll={vocab.toggleSelectAll}
          toggleSelect={vocab.toggleSelect}
          deleting={vocab.deleting}
          setSelectedIds={(ids) => vocab.setSelectedIds(ids)}
          editingId={vocabEdit.editingId}
          editForm={vocabEdit.editForm}
          setEditForm={vocabEdit.setEditForm}
          startEdit={vocabEdit.startEdit}
          cancelEdit={vocabEdit.cancelEdit}
          saveEdit={vocabEdit.saveEdit}
          onRequestDelete={vocabDelete.requestDelete}
          onBulkDeleteOpen={() => setBulkDeleteOpen(true)}
        />
      )}

      <VocabQuizSetManager unitId={unitId} />

      {showPassageList && passageList.length > 0 && (
        <UnitPassageList
          passages={passageList}
          editingId={editingPassageId}
          editForm={passageEditForm}
          savingPassage={savingPassage}
          regeneratingGV={regeneratingGV}
          onStartEdit={startPassageEdit}
          onCancelEdit={() => setEditingPassageId(null)}
          onSaveEdit={savePassageEdit}
          onTitleChange={handlePassageTitleChange}
          onUpdateSentence={updateSentence}
          onAddSentence={addSentence}
          onRemoveSentence={removeSentence}
          onAddAcceptedAnswer={addAcceptedAnswer}
          onUpdateAcceptedAnswer={updateAcceptedAnswer}
          onRemoveAcceptedAnswer={removeAcceptedAnswer}
          onRequestDelete={passageDelete.requestDelete}
          onRegenerateGrammarVocab={regenerateGrammarVocab}
        />
      )}

      {showGrammarList && grammarList.length > 0 && (
        <UnitGrammarList
          lessons={grammarList}
          editingId={grammarEdit.editingId}
          editForm={grammarEdit.editForm}
          setEditForm={grammarEdit.setEditForm}
          startEdit={grammarEdit.startEdit}
          cancelEdit={grammarEdit.cancelEdit}
          saveEdit={grammarEdit.saveEdit}
          onRequestDelete={grammarDelete.requestDelete}
        />
      )}

      <div className="flex flex-wrap gap-2">
        <AddVocabDialog unitId={unitId} onAdd={loadCounts} />
        <BulkVocabUpload unitId={unitId} onAdd={loadCounts} />
        <PdfVocabExtract unitId={unitId} onAdd={loadCounts} />
        <AddPassageDialog unitId={unitId} onAdd={loadCounts} />
        <AddGrammarDialog unitId={unitId} onAdd={loadCounts} />
        <AddOmrDialog unitId={unitId} onAdd={loadCounts} />
        <AddProblemDialog unitId={unitId} onAdd={loadCounts} />
        <BulkOmrUploadDialog unitId={unitId} onAdd={loadCounts} />
        <BulkProblemUploadDialog unitId={unitId} onAdd={loadCounts} />
        <AddLastReviewDialog unitId={unitId} onAdd={loadCounts} />
      </div>

      <ConfirmDialog
        description="이 단어를 삭제하시겠습니까?"
        {...vocabDelete.confirmDialogProps}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        description={`선택한 ${vocab.selectedIds.size}개 단어를 삭제하시겠습니까?`}
        onConfirm={() => {
          setBulkDeleteOpen(false);
          vocab.handleBulkDelete();
        }}
      />

      <ConfirmDialog
        description="이 지문을 삭제하시겠습니까? 관련된 빈칸/배열/영작 데이터도 함께 삭제됩니다."
        {...passageDelete.confirmDialogProps}
      />

      <ConfirmDialog
        description="이 문법 설명을 삭제하시겠습니까?"
        {...grammarDelete.confirmDialogProps}
      />
    </div>
  );
}
