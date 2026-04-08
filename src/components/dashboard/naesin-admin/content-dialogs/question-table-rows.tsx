import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, XCircle, Wand2, Plus, X, ImagePlus, Loader2, Trash2, ImageIcon } from 'lucide-react';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import type { GeneratedQuestion } from './question-utils';
import { hasOptions } from './question-utils';
import type { FullValidationResult, ValidationBadge } from '@/lib/validation';

export function QuestionEditRow({
  question,
  onUpdate,
  onUpdateOption,
  onToggleType,
  onDone,
  onUpdateAcceptedAnswers,
  onGenerateAcceptedAnswers,
}: {
  question: GeneratedQuestion;
  onUpdate: (field: keyof GeneratedQuestion, value: string) => void;
  onUpdateOption: (optIdx: number, value: string) => void;
  onToggleType?: () => void;
  onDone: () => void;
  onUpdateAcceptedAnswers?: (answers: string[]) => void;
  onGenerateAcceptedAnswers?: () => void;
}) {
  const isMcq = hasOptions(question);
  const accepted = question.acceptedAnswers ?? [];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const data = await fetchWithToast<{ url: string }>('/api/naesin/upload-image', {
        body: formData,
        errorMessage: '이미지 업로드 실패',
        logContext: 'question_image_upload',
      });
      onUpdate('imageUrl' as keyof GeneratedQuestion, data.url);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function handleAddAccepted() {
    onUpdateAcceptedAnswers?.([...accepted, '']);
  }

  function handleRemoveAccepted(idx: number) {
    onUpdateAcceptedAnswers?.(accepted.filter((_, i) => i !== idx));
  }

  function handleChangeAccepted(idx: number, value: string) {
    const next = [...accepted];
    next[idx] = value;
    onUpdateAcceptedAnswers?.(next);
  }

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

      {/* 허용 답안 (서술형만) */}
      {!isMcq && onUpdateAcceptedAnswers && (
        <div className="space-y-1.5 border-t pt-2">
          <div className="flex items-center gap-2">
            <Label className="text-xs">허용 답안</Label>
            {onGenerateAcceptedAnswers && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-6 text-xs gap-1"
                onClick={onGenerateAcceptedAnswers}
              >
                <Wand2 className="h-3 w-3" />
                자동 생성
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-6 text-xs gap-1"
              onClick={handleAddAccepted}
            >
              <Plus className="h-3 w-3" />
              추가
            </Button>
          </div>
          {accepted.length > 0 && (
            <div className="space-y-1">
              {accepted.map((a, ai) => (
                <div key={ai} className="flex items-center gap-1">
                  <Input
                    value={a}
                    onChange={(e) => handleChangeAccepted(ai, e.target.value)}
                    className="h-7 text-xs flex-1"
                    placeholder="허용 답안 입력"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemoveAccepted(ai)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          {accepted.length === 0 && (
            <p className="text-xs text-muted-foreground">허용 답안이 없습니다. 정답만으로 채점됩니다.</p>
          )}
        </div>
      )}

      {/* 이미지 첨부 */}
      <div className="border-t pt-2 space-y-1.5">
        <Label className="text-xs">문제 이미지</Label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />
        {question.imageUrl ? (
          <div className="flex items-start gap-2">
            <img
              src={question.imageUrl}
              alt="문제 이미지"
              className="max-h-32 rounded border"
            />
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive h-7 w-7 p-0"
              onClick={() => onUpdate('imageUrl' as keyof GeneratedQuestion, '')}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <ImagePlus className="h-3 w-3" />}
            {uploading ? '업로드 중...' : '이미지 추가'}
          </Button>
        )}
      </div>

      <Button size="sm" variant="outline" onClick={onDone}>편집 완료</Button>
    </td>
  );
}

export function QuestionViewRow({
  question,
  onEdit,
  onDelete,
}: {
  question: GeneratedQuestion;
  onEdit: () => void;
  onDelete?: () => void;
}) {
  return (
    <>
      <td className="p-2">{question.number}</td>
      <td className="p-2 whitespace-pre-wrap break-words">
        <span>{question.question.replace(/\\n/g, '\n')}</span>
        {question.imageUrl && <ImageIcon className="inline-block ml-1 h-3.5 w-3.5 text-muted-foreground" />}
      </td>
      <td className="p-2">
        <Badge variant={hasOptions(question) ? 'outline' : 'secondary'} className="text-xs">
          {hasOptions(question) ? '객관식' : '서술형'}
        </Badge>
      </td>
      <td className="p-2 text-xs">{question.answer}</td>
      <td className="p-2">
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={onEdit}>수정</Button>
          {onDelete && (
            <Button size="sm" variant="ghost" onClick={onDelete} className="text-destructive hover:text-destructive">
              <XCircle className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
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
