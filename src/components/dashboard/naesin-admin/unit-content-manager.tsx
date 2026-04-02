'use client';

import { useState, useEffect, useCallback, useReducer } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  FileText,
  MessageSquare,
  GraduationCap,
  ClipboardList,
  ChevronDown,
  ChevronRight,
  Brain,
  PlayCircle,
  FileQuestion,
} from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import type { NaesinVocabulary, NaesinGrammarLesson, NaesinPassage } from '@/types/database';
import type { NaesinProblemSheet, NaesinTextbookVideo } from '@/types/naesin';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { AddVocabDialog, BulkVocabUpload, PdfVocabExtract } from './vocab-dialogs';
import { AddPassageDialog, AddDialogueDialog, AddGrammarDialog, AddOmrDialog, AddProblemDialog, AddLastReviewDialog, BulkOmrUploadDialog, BulkProblemUploadDialog, PdfProblemExtractDialog, AddTextbookVideoDialog, AddMockExamDialog } from './content-dialogs';
import { VocabQuizSetManager } from './quiz-set-manager';
import { useListCrud } from '@/hooks/use-list-crud';
import { useInlineEdit } from '@/hooks/use-inline-edit';
import { useConfirmDelete } from '@/hooks/use-confirm-delete';
import { extractVideoId } from '@/lib/utils/youtube';
import { UnitVocabList } from './unit-vocab-list';
import { UnitPassageList } from './unit-passage-list';
import { UnitGrammarList } from './unit-grammar-list';
import { UnitProblemList } from './unit-problem-list';
import { makeDeleteHandler } from '@/lib/naesin/make-delete-handler';
import { contentManagerReducer, contentManagerInitialState } from './unit-content-manager-state';

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

  const [textbookVideoList, setTextbookVideoList] = useState<NaesinTextbookVideo[]>([]);
  const textbookVideoDelete = useConfirmDelete(
    makeDeleteHandler('/api/naesin/textbook-videos', setTextbookVideoList as never, {
      success: '설명 영상이 삭제되었습니다',
      error: '설명 영상 삭제 중 오류가 발생했습니다',
      logKey: 'unit.delete_textbook_video',
    }),
  );

  const [mockExamList, setMockExamList] = useState<NaesinProblemSheet[]>([]);
  const mockExamDelete = useConfirmDelete(
    makeDeleteHandler('/api/naesin/problems', setMockExamList as never, {
      success: '예상문제 시트가 삭제되었습니다',
      error: '예상문제 시트 삭제 중 오류가 발생했습니다',
      logKey: 'unit.delete_mock_exam',
    }),
  );


  const loadCounts = useCallback(async () => {
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const [v, p, dlg, g, o, prob, lr, tbv, mock] = await Promise.all([
        supabase.from('naesin_vocabulary').select('*').eq('unit_id', unitId).order('sort_order'),
        supabase.from('naesin_passages').select('*').eq('unit_id', unitId).order('created_at'),
        supabase.from('naesin_dialogues').select('*', { count: 'exact', head: true }).eq('unit_id', unitId),
        supabase.from('naesin_grammar_lessons').select('*').eq('unit_id', unitId).order('sort_order'),
        supabase.from('naesin_omr_sheets').select('*', { count: 'exact', head: true }).eq('unit_id', unitId),
        supabase.from('naesin_problem_sheets').select('*').eq('unit_id', unitId).eq('category', 'problem').order('created_at'),
        supabase.from('naesin_last_review_content').select('*', { count: 'exact', head: true }).eq('unit_id', unitId),
        supabase.from('naesin_textbook_videos').select('*').eq('unit_id', unitId).order('sort_order'),
        supabase.from('naesin_problem_sheets').select('*').eq('unit_id', unitId).eq('category', 'mock_exam').order('created_at'),
      ]);
      vocab.setItems((v.data as NaesinVocabulary[]) || []);
      setPassageList((p.data as NaesinPassage[]) || []);
      dispatchCM({ type: 'SET_COUNTS', dialogueCount: dlg.count ?? 0, omrCount: o.count ?? 0, lastReviewCount: lr.count ?? 0 });
      setGrammarList((g.data as NaesinGrammarLesson[]) || []);
      setProblemList((prob.data as NaesinProblemSheet[]) || []);
      setTextbookVideoList((tbv.data as NaesinTextbookVideo[]) || []);
      setMockExamList((mock.data as NaesinProblemSheet[]) || []);
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
      const gvData = await fetchWithToast<{ items?: unknown[] }>('/api/naesin/passages/extract-grammar-vocab', {
        body: { sentences: passage.sentences },
        silent: true,
        logContext: 'unit.regen_grammar_vocab',
      });
      const updated = await fetchWithToast<NaesinPassage>('/api/naesin/passages', {
        method: 'PATCH',
        body: { id: passage.id, grammar_vocab_items: gvData.items || [] },
        successMessage: `어법/어휘 문제 ${(gvData.items || []).length}개 생성됨`,
        errorMessage: '어법/어휘 재생성 실패',
        logContext: 'unit.regen_grammar_vocab',
      });
      setPassageList((prev) => prev.map((p) => (p.id === passage.id ? updated : p)));
    } catch { /* fetchWithToast handles toasts/logging */ } finally {
      dispatchCM({ type: 'SET_REGENERATING_GV', id: null });
    }
  }

  const sections = [
    { label: '단어', icon: BookOpen, count: vocab.items.length, color: 'text-blue-500', toggle: () => dispatchCM({ type: 'TOGGLE_SECTION', section: 'vocab' }), expanded: cm.showVocabList },
    { label: '교과서 지문', icon: FileText, count: passageList.length, color: 'text-orange-500', toggle: () => dispatchCM({ type: 'TOGGLE_SECTION', section: 'passage' }), expanded: cm.showPassageList },
    { label: '대화문', icon: MessageSquare, count: cm.dialogueCount, color: 'text-violet-500' },
    { label: '본문 설명 영상', icon: PlayCircle, count: textbookVideoList.length, color: 'text-cyan-500', toggle: () => dispatchCM({ type: 'TOGGLE_SECTION', section: 'textbookVideo' }), expanded: cm.showTextbookVideoList },
    { label: '문법 설명', icon: GraduationCap, count: grammarList.length, color: 'text-green-500', toggle: () => dispatchCM({ type: 'TOGGLE_SECTION', section: 'grammar' }), expanded: cm.showGrammarList },
    { label: 'OMR 시트', icon: ClipboardList, count: cm.omrCount, color: 'text-indigo-500' },
    { label: '문제풀이', icon: ClipboardList, count: problemList.length, color: 'text-red-500', toggle: () => dispatchCM({ type: 'TOGGLE_SECTION', section: 'problem' }), expanded: cm.showProblemList },
    { label: '예상문제', icon: FileQuestion, count: mockExamList.length, color: 'text-pink-500', toggle: () => dispatchCM({ type: 'TOGGLE_SECTION', section: 'mockExam' }), expanded: cm.showMockExamList },
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

      {cm.showTextbookVideoList && textbookVideoList.length > 0 && (
        <div className="space-y-1 rounded-lg border p-3">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">본문 설명 영상 목록</h4>
          {textbookVideoList.map((v) => (
            <div key={v.id} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50">
              <div className="flex items-center gap-2 min-w-0">
                <PlayCircle className="h-4 w-4 text-cyan-500 shrink-0" />
                <span className="text-sm truncate">{v.title}</span>
                {v.youtube_video_id && <span className="text-xs text-gray-400">{v.youtube_video_id}</span>}
              </div>
              <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700 h-7 px-2" onClick={() => textbookVideoDelete.requestDelete(v.id)}>
                삭제
              </Button>
            </div>
          ))}
        </div>
      )}

      {cm.showProblemList && problemList.length > 0 && (
        <UnitProblemList
          sheets={problemList}
          onUpdate={(updated) => setProblemList((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))}
          onRequestDelete={problemDelete.requestDelete}
        />
      )}

      {cm.showMockExamList && mockExamList.length > 0 && (
        <UnitProblemList
          sheets={mockExamList}
          onUpdate={(updated) => setMockExamList((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))}
          onRequestDelete={mockExamDelete.requestDelete}
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
        <AddTextbookVideoDialog unitId={unitId} onAdd={loadCounts} />
        <AddProblemDialog unitId={unitId} onAdd={loadCounts} />
        <AddMockExamDialog unitId={unitId} onAdd={loadCounts} />
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

      <ConfirmDialog
        description="이 설명 영상을 삭제하시겠습니까?"
        {...textbookVideoDelete.confirmDialogProps}
      />

      <ConfirmDialog
        description="이 예상문제 시트를 삭제하시겠습니까? 관련된 학생 답안도 함께 삭제됩니다."
        {...mockExamDelete.confirmDialogProps}
      />
    </div>
  );
}
