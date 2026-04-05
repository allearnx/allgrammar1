'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ShieldCheck } from 'lucide-react';
import type { FullValidationResult } from '@/lib/validation';
import type { GeneratedQuestion } from './question-utils';
import { QuestionEditRow, QuestionViewRow, ValidationBadgeIcon, QuestionBadge } from './question-table-rows';
import type { useQuestionEditor } from '@/hooks/use-question-editor';

interface GeneratePreviewStepProps {
  questions: GeneratedQuestion[];
  editor: ReturnType<typeof useQuestionEditor>;
  validation: FullValidationResult | null;
  validating: boolean;
  saving: boolean;
  onValidate: () => void;
  onSubmit: () => void;
}

export function GeneratePreviewStep({
  questions,
  editor,
  validation,
  validating,
  saving,
  onValidate,
  onSubmit,
}: GeneratePreviewStepProps) {
  const mcqTotal = questions.filter((q) => q.options !== null && q.options.length > 0).length;
  const subTotal = questions.length - mcqTotal;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Badge variant="secondary">총 {questions.length}문제</Badge>
        {mcqTotal > 0 && <Badge variant="outline">객관식 {mcqTotal}</Badge>}
        {subTotal > 0 && <Badge variant="outline">서술형 {subTotal}</Badge>}
        {validation && (
          <Badge
            variant={validation.badge === 'pass' ? 'default' : validation.badge === 'warn' ? 'secondary' : 'destructive'}
            className="gap-1"
          >
            <ValidationBadgeIcon badge={validation.badge} />
            {validation.summary || (validation.badge === 'pass' ? '검증 통과' : validation.badge === 'warn' ? '경고 있음' : '오류 있음')}
          </Badge>
        )}
      </div>

      <Button
        size="sm"
        variant="outline"
        onClick={onValidate}
        disabled={validating || editor.questions.length === 0}
      >
        {validating ? (
          <>
            <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
            AI 검증 중...
          </>
        ) : (
          <>
            <ShieldCheck className="h-3.5 w-3.5 mr-1" />
            AI 검증 실행
          </>
        )}
      </Button>

      <div className="rounded-lg border overflow-hidden max-h-[60vh] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 sticky top-0">
            <tr>
              <th className="text-left p-2 w-10">#</th>
              <th className="text-left p-2">문제</th>
              <th className="text-left p-2 w-16">유형</th>
              <th className="text-left p-2 w-20">정답</th>
              <th className="text-left p-2 w-16">편집</th>
              <th className="text-left p-2 w-10">검증</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((q, i) => (
              <tr key={i} className="border-t">
                {editor.editingIdx === i ? (
                  <QuestionEditRow
                    question={q}
                    onUpdate={(field, value) => editor.updateQuestion(i, field, value)}
                    onUpdateOption={(optIdx, value) => editor.updateOption(i, optIdx, value)}
                    onDone={() => editor.setEditingIdx(null)}
                  />
                ) : (
                  <>
                    <QuestionViewRow question={q} onEdit={() => editor.setEditingIdx(i)} />
                    <td className="p-2">
                      <QuestionBadge questionNumber={q.number} validation={validation} />
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Button className="w-full" onClick={onSubmit} disabled={saving}>
        {saving ? '저장 중...' : `${questions.length}문제 시트 저장`}
      </Button>
    </div>
  );
}
