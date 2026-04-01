'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import type { NaesinUnit } from '@/types/database';
import { UnitContentManager } from './unit-content-manager';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { fetchWithToast } from '@/lib/fetch-with-toast';

export const UNIT_OPTIONS = [
  { value: '1', label: 'Lesson 1' },
  { value: '2', label: 'Lesson 2' },
  { value: '3', label: 'Lesson 3' },
  { value: '4', label: 'Lesson 4' },
  { value: '5', label: 'Lesson 5' },
  { value: '6', label: 'Lesson 6' },
  { value: '7', label: 'Lesson 7' },
  { value: '8', label: 'Lesson 8' },
  { value: '9', label: 'Special Lesson' },
];

export function AddUnitDialog({ textbookId, onAdd }: { textbookId: string; onAdd: (unit: NaesinUnit) => void }) {
  const [open, setOpen] = useState(false);
  const [unitValue, setUnitValue] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!unitValue) return;
    setSaving(true);
    try {
      const selected = UNIT_OPTIONS.find((o) => o.value === unitValue);
      const data = await fetchWithToast<NaesinUnit>('/api/naesin/units', {
        body: {
          textbook_id: textbookId,
          unit_number: Number(unitValue),
          title: selected?.label || `Lesson ${unitValue}`,
          sort_order: Number(unitValue),
        },
        successMessage: '단원이 추가되었습니다',
        errorMessage: '단원 추가 중 오류가 발생했습니다',
        logContext: 'admin.unit_section',
      });
      onAdd(data);
      setOpen(false);
      setUnitValue('');
    } catch {
      // fetchWithToast already handles toast + logging
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" />
          단원 추가
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>단원 추가</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>단원 선택</Label>
            <Select value={unitValue} onValueChange={setUnitValue}>
              <SelectTrigger><SelectValue placeholder="단원을 선택하세요" /></SelectTrigger>
              <SelectContent>
                {UNIT_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={saving || !unitValue}>
            {saving ? '저장 중...' : '추가'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function UnitCard({
  unit,
  expanded,
  onToggle,
  onDelete,
}: {
  unit: NaesinUnit;
  expanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <Card>
      <CardContent className="py-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onToggle}
            className="flex items-center gap-2 text-left flex-1"
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4 shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0" />
            )}
            <span className="font-medium">
              {unit.title}
            </span>
          </button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>

        {expanded && <UnitContentManager unitId={unit.id} />}
      </CardContent>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        description="이 단원을 삭제하시겠습니까?"
        onConfirm={async () => {
          setDeleteOpen(false);
          try {
            await fetchWithToast('/api/naesin/units', {
              method: 'DELETE',
              body: { id: unit.id },
              errorMessage: '단원 삭제에 실패했습니다',
              logContext: 'admin.unit_section',
            });
            onDelete();
          } catch {
            // fetchWithToast already handles toast + logging
          }
        }}
      />
    </Card>
  );
}
