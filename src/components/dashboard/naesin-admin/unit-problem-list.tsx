'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import type { NaesinProblemSheet, NaesinTemplate } from '@/types/naesin';
import { toGenerated, toDbQuestion } from './content-dialogs/shared/question-utils';
import { AiProblemImproveDialog, CopyProblemDialog, TemplateCopiesDialog } from './content-dialogs';
import { useQuestionEditor } from '@/hooks/use-question-editor';
import { ProblemSheetItem } from './problem-sheet-item';

interface UnitProblemListProps {
  sheets: NaesinProblemSheet[];
  onUpdate: (updated: NaesinProblemSheet) => void;
  onRequestDelete: (id: string) => void;
  loadFullSheet?: (id: string) => Promise<NaesinProblemSheet | null>;
  loadingSheetId?: string | null;
}

export function UnitProblemList({ sheets, onUpdate, onRequestDelete, loadFullSheet, loadingSheetId }: UnitProblemListProps) {
  const pathname = usePathname();
  const isBoss = pathname.startsWith('/boss/');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingSheetId, setEditingSheetId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const editor = useQuestionEditor();
  const [saving, setSaving] = useState(false);
  const [improveSheetId, setImproveSheetId] = useState<string | null>(null);
  const [copySheetId, setCopySheetId] = useState<string | null>(null);
  const [copiesTemplateId, setCopiesTemplateId] = useState<string | null>(null);
  const [copiesTemplateTitle, setCopiesTemplateTitle] = useState('');
  const [templateDialogId, setTemplateDialogId] = useState<string | null>(null);
  const [templateTopic, setTemplateTopic] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [regradingId, setRegradingId] = useState<string | null>(null);

  async function moveSheet(index: number, direction: 'up' | 'down') {
    const swapIdx = direction === 'up' ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= sheets.length) return;
    setReordering(true);
    try {
      // Normalize all sort_orders to sequential indices, with swap applied
      const batch: { id: string; sort_order: number }[] = [];
      sheets.forEach((s, i) => {
        const target = i === index ? swapIdx : i === swapIdx ? index : i;
        if (s.sort_order !== target) batch.push({ id: s.id, sort_order: target });
      });
      const results = await Promise.all(
        batch.map(({ id, sort_order }) =>
          fetchWithToast<NaesinProblemSheet>('/api/naesin/problems', {
            method: 'PATCH', body: { id, sort_order },
            logContext: 'unit.reorder_sheet',
          })
        )
      );
      results.forEach(onUpdate);
    } catch { /* */ } finally {
      setReordering(false);
    }
  }

  async function handleToggleExpand(sheetId: string) {
    if (expandedId === sheetId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(sheetId);
    const sheet = sheets.find(s => s.id === sheetId);
    if (sheet && !sheet.questions && loadFullSheet) {
      await loadFullSheet(sheetId);
    }
  }

  async function startEdit(sheet: NaesinProblemSheet) {
    // Ensure full data is loaded before editing
    let fullSheet = sheet;
    if (!sheet.questions && loadFullSheet) {
      const loaded = await loadFullSheet(sheet.id);
      if (loaded) fullSheet = loaded;
    }
    setEditingSheetId(fullSheet.id);
    setEditTitle(fullSheet.title);
    editor.setQuestions((fullSheet.questions || []).map(toGenerated));
    editor.setEditingIdx(null);
    if (expandedId !== fullSheet.id) setExpandedId(fullSheet.id);
  }

  function cancelEdit() {
    setEditingSheetId(null);
    setEditTitle('');
    editor.setQuestions([]);
    editor.setEditingIdx(null);
  }

  function handleSaveTemplate(sheetId: string) {
    const sheet = sheets.find((s) => s.id === sheetId)!;
    setTemplateDialogId(sheet.id);
    setTemplateTopic(sheet.template_topic || '');
  }

  async function saveTemplate() {
    if (!templateDialogId || !templateTopic.trim()) return;
    let sheet = sheets.find((s) => s.id === templateDialogId);
    if (!sheet) return;
    // Ensure full data is loaded for template
    if (!sheet.questions && loadFullSheet) {
      const loaded = await loadFullSheet(sheet.id);
      if (loaded) sheet = loaded;
    }
    setSavingTemplate(true);
    try {
      await fetchWithToast<NaesinTemplate>('/api/naesin/templates', {
        method: 'POST',
        body: {
          title: sheet.title,
          templateTopic: templateTopic.trim(),
          questions: sheet.questions || [],
          answerKey: sheet.answer_key || [],
          category: sheet.category || 'problem',
          mode: sheet.mode || 'interactive',
        },
        successMessage: '템플릿으로 저장됨',
        errorMessage: '템플릿 저장 실패',
        logContext: 'unit.save_template',
      });
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
      const questions = editor.questions.map(toDbQuestion);
      const answerKey = editor.questions.map((q) => q.answer);
      const updated = await fetchWithToast<NaesinProblemSheet & {
        templateSync?: { templateSynced: boolean; copiesSynced: number };
        aiWarnings?: { questionNumber: number; aiAnswer: string | number; expectedAnswer: string | number; reason?: string }[];
      }>('/api/naesin/problems', {
        method: 'PATCH',
        body: { id: editingSheetId, title: editTitle.trim(), questions, answer_key: answerKey },
        successMessage: '문제 시트가 수정되었습니다',
        errorMessage: '문제 시트 수정 중 오류가 발생했습니다',
        logContext: 'unit.save_problem_sheet',
      });

      // 템플릿 동기화 알림
      if (updated.templateSync?.copiesSynced) {
        toast.success(`템플릿 + 복사본 ${updated.templateSync.copiesSynced}개 자동 동기화됨`);
      } else if (updated.templateSync?.templateSynced) {
        toast.success('원본 템플릿 자동 동기화됨');
      }

      // AI 오답 의심 경고
      if (updated.aiWarnings && updated.aiWarnings.length > 0) {
        const desc = updated.aiWarnings.map((w) =>
          `Q${w.questionNumber}: AI정답 "${w.aiAnswer}" ≠ 등록정답 "${w.expectedAnswer}"${w.reason ? ` (${w.reason})` : ''}`,
        ).join('\n');
        toast.warning(`AI 오답 의심 ${updated.aiWarnings.length}건`, {
          description: desc,
          duration: 10000,
        });
      }

      onUpdate(updated);
      cancelEdit();
    } catch { /* fetchWithToast handles toasts/logging */ } finally {
      setSaving(false);
    }
  }

  async function regrade(sheetId: string) {
    setRegradingId(sheetId);
    try {
      const result = await fetchWithToast<{ total: number; changed: number }>('/api/naesin/problems/regrade', {
        method: 'POST',
        body: { sheetId },
        errorMessage: '재채점 실패',
        logContext: 'unit.regrade_sheet',
      });
      toast.success(
        result.changed > 0
          ? `${result.total}개 시도 중 ${result.changed}개 점수 변경`
          : '변경된 시도 없음',
      );
    } catch { /* fetchWithToast handles error toasts */ } finally {
      setRegradingId(null);
    }
  }

  return (
    <div className="space-y-1 rounded-lg border p-2">
      {sheets.map((sheet, sheetIdx) => (
        <ProblemSheetItem
          key={sheet.id}
          sheet={sheet}
          isLoadingFull={loadingSheetId === sheet.id}
          sheetIdx={sheetIdx}
          sheetsLength={sheets.length}
          isExpanded={expandedId === sheet.id}
          isEditing={editingSheetId === sheet.id}
          isBoss={isBoss}
          reordering={reordering}
          savingTemplate={savingTemplate}
          saving={saving}
          editTitle={editTitle}
          editQuestions={editor.questions}
          editingIdx={editor.editingIdx}
          onToggleExpand={() => handleToggleExpand(sheet.id)}
          onSetEditTitle={setEditTitle}
          onStartEdit={() => startEdit(sheet)}
          onCancelEdit={cancelEdit}
          onSaveEdit={saveEdit}
          onMoveSheet={moveSheet}
          onSaveTemplate={handleSaveTemplate}
          onCopy={async (id) => { if (loadFullSheet) await loadFullSheet(id); setCopySheetId(id); }}
          onCopies={(templateId, title) => { setCopiesTemplateId(templateId); setCopiesTemplateTitle(title); }}
          onImprove={async (id) => { if (loadFullSheet) await loadFullSheet(id); setImproveSheetId(id); }}
          onRequestDelete={onRequestDelete}
          onEditQuestion={(field, idx, value) => editor.updateQuestion(idx, field, value)}
          onEditOption={editor.updateOption}
          onToggleQuestionType={editor.toggleQuestionType}
          onDoneEditing={() => editor.setEditingIdx(null)}
          onSetEditingIdx={editor.setEditingIdx}
          onDeleteQuestion={editor.deleteQuestion}
          onUpdateAcceptedAnswers={editor.updateAcceptedAnswers}
          onGenerateAcceptedAnswers={editor.generateAcceptedAnswers}
          onRegrade={regrade}
          regrading={regradingId === sheet.id}
        />
      ))}

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

      {copiesTemplateId && (
        <TemplateCopiesDialog
          templateId={copiesTemplateId}
          templateTitle={copiesTemplateTitle}
          open={true}
          onOpenChange={(v) => { if (!v) { setCopiesTemplateId(null); setCopiesTemplateTitle(''); } }}
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
