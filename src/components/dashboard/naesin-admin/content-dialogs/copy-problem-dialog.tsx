'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Copy, ArrowLeft } from 'lucide-react';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import { logger } from '@/lib/logger';
import type { NaesinProblemSheet } from '@/types/naesin';

interface Textbook {
  id: string;
  display_name: string;
  grade: number;
  publisher: string;
}

interface Unit {
  id: string;
  unit_number: number;
  title: string;
}

interface Props {
  sheet: NaesinProblemSheet;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CopyProblemDialog({ sheet, open, onOpenChange }: Props) {
  const [textbooks, setTextbooks] = useState<Textbook[]>([]);
  const [selectedTextbookId, setSelectedTextbookId] = useState<string | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnitIds, setSelectedUnitIds] = useState<Set<string>>(new Set());
  const [title, setTitle] = useState(sheet.title);
  const [loading, setLoading] = useState(false);
  const [copying, setCopying] = useState(false);
  const [loadingUnits, setLoadingUnits] = useState(false);

  // Load textbooks on open
  useEffect(() => {
    if (!open) return;
    setTitle(sheet.title);
    setSelectedTextbookId(null);
    setUnits([]);
    setSelectedUnitIds(new Set());
    loadTextbooks();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Load units when textbook selected
  useEffect(() => {
    if (!selectedTextbookId) {
      setUnits([]);
      setSelectedUnitIds(new Set());
      return;
    }
    loadUnits(selectedTextbookId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTextbookId]);

  async function loadTextbooks() {
    setLoading(true);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data } = await supabase
        .from('naesin_textbooks')
        .select('id, display_name, grade, publisher')
        .eq('is_active', true)
        .order('sort_order');
      setTextbooks(data || []);
    } catch (err) {
      logger.error('copy_problem.load_textbooks', { error: err instanceof Error ? err.message : String(err) });
    } finally {
      setLoading(false);
    }
  }

  async function loadUnits(textbookId: string) {
    setLoadingUnits(true);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data } = await supabase
        .from('naesin_units')
        .select('id, unit_number, title')
        .eq('textbook_id', textbookId)
        .order('sort_order');
      setUnits(data || []);
    } catch (err) {
      logger.error('copy_problem.load_units', { error: err instanceof Error ? err.message : String(err) });
    } finally {
      setLoadingUnits(false);
    }
  }

  function toggleUnit(unitId: string) {
    setSelectedUnitIds((prev) => {
      const next = new Set(prev);
      if (next.has(unitId)) next.delete(unitId); else next.add(unitId);
      return next;
    });
  }

  async function handleCopy() {
    if (selectedUnitIds.size === 0) return;
    setCopying(true);
    try {
      await fetchWithToast('/api/naesin/problems/copy', {
        body: {
          sourceSheetId: sheet.id,
          targetUnitIds: Array.from(selectedUnitIds),
          newTitle: title.trim() || undefined,
        },
        successMessage: `${selectedUnitIds.size}개 단원에 복사 완료`,
        errorMessage: '문제 복사 중 오류가 발생했습니다',
        logContext: 'copy_problem.copy',
      });
      onOpenChange(false);
    } catch { /* fetchWithToast handles toasts */ } finally {
      setCopying(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-4 w-4" />
            문제 세트 복사
          </DialogTitle>
        </DialogHeader>

        {/* Source info */}
        <div className="rounded-lg bg-muted/50 p-3 text-sm">
          <p className="text-muted-foreground">원본</p>
          <p className="font-medium">{sheet.title} ({sheet.questions?.length || 0}문제)</p>
        </div>

        {/* Title edit */}
        <div className="space-y-1">
          <label className="text-sm font-medium">복사 시트 제목</label>
          <Input
            className="h-8 text-sm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="시트 제목"
          />
        </div>

        {/* Step 1: Textbook selection */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {selectedTextbookId && (
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedTextbookId(null)}>
                <ArrowLeft className="h-3.5 w-3.5" />
              </Button>
            )}
            <h3 className="text-sm font-medium">
              {selectedTextbookId ? '단원 선택' : '교과서 선택'}
            </h3>
          </div>

          {!selectedTextbookId && (
            loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {textbooks.map((tb) => (
                  <Card
                    key={tb.id}
                    className="cursor-pointer transition-shadow hover:shadow-md"
                    onClick={() => setSelectedTextbookId(tb.id)}
                  >
                    <CardContent className="py-3 px-4">
                      <p className="font-medium text-sm">{tb.display_name}</p>
                      <p className="text-xs text-muted-foreground">중{tb.grade} · {tb.publisher}</p>
                    </CardContent>
                  </Card>
                ))}
                {textbooks.length === 0 && (
                  <p className="text-sm text-muted-foreground col-span-2 text-center py-4">교과서가 없습니다</p>
                )}
              </div>
            )
          )}

          {/* Step 2: Unit checkboxes */}
          {selectedTextbookId && (
            loadingUnits ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-1 rounded-lg border p-2 max-h-[40vh] overflow-y-auto">
                {units.map((unit) => (
                  <label
                    key={unit.id}
                    className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-muted/50 cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedUnitIds.has(unit.id)}
                      onCheckedChange={() => toggleUnit(unit.id)}
                    />
                    <span className="text-sm">
                      {unit.unit_number}과. {unit.title}
                    </span>
                  </label>
                ))}
                {units.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">단원이 없습니다</p>
                )}
              </div>
            )
          )}
        </div>

        {/* Copy button */}
        <Button
          className="w-full"
          onClick={handleCopy}
          disabled={copying || selectedUnitIds.size === 0}
        >
          {copying ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              복사 중...
            </>
          ) : selectedUnitIds.size > 0 ? (
            `${selectedUnitIds.size}개 단원에 복사`
          ) : (
            '대상 단원을 선택하세요'
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
