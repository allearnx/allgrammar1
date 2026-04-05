'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ClipboardList, ChevronDown, ChevronRight, Pencil, Trash2, Loader2, Wand2, Copy, Bookmark, BookmarkCheck, FolderSearch, ArrowUp, ArrowDown } from 'lucide-react';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import type { NaesinProblemSheet, NaesinProblemQuestion } from '@/types/naesin';
import { QuestionEditRow, QuestionViewRow } from './content-dialogs/question-table-rows';
import { hasOptions, type GeneratedQuestion } from './content-dialogs/question-utils';
import { AiProblemImproveDialog, CopyProblemDialog, TemplateCopiesDialog } from './content-dialogs';

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
  const pathname = usePathname();
  const isBoss = pathname.startsWith('/boss/');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingSheetId, setEditingSheetId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editQuestions, setEditQuestions] = useState<GeneratedQuestion[]>([]);
  const [editingQIdx, setEditingQIdx] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [improveSheetId, setImproveSheetId] = useState<string | null>(null);
  const [copySheetId, setCopySheetId] = useState<string | null>(null);
  const [copiesSheetId, setCopiesSheetId] = useState<string | null>(null);
  const [templateDialogId, setTemplateDialogId] = useState<string | null>(null);
  const [templateTopic, setTemplateTopic] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [reordering, setReordering] = useState(false);

  async function moveSheet(index: number, direction: 'up' | 'down') {
    const swapIdx = direction === 'up' ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= sheets.length) return;
    setReordering(true);
    try {
      const a = sheets[index];
      const b = sheets[swapIdx];
      const [aOrder, bOrder] = [a.sort_order, b.sort_order];
      // 같은 sort_order면 index 기반으로 구분
      const newAOrder = aOrder === bOrder ? (direction === 'up' ? aOrder - 1 : aOrder + 1) : bOrder;
      const newBOrder = aOrder === bOrder ? aOrder : aOrder;
      const [updA, updB] = await Promise.all([
        fetchWithToast<NaesinProblemSheet>('/api/naesin/problems', {
          method: 'PATCH', body: { id: a.id, sort_order: newAOrder },
          logContext: 'unit.reorder_sheet',
        }),
        fetchWithToast<NaesinProblemSheet>('/api/naesin/problems', {
          method: 'PATCH', body: { id: b.id, sort_order: newBOrder },
          logContext: 'unit.reorder_sheet',
        }),
      ]);
      onUpdate(updA);
      onUpdate(updB);
    } catch { /* */ } finally {
      setReordering(false);
    }
  }

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

  function deleteQuestion(idx: number) {
    setEditQuestions((prev) =>
      prev.filter((_, i) => i !== idx).map((q, i) => ({ ...q, number: i + 1 }))
    );
    setEditingQIdx(null);
  }

  function toggleQuestionType(idx: number) {
    setEditQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== idx) return q;
        // 객관식 → 단답형: options 제거, 정답 초기화
        if (q.options && q.options.length > 0) {
          return { ...q, options: null, answer: '' };
        }
        // 단답형 → 객관식: 5개 빈 선택지 추가
        return { ...q, options: ['', '', '', '', ''], answer: '' };
      })
    );
  }

  function openTemplateDialog(sheet: NaesinProblemSheet) {
    setTemplateDialogId(sheet.id);
    setTemplateTopic(sheet.template_topic || '');
  }

  async function toggleTemplate(sheetId: string, currentlyTemplate: boolean) {
    if (currentlyTemplate) {
      // 해제
      setSavingTemplate(true);
      try {
        const updated = await fetchWithToast<NaesinProblemSheet>('/api/naesin/problems', {
          method: 'PATCH',
          body: { id: sheetId, is_template: false, template_topic: null },
          successMessage: '템플릿 해제됨',
          errorMessage: '템플릿 해제 실패',
          logContext: 'unit.toggle_template',
        });
        onUpdate(updated);
      } catch { /* */ } finally {
        setSavingTemplate(false);
      }
    } else {
      openTemplateDialog(sheets.find((s) => s.id === sheetId)!);
    }
  }

  async function saveTemplate() {
    if (!templateDialogId || !templateTopic.trim()) return;
    setSavingTemplate(true);
    try {
      const updated = await fetchWithToast<NaesinProblemSheet>('/api/naesin/problems', {
        method: 'PATCH',
        body: { id: templateDialogId, is_template: true, template_topic: templateTopic.trim() },
        successMessage: '템플릿으로 저장됨',
        errorMessage: '템플릿 저장 실패',
        logContext: 'unit.save_template',
      });
      onUpdate(updated);
      setTemplateDialogId(null);
      setTemplateTopic('');
    } catch { /* */ } finally {
      setSavingTemplate(false);
    }
  }

  async function saveEdit() {
    if (!editingSheetId || !editTitle.trim()) return;
    setSaving(true);
    try {
      const questions = editQuestions.map(toDbQuestion);
      const answerKey = editQuestions.map((q) => q.answer);
      const updated = await fetchWithToast<NaesinProblemSheet>('/api/naesin/problems', {
        method: 'PATCH',
        body: { id: editingSheetId, title: editTitle.trim(), questions, answer_key: answerKey },
        successMessage: '문제 시트가 수정되었습니다',
        errorMessage: '문제 시트 수정 중 오류가 발생했습니다',
        logContext: 'unit.save_problem_sheet',
      });
      onUpdate(updated);
      cancelEdit();
    } catch { /* fetchWithToast handles toasts/logging */ } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-1 rounded-lg border p-2">
      {sheets.map((sheet, sheetIdx) => {
        const isExpanded = expandedId === sheet.id;
        const isEditing = editingSheetId === sheet.id;
        const questions: NaesinProblemQuestion[] = sheet.questions || [];
        const mcqCount = questions.filter((q) => q.options && q.options.length > 0).length;
        const subCount = questions.length - mcqCount;

        return (
          <div key={sheet.id} className="rounded hover:bg-muted/50">
            <div
              className="flex items-center gap-2 py-1.5 px-2 group cursor-pointer"
              onClick={() => { if (!isEditing) setExpandedId(isExpanded ? null : sheet.id); }}
            >
              <div className="flex flex-col opacity-0 group-hover:opacity-100 shrink-0">
                <button
                  className="p-0 h-3 text-muted-foreground hover:text-foreground disabled:opacity-30"
                  disabled={sheetIdx === 0 || reordering}
                  onClick={(e) => { e.stopPropagation(); moveSheet(sheetIdx, 'up'); }}
                  aria-label="위로"
                >
                  <ArrowUp className="h-3 w-3" />
                </button>
                <button
                  className="p-0 h-3 text-muted-foreground hover:text-foreground disabled:opacity-30"
                  disabled={sheetIdx === sheets.length - 1 || reordering}
                  onClick={(e) => { e.stopPropagation(); moveSheet(sheetIdx, 'down'); }}
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
                onClick={(e) => { e.stopPropagation(); isEditing ? cancelEdit() : startEdit(sheet); }}
                aria-label="수정"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100"
                onClick={(e) => { e.stopPropagation(); setCopySheetId(sheet.id); }}
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
                  onClick={(e) => { e.stopPropagation(); toggleTemplate(sheet.id, !!sheet.is_template); }}
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
                  onClick={(e) => { e.stopPropagation(); setCopiesSheetId(sheet.id); }}
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
                onClick={(e) => { e.stopPropagation(); setImproveSheetId(sheet.id); }}
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
                              onToggleType={() => toggleQuestionType(i)}
                              onDone={() => setEditingQIdx(null)}
                            />
                          ) : (
                            <QuestionViewRow
                              question={q}
                              onEdit={() => {
                              if (!isEditing) startEdit(sheet);
                              setEditingQIdx(i);
                            }}
                              onDelete={isEditing ? () => deleteQuestion(i) : undefined}
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

      {improveSheetId && sheets.find((s) => s.id === improveSheetId) && (
        <AiProblemImproveDialog
          sheet={sheets.find((s) => s.id === improveSheetId)!}
          open={true}
          onOpenChange={(v) => { if (!v) setImproveSheetId(null); }}
          onUpdate={onUpdate}
        />
      )}

      {copySheetId && sheets.find((s) => s.id === copySheetId) && (
        <CopyProblemDialog
          sheet={sheets.find((s) => s.id === copySheetId)!}
          open={true}
          onOpenChange={(v) => { if (!v) setCopySheetId(null); }}
        />
      )}

      {copiesSheetId && sheets.find((s) => s.id === copiesSheetId) && (
        <TemplateCopiesDialog
          sheet={sheets.find((s) => s.id === copiesSheetId)!}
          open={true}
          onOpenChange={(v) => { if (!v) setCopiesSheetId(null); }}
        />
      )}

      <Dialog open={templateDialogId !== null} onOpenChange={(v) => { if (!v) { setTemplateDialogId(null); setTemplateTopic(''); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>템플릿 주제 입력</DialogTitle>
          </DialogHeader>
          <Input
            className="h-9"
            value={templateTopic}
            onChange={(e) => setTemplateTopic(e.target.value)}
            placeholder="예: to부정사, 사역동사, 관계대명사"
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => { setTemplateDialogId(null); setTemplateTopic(''); }}>취소</Button>
            <Button size="sm" onClick={saveTemplate} disabled={savingTemplate || !templateTopic.trim()}>
              {savingTemplate && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
