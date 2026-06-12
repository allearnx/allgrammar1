'use client';

import { useState, useEffect, useCallback, useReducer } from 'react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import type { NaesinVocabulary, NaesinGrammarLesson, NaesinPassage } from '@/types/database';
import type { NaesinDialogue, NaesinProblemSheet, NaesinTextbookVideo } from '@/types/naesin';
import { SHEET_ADMIN_LITE_COLUMNS, NAESIN_VOCABULARY_COLUMNS, NAESIN_PASSAGES_COLUMNS, NAESIN_DIALOGUES_COLUMNS, NAESIN_GRAMMAR_LESSONS_COLUMNS, NAESIN_TEXTBOOK_VIDEOS_COLUMNS } from '@/types/naesin';
import { useListCrud } from '@/hooks/use-list-crud';
import { useInlineEdit } from '@/hooks/use-inline-edit';
import { useConfirmDelete } from '@/hooks/use-confirm-delete';
import { extractVideoId } from '@/lib/utils/youtube';
import { makeDeleteHandler } from '@/lib/naesin/make-delete-handler';
import { contentManagerReducer, contentManagerInitialState } from './unit-content-manager-state';

export function useUnitContentData(unitId: string) {
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

  const [dialogueList, setDialogueList] = useState<NaesinDialogue[]>([]);
  const dialogueDelete = useConfirmDelete(
    makeDeleteHandler('/api/naesin/dialogues', setDialogueList as never, {
      success: '대화문이 삭제되었습니다',
      error: '대화문 삭제 중 오류가 발생했습니다',
      logKey: 'unit.delete_dialogue',
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
        supabase.from('naesin_vocabulary').select(NAESIN_VOCABULARY_COLUMNS).eq('unit_id', unitId).order('sort_order'),
        supabase.from('naesin_passages').select(NAESIN_PASSAGES_COLUMNS).eq('unit_id', unitId).order('created_at'),
        supabase.from('naesin_dialogues').select(NAESIN_DIALOGUES_COLUMNS).eq('unit_id', unitId).order('created_at'),
        supabase.from('naesin_grammar_lessons').select(NAESIN_GRAMMAR_LESSONS_COLUMNS).eq('unit_id', unitId).order('sort_order'),
        supabase.from('naesin_omr_sheets').select('id', { count: 'exact', head: true }).eq('unit_id', unitId),
        supabase.from('naesin_problem_sheets').select(SHEET_ADMIN_LITE_COLUMNS).eq('unit_id', unitId).in('category', ['problem', 'external_passage', 'eng_eng_def']).order('sort_order'),
        supabase.from('naesin_last_review_content').select('id', { count: 'exact', head: true }).eq('unit_id', unitId),
        supabase.from('naesin_textbook_videos').select(NAESIN_TEXTBOOK_VIDEOS_COLUMNS).eq('unit_id', unitId).order('sort_order'),
        supabase.from('naesin_problem_sheets').select(SHEET_ADMIN_LITE_COLUMNS).eq('unit_id', unitId).eq('category', 'mock_exam').order('sort_order'),
      ]);
      vocab.setItems((v.data as NaesinVocabulary[]) || []);
      setPassageList((p.data as NaesinPassage[]) || []);
      setDialogueList((dlg.data as NaesinDialogue[]) || []);
      dispatchCM({ type: 'SET_COUNTS', omrCount: o.count ?? 0, lastReviewCount: lr.count ?? 0 });
      setGrammarList((g.data as NaesinGrammarLesson[]) || []);
      setProblemList((prob.data as unknown as NaesinProblemSheet[]) || []);
      setTextbookVideoList((tbv.data as NaesinTextbookVideo[]) || []);
      setMockExamList((mock.data as unknown as NaesinProblemSheet[]) || []);
      vocab.setSelectedIds(new Set());
    } catch (err) {
      logger.error('unit.load_counts', { error: err instanceof Error ? err.message : String(err) });
      toast.error('데이터를 불러오지 못했습니다');
    }
  }, [unitId, vocab]);

  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

  const [loadingSheetId, setLoadingSheetId] = useState<string | null>(null);

  const loadFullSheet = useCallback(async (sheetId: string): Promise<NaesinProblemSheet | null> => {
    // Check if already full (has questions)
    const inProblems = problemList.find(s => s.id === sheetId);
    if (inProblems?.questions) return inProblems;
    const inMockExams = mockExamList.find(s => s.id === sheetId);
    if (inMockExams?.questions) return inMockExams;

    setLoadingSheetId(sheetId);
    try {
      const res = await fetch(`/api/naesin/problems/sheet?id=${sheetId}`);
      if (!res.ok) return null;
      const full: NaesinProblemSheet = await res.json();
      // Update the list with full data
      setProblemList(prev => prev.map(s => s.id === sheetId ? full : s));
      setMockExamList(prev => prev.map(s => s.id === sheetId ? full : s));
      return full;
    } catch {
      return null;
    } finally {
      setLoadingSheetId(null);
    }
  }, [problemList, mockExamList]);

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

  return {
    vocab, vocabEdit, vocabDelete,
    cm, dispatchCM,
    passageList, setPassageList, passageDelete,
    dialogueList, setDialogueList, dialogueDelete,
    grammarList, grammarEdit, grammarDelete,
    problemList, setProblemList, problemDelete,
    textbookVideoList, textbookVideoDelete,
    mockExamList, setMockExamList, mockExamDelete,
    loadFullSheet, loadingSheetId,
    refresh: loadCounts,
    regenerateGrammarVocab,
  };
}
