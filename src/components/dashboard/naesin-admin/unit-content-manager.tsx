'use client';

import { Button } from '@/components/ui/button';
import {
  BookOpen,
  FileText,
  MessageSquare,
  GraduationCap,
  ClipboardList,
  Brain,
  PlayCircle,
  FileQuestion,
} from 'lucide-react';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { AddVocabDialog, BulkVocabUpload, PdfVocabExtract } from './vocab-dialogs';
import { AddPassageDialog, AddDialogueDialog, AddGrammarDialog, AddOmrDialog, AddProblemDialog, AddLastReviewDialog, BulkOmrUploadDialog, BulkProblemUploadDialog, PdfProblemExtractDialog, AddTextbookVideoDialog, AddMockExamDialog, AiProblemGenerateDialog } from './content-dialogs';
import { VocabQuizSetManager } from './quiz-set-manager';
import { UnitVocabList } from './unit-vocab-list';
import { UnitPassageList } from './unit-passage-list';
import { UnitGrammarList } from './unit-grammar-list';
import { UnitDialogueList } from './unit-dialogue-list';
import { UnitProblemList } from './unit-problem-list';
import { makeUpdateHandler } from '@/lib/naesin/make-update-handler';
import { ContentSectionGrid, type ContentSection } from './content-section-grid';
import { useUnitContentData } from './use-unit-content-data';

