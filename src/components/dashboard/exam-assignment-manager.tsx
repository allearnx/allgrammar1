'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { NaesinExamAssignment, NaesinUnit } from '@/types/database';
import { logger } from '@/lib/logger';

interface ExamAssignmentManagerProps {
  studentId: string;
  textbookId: string;
  units: Pick<NaesinUnit, 'id' | 'unit_number' | 'title'>[];
  assignments: NaesinExamAssignment[];
}

interface LocalAssignment {
  examRound: number;
  examLabel: string;
  examDate: string;
  unitIds: string[];
  dirty: boolean;
}

export function ExamAssignmentManager({
  studentId,
  textbookId,
  units,
  assignments: initialAssignments,
}: ExamAssignmentManagerProps) {
  const router = useRouter();
  const [locals, setLocals] = useState<LocalAssignment[]>(() =>
    initialAssignments.length > 0
      ? initialAssignments.map((a) => ({
          examRound: a.exam_round,
          examLabel: a.exam_label || '',
          examDate: a.exam_date || '',
          unitIds: a.unit_ids,
          dirty: false,
        }))
      : []
  );
  const [savingRound, setSavingRound] = useState<number | null>(null);
  const [deletingRound, setDeletingRound] = useState<number | null>(null);

  function addExam() {
    const nextRound = locals.length > 0 ? Math.max(...locals.map((l) => l.examRound)) + 1 : 1;
    setLocals([
      ...locals,
      { examRound: nextRound, examLabel: `${nextRound}차 시험`, examDate: '', unitIds: [], dirty: true },
    ]);
  }

  function updateLocal(idx: number, patch: Partial<LocalAssignment>) {
    setLocals((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch, dirty: true } : l)));
  }

  function toggleUnit(idx: number, unitId: string) {
    const current = locals[idx].unitIds;
    const next = current.includes(unitId) ? current.filter((id) => id !== unitId) : [...current, unitId];
    updateLocal(idx, { unitIds: next });
  }

  async function saveAssignment(idx: number) {
    const local = locals[idx];
    if (local.unitIds.length === 0) {
      toast.error('최소 1개의 단원을 선택하세요');
      return;
    }
    setSavingRound(local.examRound);
    try {
      const res = await fetch('/api/naesin/exam-assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          textbookId,
          examRound: local.examRound,
          examLabel: local.examLabel || null,
          examDate: local.examDate || null,
          unitIds: local.unitIds,
        }),
      });
      if (!res.ok) throw new Error('저장 실패');
      toast.success(`${local.examLabel || local.examRound + '차 시험'} 저장 완료`);
      setLocals((prev) => prev.map((l, i) => (i === idx ? { ...l, dirty: false } : l)));
      router.refresh();
    } catch (err) {
      logger.error('admin.exam_assignment', { error: err instanceof Error ? err.message : String(err) });
      toast.error('시험 배정 저장 중 오류가 발생했습니다');
    } finally {
      setSavingRound(null);
    }
  }

  async function deleteAssignment(idx: number) {
    const local = locals[idx];
    setDeletingRound(local.examRound);
    try {
      const res = await fetch('/api/naesin/exam-assignments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          textbookId,
          examRound: local.examRound,
        }),
      });
      if (!res.ok) throw new Error('삭제 실패');
      toast.success(`${local.examLabel || local.examRound + '차 시험'} 삭제 완료`);
      setLocals((prev) => prev.filter((_, i) => i !== idx));
      router.refresh();
    } catch (err) {
      logger.error('admin.exam_assignment', { error: err instanceof Error ? err.message : String(err) });
      toast.error('시험 배정 삭제 중 오류가 발생했습니다');
    } finally {
      setDeletingRound(null);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">시험 배정</CardTitle>
          <Button variant="outline" size="sm" onClick={addExam}>
            <Plus className="h-4 w-4 mr-1" />
            시험 추가
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {locals.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            배정된 시험이 없습니다. &quot;시험 추가&quot;를 눌러 시험을 배정하세요.
          </p>
        )}
        {locals.map((local, idx) => (
          <div key={local.examRound} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-1 space-y-2">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label className="text-xs">시험명</Label>
                    <Input
                      value={local.examLabel}
                      onChange={(e) => updateLocal(idx, { examLabel: e.target.value })}
                      placeholder="1차 시험"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="w-40">
                    <Label className="text-xs">시험일</Label>
                    <Input
                      type="date"
                      value={local.examDate}
                      onChange={(e) => updateLocal(idx, { examDate: e.target.value })}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <Label className="text-xs mb-2 block">단원 선택</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {units.map((unit) => (
                  <label
                    key={unit.id}
                    className="flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <Checkbox
                      checked={local.unitIds.includes(unit.id)}
                      onCheckedChange={() => toggleUnit(idx, unit.id)}
                    />
                    <span>Lesson {unit.unit_number}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => deleteAssignment(idx)}
                disabled={deletingRound === local.examRound}
                className="text-destructive hover:text-destructive"
              >
                {deletingRound === local.examRound ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-1" />
                )}
                삭제
              </Button>
              <Button
                size="sm"
                onClick={() => saveAssignment(idx)}
                disabled={savingRound === local.examRound || local.unitIds.length === 0}
              >
                {savingRound === local.examRound ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Save className="h-4 w-4 mr-1" />
                )}
                저장
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
