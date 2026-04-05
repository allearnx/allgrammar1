import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import type { GeneratedQuestion } from './question-utils';
import { hasOptions } from './question-utils';
import type { FullValidationResult, ValidationBadge } from '@/lib/validation';

export function QuestionEditRow({
  question,
  onUpdate,
  onUpdateOption,
  onToggleType,
  onDone,
}: {
  question: GeneratedQuestion;
  onUpdate: (field: keyof GeneratedQuestion, value: string) => void;
  onUpdateOption: (optIdx: number, value: string) => void;
  onToggleType?: () => void;
  onDone: () => void;
}) {
  const isMcq = hasOptions(question);
  return (
    <td colSpan={6} className="p-3 space-y-2">
      {onToggleType && (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={isMcq ? 'default' : 'outline'}
            className="h-6 text-xs"
            onClick={() => { if (!isMcq) onToggleType(); }}
          >
            객관식
          </Button>
          <Button
            size="sm"
            variant={!isMcq ? 'default' : 'outline'}
            className="h-6 text-xs"
            onClick={() => { if (isMcq) onToggleType(); }}
          >
            단답형
          </Button>
        </div>
      )}
      <div>
        <Label className="text-xs">문제</Label>
        <Textarea
          value={question.question}
          onChange={(e) => onUpdate('question', e.target.value)}
          rows={2}
        />
      </div>
      {isMcq && (
        <div className="grid grid-cols-5 gap-1">
          {question.options!.map((opt, oi) => (
            <Input
              key={oi}
              value={opt}
              onChange={(e) => onUpdateOption(oi, e.target.value)}
              className="text-xs"
            />
          ))}
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">정답</Label>
          <Input value={question.answer} onChange={(e) => onUpdate('answer', e.target.value)} />
        </div>
        <div>
          <Label className="text-xs">해설</Label>
          <Input value={question.explanation} onChange={(e) => onUpdate('explanation', e.target.value)} />
        </div>
      </div>
      <Button size="sm" variant="outline" onClick={onDone}>편집 완료</Button>
    </td>
  );
}

export function QuestionViewRow({
  question,
  onEdit,
}: {
  question: GeneratedQuestion;
  onEdit: () => void;
}) {
  return (
    <>
      <td className="p-2">{question.number}</td>
      <td className="p-2 whitespace-pre-wrap break-words">{question.question}</td>
      <td className="p-2">
        <Badge variant={hasOptions(question) ? 'outline' : 'secondary'} className="text-xs">
          {hasOptions(question) ? '객관식' : '서술형'}
        </Badge>
      </td>
      <td className="p-2 text-xs">{question.answer}</td>
      <td className="p-2">
        <Button size="sm" variant="ghost" onClick={onEdit}>수정</Button>
      </td>
    </>
  );
}

export function ValidationBadgeIcon({ badge }: { badge?: ValidationBadge }) {
  if (!badge) return null;
  if (badge === 'pass') return <CheckCircle2 className="h-4 w-4 text-green-600" />;
  if (badge === 'warn') return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
  return <XCircle className="h-4 w-4 text-red-600" />;
}

export function QuestionBadge({ questionNumber, validation }: { questionNumber: number; validation?: FullValidationResult | null }) {
  if (!validation) return null;

  const structuralError = validation.structural.issues.some(
    (i) => i.questionNumber === questionNumber && i.severity === 'error',
  );
  if (structuralError) return <XCircle className="h-3.5 w-3.5 text-red-600" />;

  const answerMismatch = validation.answerCheck?.results.find(
    (r) => r.questionNumber === questionNumber && !r.match,
  );
  if (answerMismatch) return <AlertTriangle className="h-3.5 w-3.5 text-yellow-600" />;

  const tooObvious = validation.answerCheck?.results.find(
    (r) => r.questionNumber === questionNumber && r.tooObvious,
  );
  if (tooObvious) return <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />;

  const qualityFlagged = validation.qualityScore?.scores.find(
    (s) => s.questionNumber === questionNumber && s.flags.length > 0,
  );
  if (qualityFlagged) return <AlertTriangle className="h-3.5 w-3.5 text-yellow-600" />;

  if (validation.answerCheck || validation.qualityScore) {
    return <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />;
  }

  return null;
}
