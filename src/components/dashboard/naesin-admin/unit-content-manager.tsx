'use client';

import { useState, useEffect, useCallback, useReducer } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  FileText,
  MessageSquare,
  GraduationCap,
  ClipboardList,
  ChevronDown,
  ChevronRight,
  Brain,
} from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import type { NaesinVocabulary, NaesinGrammarLesson, NaesinPassage } from '@/types/database';
import type { NaesinProblemSheet } from '@/types/naesin';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { AddVocabDialog, BulkVocabUpload, PdfVocabExtract } from './vocab-dialogs';
import { AddPassageDialog, AddDialogueDialog, AddGrammarDialog, AddOmrDialog, AddProblemDialog, AddLastReviewDialog, BulkOmrUploadDialog, BulkProblemUploadDialog, PdfProblemExtractDialog } from './content-dialogs';
import { VocabQuizSetManager } from './quiz-set-manager';
import { useListCrud } from '@/hooks/use-list-crud';
import { useInlineEdit } from '@/hooks/use-inline-edit';
import { useConfirmDelete } from '@/hooks/use-confirm-delete';
import { extractVideoId } from '@/lib/utils/youtube';
import { UnitVocabList } from './unit-vocab-list';
import { UnitPassageList } from './unit-passage-list';
import { UnitGrammarList } from './unit-grammar-list';
import { UnitProblemList } from './unit-problem-list';

/** 공통 삭제 핸들러 생성 */
function makeDeleteHandler(
  endpoint: string,
  setList: (fn: (prev: { id: string }[]) => { id: string }[]) => void,
  messages: { success: string; error: string; logKey: string },
) {
  return async (id: string) => {
    try {
      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setList((prev) => prev.filter((item) => item.id !== id));
        toast.success(messages.success);
      } else {
        toast.error('삭제 실패');
      }
    } catch (err) {
      logger.error(messages.logKey, { error: err instanceof Error ? err.message : String(err) });
      toast.error(messages.error);
    }
  };
}

interface ContentManagerState {
  showVocabList: boolean;
  showPassageList: boolean;
  showGrammarList: boolean;
  showProblemList: boolean;
  bulkDeleteOpen: boolean;
  dialogueCount: number | null;
  omrCount: number | null;
  lastReviewCount: number | null;
  regeneratingGV: string | null;
}

type ContentManagerAction =
  | { type: 'TOGGLE_SECTION'; section: 'vocab' | 'passage' | 'grammar' | 'problem' }
  | { type: 'SET_BULK_DELETE_OPEN'; open: boolean }
  | { type: 'SET_COUNTS'; dialogueCount: number; omrCount: number; lastReviewCount: number }
  | { type: 'SET_REGENERATING_GV'; id: string | null };

function contentManagerReducer(state: ContentManagerState, action: ContentManagerAction): ContentManagerState {
  switch (action.type) {
    case 'TOGGLE_SECTION': {
      const key = `show${action.section.charAt(0).toUpperCase() + action.section.slice(1)}List` as keyof ContentManagerState;
      return { ...state, [key]: !state[key] };
    }
    case 'SET_BULK_DELETE_OPEN':
      return { ...state, bulkDeleteOpen: action.open };
    case 'SET_COUNTS':
      return { ...state, dialogueCount: action.dialogueCount, omrCount: action.omrCount, lastReviewCount: action.lastReviewCount };
    case 'SET_REGENERATING_GV':
      return { ...state, regeneratingGV: action.id };
    default:
      return state;
  }
}

