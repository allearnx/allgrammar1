'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Bot, Trash2, Pencil, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { AddChatQuestionDialog } from './content-dialogs';
import type { NaesinGrammarChatQuestion } from '@/types/database';

interface ChatQuestionManagerProps {
  lessonId: string;
  lessonTitle: string;
}

export function ChatQuestionManager({ lessonId, lessonTitle }: ChatQuestionManagerProps) {
  const [questions, setQuestions] = useState<NaesinGrammarChatQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ questionText: '', grammarConcept: '', hint: '', expectedAnswerKeywords: '' });

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

  function startEdit(q: NaesinGrammarChatQuestion) {
    setEditingId(q.id);
    setEditForm({
      questionText: q.question_text,
      grammarConcept: q.grammar_concept || '',
      hint: q.hint || '',
      expectedAnswerKeywords: (q.expected_answer_keywords || []).join(', '),
    });
  }

  async function saveEdit() {
    if (!editingId) return;
    try {
      const keywords = editForm.expectedAnswerKeywords
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean);

      const res = await fetch('/api/naesin/grammar/chat/questions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingId,
          questionText: editForm.questionText,
          grammarConcept: editForm.grammarConcept || null,
          hint: editForm.hint || null,
          expectedAnswerKeywords: keywords,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setQuestions((prev) => prev.map((q) => (q.id === editingId ? updated : q)));
        setEditingId(null);
        toast.success('질문이 수정되었습니다');
      } else {
        toast.error('수정 실패');
      }
    } catch (err) {
      console.error(err);
      toast.error('질문 수정 중 오류가 발생했습니다');
    }
  }

  async function handleDelete(id: string) {
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
                  onClick={() => editingId === q.id ? setEditingId(null) : startEdit(q)}
                  aria-label="수정"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100"
                  onClick={() => setDeleteId(q.id)}
                  aria-label="삭제"
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
              {editingId === q.id && (
                <div className="px-2 pb-2 space-y-2">
                  <Input
                    className="h-7 text-sm"
                    value={editForm.questionText}
                    onChange={(e) => setEditForm({ ...editForm, questionText: e.target.value })}
                    placeholder="질문"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      className="h-7 text-sm"
                      value={editForm.grammarConcept}
                      onChange={(e) => setEditForm({ ...editForm, grammarConcept: e.target.value })}
                      placeholder="문법 개념"
                    />
                    <Input
                      className="h-7 text-sm"
                      value={editForm.hint}
                      onChange={(e) => setEditForm({ ...editForm, hint: e.target.value })}
                      placeholder="힌트"
                    />
                  </div>
                  <Input
                    className="h-7 text-sm"
                    value={editForm.expectedAnswerKeywords}
                    onChange={(e) => setEditForm({ ...editForm, expectedAnswerKeywords: e.target.value })}
                    placeholder="예상 키워드 (쉼표 구분)"
                  />
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="outline" className="h-7" onClick={() => setEditingId(null)}>취소</Button>
                    <Button size="sm" className="h-7" onClick={saveEdit}>저장</Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => { if (!open) setDeleteId(null); }}
        description="이 AI 질문을 삭제하시겠습니까?"
        onConfirm={() => {
          const id = deleteId;
          setDeleteId(null);
          if (id) handleDelete(id);
        }}
      />
    </div>
  );
}