export function UnitContentManager({ unitId }: { unitId: string }) {
  const {
    vocab, vocabEdit, vocabDelete,
    cm, dispatchCM,
    passageList, setPassageList, passageDelete,
    dialogueList, setDialogueList, dialogueDelete,
    grammarList, grammarEdit, grammarDelete,
    problemList, setProblemList, problemDelete,
    textbookVideoList, textbookVideoDelete,
    mockExamList, setMockExamList, mockExamDelete,
    refresh,
    regenerateGrammarVocab,
  } = useUnitContentData(unitId);

  const onUpdatePassage = makeUpdateHandler(setPassageList);
  const onUpdateDialogue = makeUpdateHandler(setDialogueList);
  const onUpdateProblem = makeUpdateHandler(setProblemList);
  const onUpdateMockExam = makeUpdateHandler(setMockExamList);

  const sections: ContentSection[] = [
    { label: '단어', icon: BookOpen, count: vocab.items.length, color: 'text-blue-500', toggle: () => dispatchCM({ type: 'TOGGLE_SECTION', section: 'vocab' }), expanded: cm.showVocabList },
    { label: '교과서 지문', icon: FileText, count: passageList.length, color: 'text-orange-500', toggle: () => dispatchCM({ type: 'TOGGLE_SECTION', section: 'passage' }), expanded: cm.showPassageList },
    { label: '대화문', icon: MessageSquare, count: dialogueList.length, color: 'text-violet-500', toggle: () => dispatchCM({ type: 'TOGGLE_SECTION', section: 'dialogue' }), expanded: cm.showDialogueList },
    { label: '본문 설명 영상', icon: PlayCircle, count: textbookVideoList.length, color: 'text-cyan-500', toggle: () => dispatchCM({ type: 'TOGGLE_SECTION', section: 'textbookVideo' }), expanded: cm.showTextbookVideoList },
    { label: '문법 설명', icon: GraduationCap, count: grammarList.length, color: 'text-green-500', toggle: () => dispatchCM({ type: 'TOGGLE_SECTION', section: 'grammar' }), expanded: cm.showGrammarList },
    { label: 'OMR 시트', icon: ClipboardList, count: cm.omrCount, color: 'text-indigo-500' },
    { label: '문제풀이', icon: ClipboardList, count: problemList.length, color: 'text-red-500', toggle: () => dispatchCM({ type: 'TOGGLE_SECTION', section: 'problem' }), expanded: cm.showProblemList },
    { label: '예상문제', icon: FileQuestion, count: mockExamList.length, color: 'text-pink-500', toggle: () => dispatchCM({ type: 'TOGGLE_SECTION', section: 'mockExam' }), expanded: cm.showMockExamList },
    { label: '직전보강', icon: Brain, count: cm.lastReviewCount, color: 'text-amber-500' },
  ];

  return (
    <div className="mt-4 space-y-3 border-t pt-3">
      <ContentSectionGrid sections={sections} />

      {cm.showVocabList && vocab.items.length > 0 && (
        <UnitVocabList
          unitId={unitId}
          items={vocab.items}
          selectedIds={vocab.selectedIds}
          toggleSelectAll={vocab.toggleSelectAll}
          toggleSelect={vocab.toggleSelect}
          deleting={vocab.deleting}
          setSelectedIds={(ids) => vocab.setSelectedIds(ids)}
          editingId={vocabEdit.editingId}
          editForm={vocabEdit.editForm}
          setEditForm={vocabEdit.setEditForm}
          startEdit={vocabEdit.startEdit}
          cancelEdit={vocabEdit.cancelEdit}
          saveEdit={vocabEdit.saveEdit}
          onRequestDelete={vocabDelete.requestDelete}
          onBulkDeleteOpen={() => dispatchCM({ type: 'SET_BULK_DELETE_OPEN', open: true })}
        />
      )}

      <VocabQuizSetManager unitId={unitId} />

      {cm.showPassageList && passageList.length > 0 && (
        <UnitPassageList
          passages={passageList}
          regeneratingGV={cm.regeneratingGV}
          onUpdate={onUpdatePassage}
          onRequestDelete={passageDelete.requestDelete}
          onRegenerateGrammarVocab={regenerateGrammarVocab}
        />
      )}

      {cm.showDialogueList && dialogueList.length > 0 && (
        <UnitDialogueList
          dialogues={dialogueList}
          onUpdate={onUpdateDialogue}
          onRequestDelete={dialogueDelete.requestDelete}
        />
      )}

      {cm.showGrammarList && grammarList.length > 0 && (
        <UnitGrammarList
          lessons={grammarList}
          editingId={grammarEdit.editingId}
          editForm={grammarEdit.editForm}
          setEditForm={grammarEdit.setEditForm}
          startEdit={grammarEdit.startEdit}
          cancelEdit={grammarEdit.cancelEdit}
          saveEdit={grammarEdit.saveEdit}
          onRequestDelete={grammarDelete.requestDelete}
        />
      )}

      {cm.showTextbookVideoList && textbookVideoList.length > 0 && (
        <div className="space-y-1 rounded-lg border p-3">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">본문 설명 영상 목록</h4>
          {textbookVideoList.map((v) => (
            <div key={v.id} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50">
              <div className="flex items-center gap-2 min-w-0">
                <PlayCircle className="h-4 w-4 text-cyan-500 shrink-0" />
                <span className="text-sm truncate">{v.title}</span>
                {v.youtube_video_id && <span className="text-xs text-gray-400">{v.youtube_video_id}</span>}
              </div>
              <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700 h-7 px-2" onClick={() => textbookVideoDelete.requestDelete(v.id)}>
                삭제
              </Button>
            </div>
          ))}
        </div>
      )}

      {cm.showProblemList && problemList.length > 0 && (
        <UnitProblemList
          sheets={problemList}
          onUpdate={onUpdateProblem}
          onRequestDelete={problemDelete.requestDelete}
        />
      )}

      {cm.showMockExamList && mockExamList.length > 0 && (
        <UnitProblemList
          sheets={mockExamList}
          onUpdate={onUpdateMockExam}
          onRequestDelete={mockExamDelete.requestDelete}
        />
      )}

      <div className="flex flex-wrap gap-2">
        <AddVocabDialog module="naesin" parentId={unitId} onAdd={refresh} />
        <BulkVocabUpload module="naesin" parentId={unitId} onAdd={refresh} />
        <PdfVocabExtract module="naesin" parentId={unitId} onAdd={refresh} />
        <AddPassageDialog unitId={unitId} onAdd={refresh} />
        <AddDialogueDialog unitId={unitId} onAdd={refresh} />
        <AddGrammarDialog unitId={unitId} onAdd={refresh} />
        <AddOmrDialog unitId={unitId} onAdd={refresh} />
        <AddTextbookVideoDialog unitId={unitId} onAdd={refresh} />
        <AddProblemDialog unitId={unitId} onAdd={refresh} />
        <AddMockExamDialog unitId={unitId} onAdd={refresh} />
        <BulkOmrUploadDialog unitId={unitId} onAdd={refresh} />
        <BulkProblemUploadDialog unitId={unitId} onAdd={refresh} />
        <PdfProblemExtractDialog unitId={unitId} onAdd={refresh} />
        <AiProblemGenerateDialog unitId={unitId} onAdd={refresh} />
        <AddLastReviewDialog unitId={unitId} onAdd={refresh} />
      </div>

      <ConfirmDialog
        description="이 단어를 삭제하시겠습니까?"
        {...vocabDelete.confirmDialogProps}
      />

      <ConfirmDialog
        open={cm.bulkDeleteOpen}
        onOpenChange={(open) => dispatchCM({ type: 'SET_BULK_DELETE_OPEN', open })}
        description={`선택한 ${vocab.selectedIds.size}개 단어를 삭제하시겠습니까?`}
        onConfirm={() => {
          dispatchCM({ type: 'SET_BULK_DELETE_OPEN', open: false });
          vocab.handleBulkDelete();
        }}
      />

      <ConfirmDialog
        description="이 지문을 삭제하시겠습니까? 관련된 빈칸/배열/영작 데이터도 함께 삭제됩니다."
        {...passageDelete.confirmDialogProps}
      />

      <ConfirmDialog
        description="이 대화문을 삭제하시겠습니까?"
        {...dialogueDelete.confirmDialogProps}
      />

      <ConfirmDialog
        description="이 문법 설명을 삭제하시겠습니까?"
        {...grammarDelete.confirmDialogProps}
      />

      <ConfirmDialog
        description="이 문제 시트를 삭제하시겠습니까? 관련된 학생 답안도 함께 삭제됩니다."
        {...problemDelete.confirmDialogProps}
      />

      <ConfirmDialog
        description="이 설명 영상을 삭제하시겠습니까?"
        {...textbookVideoDelete.confirmDialogProps}
      />

      <ConfirmDialog
        description="이 예상문제 시트를 삭제하시겠습니까? 관련된 학생 답안도 함께 삭제됩니다."
        {...mockExamDelete.confirmDialogProps}
      />
    </div>
  );
}
