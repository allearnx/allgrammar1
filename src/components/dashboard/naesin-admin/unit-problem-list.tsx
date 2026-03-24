'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, ChevronDown, ChevronRight, Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import type { NaesinProblemSheet, NaesinProblemQuestion } from '@/types/naesin';
import {
  QuestionEditRow,
  QuestionViewRow,
  hasOptions,
  type GeneratedQuestion,
} from './content-dialogs/pdf-problem-extract-dialog';

/** DB question → GeneratedQuestion 변환 */
function toGenerated(q: NaesinProblemQuestion): GeneratedQuestion {
  return {
    number: q.number,
    question: q.question,
    options: q.options && q.options.length > 0 ? q.options : null,
    answer: String(q.answer ?? ''),
    explanation: q.explanation || '',
  };
}

/** GeneratedQuestion → DB question 변환 */
function toDbQuestion(q: GeneratedQuestion, idx: number): NaesinProblemQuestion {
  return {
    number: idx + 1,
    question: q.question,
    ...(hasOptions(q) ? { options: q.options! } : {}),
    answer: q.answer,
    ...(q.explanation ? { explanation: q.explanation } : {}),
  };
}

interface UnitProblemListProps {
  sheets: NaesinProblemSheet[];
  onUpdate: (updated: NaesinProblemSheet) => void;
  onRequestDelete: (id: string) => void;
}

export function UnitProblemList({ sheets, onUpdate, onRequestDelete }: UnitProblemListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingSheetId, setEditingSheetId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editQuestions, setEditQuestions] = useState<GeneratedQuestion[]>([]);
  const [editingQIdx, setEditingQIdx] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  function startEdit(sheet: NaesinProblemSheet) {
    setEditingSheetId(sheet.id);
    setEditTitle(sheet.title);
    setEditQuestions((sheet.questions || []).map(toGenerated));
    setEditingQIdx(null);
    if (expandedId !== sheet.id) setExpandedId(sheet.id);
  }

  function cancelEdit() {
    setEditingSheetId(null);
    setEditTitle('');
    setEditQuestions([]);
    setEditingQIdx(null);
  }

  function updateQuestion(idx: number, field: keyof GeneratedQuestion, value: string) {
    setEditQuestions((prev) => prev.map((q, i) => (i === idx ? { ...q, [field]: value } : q)));
  }

  function updateOption(qIdx: number, optIdx: number, value: string) {
    setEditQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx || !q.options) return q;
        const newOptions = [...q.options];
        newOptions[optIdx] = value;
        return { ...q, options: newOptions };
      })
    );
  }

  async function saveEdit() {
    if (!editingSheetId || !editTitle.trim()) return;
    setSaving(true);
    try {
      const questions = editQuestions.map(toDbQuestion);
      const answerKey = editQuestions.map((q) => q.answer);

      const res = await fetch('/api/naesin/problems', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingSheetId,
          title: editTitle.trim(),
          questions,
          answer_key: answerKey,
        }),
      });
      if (!res.ok) throw new Error('저장 실패');
      const updated = await res.json();
      onUpdate(updated);
      cancelEdit();
      toast.success('문제 시트가 수정되었습니다');
    } catch (err) {
      logger.error('unit.save_problem_sheet', { error: err instanceof Error ? err.message : String(err) });
      toast.error('문제 시트 수정 중 오류가 발생했습니다');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-1 rounded-lg border p-2">
      {sheets.map((sheet) => {
        const isExpanded = expandedId === sheet.id;
        const isEditing = editingSheetId === sheet.id;
        const questions: NaesinProblemQuestion[] = sheet.questions || [];
        const mcqCount = questions.filter((q) => q.options && q.options.length > 0).length;
        const subCount = questions.length - mcqCount;

        return (
          <div key={sheet.id} className="rounded hover:bg-muted/50">
            <div
              className="flex items-center gap-2 py-1.5 px-2 group cursor-pointer"
              onClick={() => setExpandedId(isExpanded ? null : sheet.id)}
            >
              {isExpanded ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />}
              <ClipboardList className="h-3.5 w-3.5 text-red-500 shrink-0" />
              <span className="text-sm flex-1 truncate">{sheet.title}</span>
              <Badge variant="secondary" className="text-[11px]">{questions.length}문제</Badge>
              {mcqCount > 0 && <Badge variant="outline" className="text-[11px]">객관식 {mcqCount}</Badge>}
              {subCount > 0 && <Badge variant="outline" className="text-[11px]">서술형 {subCount}</Badge>}
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100"
                onClick={(e) => { e.stopPropagation(); isEditing ? cancelEdit() : startEdit(sheet); }}
                aria-label="수정"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100"
                onClick={(e) => { e.stopPropagation(); onRequestDelete(sheet.id); }}
                aria-label="삭제"
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>

            {isExpanded && (
              <div className="px-2 pb-3">
                {isEditing && (
                  <div className="mb-2">
                    <Input
                      className="h-8 text-sm"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="시트 제목"
                    />
                  </div>
                )}

                <div className="rounded-lg border overflow-hidden max-h-[50vh] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 sticky top-0">
                      <tr>
                        <th className="text-left p-2 w-10">#</th>
                        <th className="text-left p-2">문제</th>
                        <th className="text-left p-2 w-16">유형</th>
                        <th className="text-left p-2 w-20">정답</th>
                        <th className="text-left p-2 w-16">편집</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(isEditing ? editQuestions : questions.map(toGenerated)).map((q, i) => (
                        <tr key={i} className="border-t">
                          {isEditing && editingQIdx === i ? (
                            <QuestionEditRow
                              question={q}
                              onUpdate={(field, value) => updateQuestion(i, field, value)}
                              onUpdateOption={(optIdx, value) => updateOption(i, optIdx, value)}
                              onDone={() => setEditingQIdx(null)}
                            />
                          ) : (
                            <QuestionViewRow
                              question={q}
                              onEdit={() => {
                              if (!isEditing) startEdit(sheet);
                              setEditingQIdx(i);
                            }}
                            />
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {isEditing && (
                  <div className="flex gap-2 justify-end mt-2">
                    <Button size="sm" variant="outline" className="h-7" onClick={cancelEdit}>취소</Button>
                    <Button size="sm" className="h-7" onClick={saveEdit} disabled={saving || !editTitle.trim()}>
                      {saving && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
                      저장
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
