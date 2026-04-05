import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, ChevronDown, ChevronRight, Pencil, Trash2, Loader2, Wand2, Copy, Bookmark, BookmarkCheck, FolderSearch, ArrowUp, ArrowDown } from 'lucide-react';
import type { NaesinProblemSheet, NaesinProblemQuestion } from '@/types/naesin';
import { QuestionEditRow, QuestionViewRow } from './content-dialogs/question-table-rows';
import { toGenerated, type GeneratedQuestion } from './content-dialogs/question-utils';

interface ProblemSheetItemProps {
  sheet: NaesinProblemSheet;
  sheetIdx: number;
  sheetsLength: number;
  isExpanded: boolean;
  isEditing: boolean;
  isBoss: boolean;
  reordering: boolean;
  savingTemplate: boolean;
  saving: boolean;
  editTitle: string;
  editQuestions: GeneratedQuestion[];
  editingIdx: number | null;
  onToggleExpand: () => void;
  onSetEditTitle: (v: string) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onMoveSheet: (index: number, direction: 'up' | 'down') => void;
  onToggleTemplate: (sheetId: string, isTemplate: boolean) => void;
  onCopy: (sheetId: string) => void;
  onCopies: (sheetId: string) => void;
  onImprove: (sheetId: string) => void;
  onRequestDelete: (sheetId: string) => void;
  onEditQuestion: (field: keyof GeneratedQuestion, idx: number, value: string) => void;
  onEditOption: (qIdx: number, optIdx: number, value: string) => void;
  onToggleQuestionType: (idx: number) => void;
  onDoneEditing: () => void;
  onSetEditingIdx: (idx: number) => void;
  onDeleteQuestion: (idx: number) => void;
}

export function ProblemSheetItem({
  sheet,
  sheetIdx,
  sheetsLength,
  isExpanded,
  isEditing,
  isBoss,
  reordering,
  savingTemplate,
  saving,
  editTitle,
  editQuestions,
  editingIdx,
  onToggleExpand,
  onSetEditTitle,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onMoveSheet,
  onToggleTemplate,
  onCopy,
  onCopies,
  onImprove,
  onRequestDelete,
  onEditQuestion,
  onEditOption,
  onToggleQuestionType,
  onDoneEditing,
  onSetEditingIdx,
  onDeleteQuestion,
}: ProblemSheetItemProps) {
  const questions: NaesinProblemQuestion[] = sheet.questions || [];
  const mcqCount = questions.filter((q) => q.options && q.options.length > 0).length;
  const subCount = questions.length - mcqCount;

  return (
    <div className="rounded hover:bg-muted/50">
      <div
        className="flex items-center gap-2 py-1.5 px-2 group cursor-pointer"
        onClick={() => { if (!isEditing) onToggleExpand(); }}
      >
        <div className="flex flex-col opacity-0 group-hover:opacity-100 shrink-0">
          <button
            className="p-0 h-3 text-muted-foreground hover:text-foreground disabled:opacity-30"
            disabled={sheetIdx === 0 || reordering}
            onClick={(e) => { e.stopPropagation(); onMoveSheet(sheetIdx, 'up'); }}
            aria-label="위로"
          >
            <ArrowUp className="h-3 w-3" />
          </button>
          <button
            className="p-0 h-3 text-muted-foreground hover:text-foreground disabled:opacity-30"
            disabled={sheetIdx === sheetsLength - 1 || reordering}
            onClick={(e) => { e.stopPropagation(); onMoveSheet(sheetIdx, 'down'); }}
            aria-label="아래로"
          >
            <ArrowDown className="h-3 w-3" />
          </button>
        </div>
        {isExpanded ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />}
        <ClipboardList className="h-3.5 w-3.5 text-red-500 shrink-0" />
        <span className="text-sm flex-1 truncate">{sheet.title}</span>
        <Badge variant="secondary" className="text-[11px]">{questions.length}문제</Badge>
        {mcqCount > 0 && <Badge variant="outline" className="text-[11px]">객관식 {mcqCount}</Badge>}
        {subCount > 0 && <Badge variant="outline" className="text-[11px]">서술형 {subCount}</Badge>}
        {sheet.is_template && <Badge className="text-[10px] bg-amber-100 text-amber-700 hover:bg-amber-100">템플릿</Badge>}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100"
          onClick={(e) => { e.stopPropagation(); isEditing ? onCancelEdit() : onStartEdit(); }}
          aria-label="수정"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100"
          onClick={(e) => { e.stopPropagation(); onCopy(sheet.id); }}
          aria-label="복사"
          title="다른 단원에 복사"
        >
          <Copy className="h-3.5 w-3.5 text-blue-500" />
        </Button>
        {isBoss && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100"
            onClick={(e) => { e.stopPropagation(); onToggleTemplate(sheet.id, !!sheet.is_template); }}
            disabled={savingTemplate}
            aria-label={sheet.is_template ? '템플릿 해제' : '템플릿 저장'}
            title={sheet.is_template ? '템플릿 해제' : '템플릿으로 저장'}
          >
            {sheet.is_template
              ? <BookmarkCheck className="h-3.5 w-3.5 text-amber-500" />
              : <Bookmark className="h-3.5 w-3.5 text-amber-500" />}
          </Button>
        )}
        {isBoss && sheet.is_template && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100"
            onClick={(e) => { e.stopPropagation(); onCopies(sheet.id); }}
            aria-label="복사본 관리"
            title="복사본 관리"
          >
            <FolderSearch className="h-3.5 w-3.5 text-emerald-500" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100"
          onClick={(e) => { e.stopPropagation(); onImprove(sheet.id); }}
          aria-label="AI 개선"
          title="AI 개선"
        >
          <Wand2 className="h-3.5 w-3.5 text-violet-500" />
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
                onChange={(e) => onSetEditTitle(e.target.value)}
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
                    {isEditing && editingIdx === i ? (
                      <QuestionEditRow
                        question={q}
                        onUpdate={(field, value) => onEditQuestion(field, i, value)}
                        onUpdateOption={(optIdx, value) => onEditOption(i, optIdx, value)}
                        onToggleType={() => onToggleQuestionType(i)}
                        onDone={onDoneEditing}
                      />
                    ) : (
                      <QuestionViewRow
                        question={q}
                        onEdit={() => {
                          if (!isEditing) onStartEdit();
                          onSetEditingIdx(i);
                        }}
                        onDelete={isEditing ? () => onDeleteQuestion(i) : undefined}
                      />
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {isEditing && (
            <div className="flex gap-2 justify-end mt-2">
              <Button size="sm" variant="outline" className="h-7" onClick={onCancelEdit}>취소</Button>
              <Button size="sm" className="h-7" onClick={onSaveEdit} disabled={saving || !editTitle.trim()}>
                {saving && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
                저장
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