const contentManagerInitialState: ContentManagerState = {
  showVocabList: false,
  showPassageList: false,
  showGrammarList: false,
  showProblemList: false,
  bulkDeleteOpen: false,
  dialogueCount: null,
  omrCount: null,
  lastReviewCount: null,
  regeneratingGV: null,
};

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

  const [cm, dispatchCM] = useReducer(contentManagerReducer, contentManagerInitialState);

  const [passageList, setPassageList] = useState<NaesinPassage[]>([]);
  const passageDelete = useConfirmDelete(
    makeDeleteHandler('/api/naesin/passages', setPassageList as never, {
      success: '지문이 삭제되었습니다',
      error: '지문 삭제 중 오류가 발생했습니다',
      logKey: 'unit.delete_passage',
    }),
  );

  const [grammarList, setGrammarList] = useState<NaesinGrammarLesson[]>([]);
  const grammarDelete = useConfirmDelete(
    makeDeleteHandler('/api/naesin/grammar-lessons', setGrammarList as never, {
      success: '문법 설명이 삭제되었습니다',
      error: '문법 설명 삭제 중 오류가 발생했습니다',
      logKey: 'unit.delete_grammar',
    }),
  );

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

  const [problemList, setProblemList] = useState<NaesinProblemSheet[]>([]);
  const problemDelete = useConfirmDelete(
    makeDeleteHandler('/api/naesin/problems', setProblemList as never, {
      success: '문제 시트가 삭제되었습니다',
      error: '문제 시트 삭제 중 오류가 발생했습니다',
      logKey: 'unit.delete_problem',
    }),
  );


  const loadCounts = useCallback(async () => {
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const [v, p, dlg, g, o, prob, lr] = await Promise.all([
        supabase.from('naesin_vocabulary').select('*').eq('unit_id', unitId).order('sort_order'),
        supabase.from('naesin_passages').select('*').eq('unit_id', unitId).order('created_at'),
        supabase.from('naesin_dialogues').select('*', { count: 'exact', head: true }).eq('unit_id', unitId),
        supabase.from('naesin_grammar_lessons').select('*').eq('unit_id', unitId).order('sort_order'),
        supabase.from('naesin_omr_sheets').select('*', { count: 'exact', head: true }).eq('unit_id', unitId),
        supabase.from('naesin_problem_sheets').select('*').eq('unit_id', unitId).eq('category', 'problem').order('created_at'),
        supabase.from('naesin_last_review_content').select('*', { count: 'exact', head: true }).eq('unit_id', unitId),
      ]);
      vocab.setItems((v.data as NaesinVocabulary[]) || []);
      setPassageList((p.data as NaesinPassage[]) || []);
      dispatchCM({ type: 'SET_COUNTS', dialogueCount: dlg.count ?? 0, omrCount: o.count ?? 0, lastReviewCount: lr.count ?? 0 });
      setGrammarList((g.data as NaesinGrammarLesson[]) || []);
      setProblemList((prob.data as NaesinProblemSheet[]) || []);
      vocab.setSelectedIds(new Set());
    } catch (err) {
      logger.error('unit.load_counts', { error: err instanceof Error ? err.message : String(err) });
      toast.error('데이터를 불러오지 못했습니다');
    }
  }, [unitId, vocab]);

  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

  async function regenerateGrammarVocab(passage: NaesinPassage) {
    if (!passage.sentences || passage.sentences.length === 0) {
      toast.error('문장 데이터가 없습니다');
      return;
    }
    dispatchCM({ type: 'SET_REGENERATING_GV', id: passage.id });
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
      logger.error('unit.regen_grammar_vocab', { error: err instanceof Error ? err.message : String(err) });
      toast.error('어법/어휘 재생성 실패');
    } finally {
      dispatchCM({ type: 'SET_REGENERATING_GV', id: null });
    }
  }

  const sections = [
    { label: '단어', icon: BookOpen, count: vocab.items.length, color: 'text-blue-500', toggle: () => dispatchCM({ type: 'TOGGLE_SECTION', section: 'vocab' }), expanded: cm.showVocabList },
    { label: '교과서 지문', icon: FileText, count: passageList.length, color: 'text-orange-500', toggle: () => dispatchCM({ type: 'TOGGLE_SECTION', section: 'passage' }), expanded: cm.showPassageList },
    { label: '대화문', icon: MessageSquare, count: cm.dialogueCount, color: 'text-violet-500' },
    { label: '문법 설명', icon: GraduationCap, count: grammarList.length, color: 'text-green-500', toggle: () => dispatchCM({ type: 'TOGGLE_SECTION', section: 'grammar' }), expanded: cm.showGrammarList },
    { label: 'OMR 시트', icon: ClipboardList, count: cm.omrCount, color: 'text-indigo-500' },
    { label: '문제풀이', icon: ClipboardList, count: problemList.length, color: 'text-red-500', toggle: () => dispatchCM({ type: 'TOGGLE_SECTION', section: 'problem' }), expanded: cm.showProblemList },
    { label: '직전보강', icon: Brain, count: cm.lastReviewCount, color: 'text-amber-500' },
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

      {cm.showVocabList && vocab.items.length > 0 && (
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
          onBulkDeleteOpen={() => dispatchCM({ type: 'SET_BULK_DELETE_OPEN', open: true })}
        />
      )}

      <VocabQuizSetManager unitId={unitId} />

      {cm.showPassageList && passageList.length > 0 && (
        <UnitPassageList
          passages={passageList}
          regeneratingGV={cm.regeneratingGV}
          onUpdate={(updated) => setPassageList((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))}
          onRequestDelete={passageDelete.requestDelete}
          onRegenerateGrammarVocab={regenerateGrammarVocab}
        />
      )}

      {cm.showGrammarList && grammarList.length > 0 && (
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

      {cm.showProblemList && problemList.length > 0 && (
        <UnitProblemList
          sheets={problemList}
          onUpdate={(updated) => setProblemList((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))}
          onRequestDelete={problemDelete.requestDelete}
        />
      )}

      <div className="flex flex-wrap gap-2">
        <AddVocabDialog module="naesin" parentId={unitId} onAdd={loadCounts} />
        <BulkVocabUpload module="naesin" parentId={unitId} onAdd={loadCounts} />
        <PdfVocabExtract module="naesin" parentId={unitId} onAdd={loadCounts} />
        <AddPassageDialog unitId={unitId} onAdd={loadCounts} />
        <AddDialogueDialog unitId={unitId} onAdd={loadCounts} />
        <AddGrammarDialog unitId={unitId} onAdd={loadCounts} />
        <AddOmrDialog unitId={unitId} onAdd={loadCounts} />
        <AddProblemDialog unitId={unitId} onAdd={loadCounts} />
        <BulkOmrUploadDialog unitId={unitId} onAdd={loadCounts} />
        <BulkProblemUploadDialog unitId={unitId} onAdd={loadCounts} />
        <PdfProblemExtractDialog unitId={unitId} onAdd={loadCounts} />
        <AddLastReviewDialog unitId={unitId} onAdd={loadCounts} />
      </div>

      <ConfirmDialog
        description="이 단어를 삭제하시겠습니까?"
        {...vocabDelete.confirmDialogProps}
      />

      <ConfirmDialog
        open={cm.bulkDeleteOpen}
        onOpenChange={(open) => dispatchCM({ type: 'SET_BULK_DELETE_OPEN', open })}
        description={`선택한 ${vocab.selectedIds.size}개 단어를 삭제하시겠습니까?`}
        onConfirm={() => {
          dispatchCM({ type: 'SET_BULK_DELETE_OPEN', open: false });
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

      <ConfirmDialog
        description="이 문제 시트를 삭제하시겠습니까? 관련된 학생 답안도 함께 삭제됩니다."
        {...problemDelete.confirmDialogProps}
      />
    </div>
  );
}
