'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Bot, Trash2, Pencil, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { useInlineEdit } from '@/hooks/use-inline-edit';
import { useConfirmDelete } from '@/hooks/use-confirm-delete';
import { AddChatQuestionDialog } from './content-dialogs';
import type { NaesinGrammarChatQuestion } from '@/types/database';

interface ChatQuestionManagerProps {
  lessonId: string;
  lessonTitle: string;
}

export function ChatQuestionManager({ lessonId, lessonTitle }: ChatQuestionManagerProps) {
  const [questions, setQuestions] = useState<NaesinGrammarChatQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  const edit = useInlineEdit<NaesinGrammarChatQuestion, { questionText: string; grammarConcept: string; hint: string; expectedAnswerKeywords: string }>({
    apiEndpoint: '/api/naesin/grammar/chat/questions',
    toForm: (q) => ({
      questionText: q.question_text,
      grammarConcept: q.grammar_concept || '',
      hint: q.hint || '',
      expectedAnswerKeywords: (q.expected_answer_keywords || []).join(', '),
    }),
    toPayload: (id, form) => ({
      id,
      questionText: form.questionText,
      grammarConcept: form.grammarConcept || null,
      hint: form.hint || null,
      expectedAnswerKeywords: form.expectedAnswerKeywords.split(',').map((k) => k.trim()).filter(Boolean),
    }),
    messages: { success: '질문이 수정되었습니다', error: '질문 수정 중 오류가 발생했습니다' },
  }, setQuestions);

  const confirmDelete = useConfirmDelete(async (id) => {
    try {
      const res = await fetch('/api/naesin/grammar/chat/questions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setQuestions((prev) => prev.filter((q) => q.id !== id));
        toast.success('질문이 삭제되었습니다');
      } else {
        toast.error('삭제 실패');
      }
    } catch (err) {
      console.error(err);
      toast.error('질문 삭제 중 오류가 발생했습니다');
    }
  });

  useEffect(() => {
    loadQuestions();
  }, [lessonId]);

  async function loadQuestions() {
    try {
      const res = await fetch(`/api/naesin/grammar/chat/questions?lessonId=${lessonId}`);
      if (res.ok) {
        const data = await res.json();
        setQuestions(data);
      }
    } catch (err) {
      console.error(err);
      toast.error('질문 목록을 불러오지 못했습니다');
    } finally {
      setLoading(false);
    }
  }

  if (loading) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Bot className="h-3.5 w-3.5 text-blue-500" />
          <span className="text-xs font-medium">AI 질문</span>
          <Badge variant="secondary" className="text-[10px] h-4 px-1">{questions.length}개</Badge>
        </div>
        <AddChatQuestionDialog lessonId={lessonId} onAdd={loadQuestions} />
      </div>

      {questions.length > 0 && (
        <div className="space-y-1 rounded-lg border p-2">
          {questions.map((q, i) => (
            <div key={q.id} className="rounded hover:bg-muted/50">
              <div className="flex items-center gap-2 py-1.5 px-2 group">
                <GripVertical className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground shrink-0">{i + 1}.</span>
                <span className="text-sm flex-1 truncate">{q.question_text}</span>
                {q.grammar_concept && (
                  <Badge variant="outline" className="text-[10px] h-4 px-1 shrink-0">
                    {q.grammar_concept}
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100"
                  onClick={() => edit.editingId === q.id ? edit.cancelEdit() : edit.startEdit(q)}
                  aria-label="수정"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100"
                  onClick={() => confirmDelete.requestDelete(q.id)}
                  aria-label="삭제"
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
              {edit.editingId === q.id && (
                <div className="px-2 pb-2 space-y-2">
                  <Input
                    className="h-7 text-sm"
                    value={edit.editForm.questionText}
                    onChange={(e) => edit.setEditForm({ ...edit.editForm, questionText: e.target.value })}
                    placeholder="질문"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      className="h-7 text-sm"
                      value={edit.editForm.grammarConcept}
                      onChange={(e) => edit.setEditForm({ ...edit.editForm, grammarConcept: e.target.value })}
                      placeholder="문법 개념"
                    />
                    <Input
                      className="h-7 text-sm"
                      value={edit.editForm.hint}
                      onChange={(e) => edit.setEditForm({ ...edit.editForm, hint: e.target.value })}
                      placeholder="힌트"
                    />
                  </div>
                  <Input
                    className="h-7 text-sm"
                    value={edit.editForm.expectedAnswerKeywords}
                    onChange={(e) => edit.setEditForm({ ...edit.editForm, expectedAnswerKeywords: e.target.value })}
                    placeholder="예상 키워드 (쉼표 구분)"
                  />
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="outline" className="h-7" onClick={edit.cancelEdit}>취소</Button>
                    <Button size="sm" className="h-7" onClick={edit.saveEdit}>저장</Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        description="이 AI 질문을 삭제하시겠습니까?"
        {...confirmDelete.confirmDialogProps}
      />
    </div>
  );
}
