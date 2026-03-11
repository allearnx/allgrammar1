'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { BookOpen, Trash2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { useListCrud } from '@/hooks/use-list-crud';
import { useInlineEdit } from '@/hooks/use-inline-edit';
import { useConfirmDelete } from '@/hooks/use-confirm-delete';
import { AddVocabDialog } from './add-vocab-dialog';
import { BulkVocabUpload } from './bulk-vocab-upload';
import { PdfVocabExtract } from './pdf-vocab-extract';
import type { VocaVocabulary } from '@/types/voca';

export function DayContentManager({ dayId }: { dayId: string }) {
  const [loading, setLoading] = useState(true);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const vocab = useListCrud<VocaVocabulary>({
    apiEndpoint: '/api/voca/vocabulary',
    messages: {
      deleteSuccess: '단어가 삭제되었습니다',
      deleteError: '단어 삭제 중 오류가 발생했습니다',
      bulkSuccess: (n) => `${n}개 단어가 삭제되었습니다`,
      bulkError: '일괄 삭제 중 오류가 발생했습니다',
    },
  });

  const vocabEdit = useInlineEdit<VocaVocabulary, {
    front_text: string; back_text: string; part_of_speech: string; example_sentence: string;
    synonyms: string; antonyms: string; spelling_hint: string; spelling_answer: string; idioms: string;
  }>({
    apiEndpoint: '/api/voca/vocabulary',
    toForm: (v) => ({
      front_text: v.front_text,
      back_text: v.back_text,
      part_of_speech: v.part_of_speech || '',
      example_sentence: v.example_sentence || '',
      synonyms: v.synonyms || '',
      antonyms: v.antonyms || '',
      spelling_hint: v.spelling_hint || '',
      spelling_answer: v.spelling_answer || '',
      idioms: v.idioms ? JSON.stringify(v.idioms, null, 2) : '',
    }),
    toPayload: (id, form) => {
      let parsedIdioms = null;
      if (form.idioms.trim()) {
        try {
          parsedIdioms = JSON.parse(form.idioms);
        } catch {
          throw new Error('숙어 JSON 형식이 올바르지 않습니다');
        }
      }
      const { idioms: _, ...rest } = form;
      return { id, ...rest, idioms: parsedIdioms };
    },
    messages: { success: '단어가 수정되었습니다', error: '단어 수정 중 오류가 발생했습니다' },
  }, vocab.setItems);

  const vocabDelete = useConfirmDelete(vocab.handleDeleteOne);

  useEffect(() => { loadVocab(); }, [dayId]);

  async function loadVocab() {
    setLoading(true);
    try {
      const res = await fetch(`/api/voca/vocabulary?dayId=${dayId}`);
      const data = await res.json();
      vocab.setItems(data || []);
      vocab.setSelectedIds(new Set());
    } catch (err) {
      console.error(err);
      toast.error('단어 목록을 불러오지 못했습니다');
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground mt-3">로딩 중...</p>;

  return (
    <div className="mt-4 space-y-3 border-t pt-3">
      <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
        <BookOpen className="h-4 w-4 text-violet-600" />
        <span className="text-sm">단어</span>
        <Badge variant="secondary" className="ml-auto">{vocab.items.length}개</Badge>
      </div>

      {vocab.items.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox checked={vocab.selectedIds.size === vocab.items.length && vocab.items.length > 0} onCheckedChange={vocab.toggleSelectAll} />
              전체 선택
            </label>
            {vocab.selectedIds.size > 0 && (
              <Button size="sm" variant="destructive" onClick={() => setBulkDeleteOpen(true)} disabled={vocab.deleting}>
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                {vocab.deleting ? '삭제 중...' : `${vocab.selectedIds.size}개 삭제`}
              </Button>
            )}
          </div>
          <div className="max-h-[70vh] overflow-y-auto space-y-1 rounded-lg border p-2">
            {vocab.items.map((v) => (
              <div key={v.id} className="rounded hover:bg-muted/50">
                <div className="flex items-center gap-2 py-1.5 px-2 group">
                  <Checkbox checked={vocab.selectedIds.has(v.id)} onCheckedChange={() => vocab.toggleSelect(v.id)} />
                  <span className="text-sm font-medium flex-1 truncate">{v.front_text}</span>
                  <span className="text-sm text-muted-foreground truncate max-w-[120px]">{v.back_text}</span>
                  {v.synonyms && <Badge variant="outline" className="text-[10px] h-4 px-1">유</Badge>}
                  {v.antonyms && <Badge variant="outline" className="text-[10px] h-4 px-1">반</Badge>}
                  {v.idioms && v.idioms.length > 0 && <Badge variant="outline" className="text-[10px] h-4 px-1 border-violet-400 text-violet-700">숙</Badge>}
                  <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => vocabEdit.editingId === v.id ? vocabEdit.cancelEdit() : vocabEdit.startEdit(v)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => vocabDelete.requestDelete(v.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
                {vocabEdit.editingId === v.id && (
                  <div className="px-2 pb-2 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Input className="h-7 text-sm" value={vocabEdit.editForm.front_text} onChange={(e) => vocabEdit.setEditForm({ ...vocabEdit.editForm, front_text: e.target.value })} placeholder="영어" />
                      <Input className="h-7 text-sm" value={vocabEdit.editForm.back_text} onChange={(e) => vocabEdit.setEditForm({ ...vocabEdit.editForm, back_text: e.target.value })} placeholder="한국어" />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <Input className="h-7 text-sm" value={vocabEdit.editForm.part_of_speech} onChange={(e) => vocabEdit.setEditForm({ ...vocabEdit.editForm, part_of_speech: e.target.value })} placeholder="품사" />
                      <Input className="h-7 text-sm col-span-2" value={vocabEdit.editForm.example_sentence} onChange={(e) => vocabEdit.setEditForm({ ...vocabEdit.editForm, example_sentence: e.target.value })} placeholder="예문" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input className="h-7 text-sm" value={vocabEdit.editForm.synonyms} onChange={(e) => vocabEdit.setEditForm({ ...vocabEdit.editForm, synonyms: e.target.value })} placeholder="유의어" />
                      <Input className="h-7 text-sm" value={vocabEdit.editForm.antonyms} onChange={(e) => vocabEdit.setEditForm({ ...vocabEdit.editForm, antonyms: e.target.value })} placeholder="반의어" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input className="h-7 text-sm" value={vocabEdit.editForm.spelling_hint} onChange={(e) => vocabEdit.setEditForm({ ...vocabEdit.editForm, spelling_hint: e.target.value })} placeholder="스펠링 힌트" />
                      <Input className="h-7 text-sm" value={vocabEdit.editForm.spelling_answer} onChange={(e) => vocabEdit.setEditForm({ ...vocabEdit.editForm, spelling_answer: e.target.value })} placeholder="스펠링 정답" />
                    </div>
                    <div>
                      <Textarea className="text-xs font-mono" rows={3} value={vocabEdit.editForm.idioms} onChange={(e) => vocabEdit.setEditForm({ ...vocabEdit.editForm, idioms: e.target.value })} placeholder='숙어 JSON: [{"en":"...", "ko":"...", "example_en":"...", "example_ko":"..."}]' />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="outline" className="h-7" onClick={vocabEdit.cancelEdit}>취소</Button>
                      <Button size="sm" className="h-7" onClick={vocabEdit.saveEdit}>저장</Button>
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
        description="이 단어를 삭제하시겠습니까?"
        {...vocabDelete.confirmDialogProps}
      />
      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        description={`선택한 ${vocab.selectedIds.size}개 단어를 삭제하시겠습니까?`}
        onConfirm={() => { setBulkDeleteOpen(false); vocab.handleBulkDelete(); }}
      />
    </div>
  );
}
