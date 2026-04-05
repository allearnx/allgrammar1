'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import { useQuestionEditor } from '@/hooks/use-question-editor';
import { toGenerated, toDbQuestion, type GeneratedQuestion } from './question-utils';
import { QuestionEditRow, QuestionViewRow } from './question-table-rows';
import type { NaesinProblemQuestion } from '@/types/naesin';

interface EditTemplateDialogProps {
  template: {
    id: string;
    title: string;
    template_topic: string;
    questions: NaesinProblemQuestion[];
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}

export function EditTemplateDialog({ template, open, onOpenChange, onUpdated }: EditTemplateDialogProps) {
  const [title, setTitle] = useState(template.title);
  const [topic, setTopic] = useState(template.template_topic);
  const [saving, setSaving] = useState(false);
  const editor = useQuestionEditor();

  useEffect(() => {
    if (open) {
      setTitle(template.title);
      setTopic(template.template_topic);
      editor.setQuestions((template.questions || []).map(toGenerated));
      editor.setEditingIdx(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, template.id]);

  async function handleSave() {
    if (!title.trim() || !topic.trim()) return;
    setSaving(true);
    try {
      const questions = editor.questions.map(toDbQuestion);
      const answerKey = editor.questions.map((q) => q.answer);
      await fetchWithToast('/api/naesin/templates', {
        method: 'PATCH',
        body: {
          id: template.id,
          title: title.trim(),
          templateTopic: topic.trim(),
          questions,
          answerKey,
        },
        successMessage: '템플릿이 수정되었습니다',
        errorMessage: '템플릿 수정 실패',
        logContext: 'template.edit',
      });
      onUpdated();
      onOpenChange(false);
    } catch { /* */ } finally {
      setSaving(false);
    }
  }

  const mcqCount = editor.questions.filter((q) => q.options && q.options.length > 0).length;
  const subCount = editor.questions.length - mcqCount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-base">템플릿 수정</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground">제목</label>
            <Input className="h-8 text-sm" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">주제</label>
            <Input className="h-8 text-sm" value={topic} onChange={(e) => setTopic(e.target.value)} />
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary" className="text-[11px]">{editor.questions.length}문제</Badge>
          {mcqCount > 0 && <Badge variant="outline" className="text-[11px]">객관식 {mcqCount}</Badge>}
          {subCount > 0 && <Badge variant="outline" className="text-[11px]">서술형 {subCount}</Badge>}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto rounded-lg border">
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
              {editor.questions.map((q, i) => (
                <tr key={i} className="border-t">
                  {editor.editingIdx === i ? (
                    <QuestionEditRow
                      question={q}
                      onUpdate={(field, value) => editor.updateQuestion(i, field, value)}
                      onUpdateOption={(optIdx, value) => editor.updateOption(i, optIdx, value)}
                      onToggleType={() => editor.toggleQuestionType(i)}
                      onDone={() => editor.setEditingIdx(null)}
                    />
                  ) : (
                    <QuestionViewRow
                      question={q}
                      onEdit={() => editor.setEditingIdx(i)}
                      onDelete={() => editor.deleteQuestion(i)}
                    />
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>취소</Button>
          <Button size="sm" onClick={handleSave} disabled={saving || !title.trim() || !topic.trim()}>
            {saving && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
            저장
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
