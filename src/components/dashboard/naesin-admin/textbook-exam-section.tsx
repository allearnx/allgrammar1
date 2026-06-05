'use client';

import { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { FileQuestion } from 'lucide-react';
import { toast } from 'sonner';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { AddMockExamDialog } from './content-dialogs';
import { UnitProblemList } from './unit-problem-list';
import type { NaesinProblemSheet } from '@/types/naesin';

interface TextbookExamSectionProps {
  textbookId: string;
  textbookName: string;
  canManageContent?: boolean;
}

export function TextbookExamSection({ textbookId, textbookName, canManageContent = false }: TextbookExamSectionProps) {
  const [sheets, setSheets] = useState<NaesinProblemSheet[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loadingSheetId, setLoadingSheetId] = useState<string | null>(null);

  const loadFullSheet = useCallback(async (sheetId: string): Promise<NaesinProblemSheet | null> => {
    const existing = sheets.find(s => s.id === sheetId);
    if (existing?.questions) return existing;
    setLoadingSheetId(sheetId);
    try {
      const res = await fetch(`/api/naesin/problems/sheet?id=${sheetId}`);
      if (!res.ok) return null;
      const full: NaesinProblemSheet = await res.json();
      setSheets(prev => prev.map(s => s.id === sheetId ? full : s));
      return full;
    } catch { return null; } finally {
      setLoadingSheetId(null);
    }
  }, [sheets]);

  const loadSheets = useCallback(async () => {
    try {
      const res = await fetch(`/api/naesin/problems?textbookId=${textbookId}&category=mock_exam`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSheets(data);
    } catch {
      toast.error('시험 대비 목록을 불러오지 못했습니다');
    }
  }, [textbookId]);

  useEffect(() => { loadSheets(); }, [loadSheets]);

  const onUpdate = (updated: NaesinProblemSheet) =>
    setSheets((prev) => prev.map((s) => (s.id === updated.id ? updated : s)).sort((a, b) => a.sort_order - b.sort_order));

  return (
    <div className="space-y-4 pt-4 border-t">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileQuestion className="h-5 w-5 text-pink-500" />
          <h3 className="text-lg font-semibold">시험 대비</h3>
          {sheets.length > 0 && (
            <Badge variant="secondary">{sheets.length}개</Badge>
          )}
        </div>
        {canManageContent && (
          <AddMockExamDialog textbookId={textbookId} onAdd={loadSheets} />
        )}
      </div>

      {sheets.length === 0 ? (
        <p className="text-center text-muted-foreground py-4 text-sm">
          {canManageContent ? '등록된 시험이 없습니다. 시험을 추가해주세요.' : '등록된 시험이 없습니다.'}
        </p>
      ) : canManageContent ? (
        <UnitProblemList
          sheets={sheets}
          onUpdate={onUpdate}
          onRequestDelete={setDeleteId}
          loadFullSheet={loadFullSheet}
          loadingSheetId={loadingSheetId}
        />
      ) : (
        <div className="space-y-1 rounded-lg border p-3">
          {sheets.map((s) => (
            <div key={s.id} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50">
              <span className="text-sm">{s.title}</span>
              <Badge variant="outline" className="text-xs">{(s.questions as unknown[])?.length || s.answer_key?.length || 0}문제</Badge>
            </div>
          ))}
        </div>
      )}

      {canManageContent && (
        <ConfirmDialog
          open={deleteId !== null}
          onOpenChange={(open) => { if (!open) setDeleteId(null); }}
          description="이 시험 시트를 삭제하시겠습니까? 관련된 학생 답안도 함께 삭제됩니다."
          onConfirm={async () => {
            const id = deleteId;
            setDeleteId(null);
            if (!id) return;
            try {
              await fetchWithToast('/api/naesin/problems', {
                method: 'DELETE',
                body: { id },
                successMessage: '시험이 삭제되었습니다',
                errorMessage: '시험 삭제 실패',
              });
              setSheets((prev) => prev.filter((s) => s.id !== id));
            } catch {
              // fetchWithToast handles toast
            }
          }}
        />
      )}
    </div>
  );
}
