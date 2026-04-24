'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trash2 } from 'lucide-react';
import { fetchWithToast } from '@/lib/fetch-with-toast';

interface CopyItem {
  id: string;
  title: string;
  unit_id: string;
  unit_title: string;
  unit_number: number;
  textbook_id: string;
  textbook_name: string;
  created_at: string;
}

interface TemplateCopiesDialogProps {
  templateId: string;
  templateTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

export function TemplateCopiesDialog({ templateId, templateTitle, open, onOpenChange, onDeleted }: TemplateCopiesDialogProps) {
  const [copies, setCopies] = useState<CopyItem[]>([]);
  const [grouped, setGrouped] = useState<Record<string, CopyItem[]>>({});
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelected(new Set());
    loadCopies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, templateId]);

  async function loadCopies() {
    setLoading(true);
    try {
      const data = await fetchWithToast<{ copies: CopyItem[]; grouped: Record<string, CopyItem[]> }>(
        `/api/naesin/templates/copies?templateId=${templateId}`,
        { logContext: 'template.load_copies' }
      );
      setCopies(data.copies);
      setGrouped(data.grouped);
    } catch { /* handled */ } finally {
      setLoading(false);
    }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === copies.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(copies.map((c) => c.id)));
    }
  }

  async function handleBulkDelete() {
    if (selected.size === 0) return;
    const confirmed = window.confirm(`선택한 ${selected.size}개의 복사본을 삭제하시겠습니까?`);
    if (!confirmed) return;

    setDeleting(true);
    try {
      await fetchWithToast('/api/naesin/problems/bulk-delete', {
        method: 'POST',
        body: { ids: [...selected] },
        successMessage: `${selected.size}개 삭제 완료`,
        errorMessage: '삭제 실패',
        logContext: 'template.bulk_delete_copies',
      });
      // Remove deleted from local state
      const deletedIds = new Set(selected);
      setCopies((prev) => prev.filter((c) => !deletedIds.has(c.id)));
      setGrouped((prev) => {
        const next: Record<string, CopyItem[]> = {};
        for (const [key, items] of Object.entries(prev)) {
          const filtered = items.filter((c) => !deletedIds.has(c.id));
          if (filtered.length > 0) next[key] = filtered;
        }
        return next;
      });
      setSelected(new Set());
      onDeleted?.();
    } catch { /* handled */ } finally {
      setDeleting(false);
    }
  }

  const groupKeys = Object.keys(grouped).sort();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-base">복사본 관리</DialogTitle>
          <p className="text-xs text-muted-foreground truncate">원본: {templateTitle}</p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3 min-h-0">
          {loading && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {!loading && copies.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">복사본이 없습니다.</p>
          )}

          {!loading && copies.length > 0 && (
            <>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Checkbox
                  checked={selected.size === copies.length}
                  onCheckedChange={toggleAll}
                  aria-label="전체 선택"
                />
                <span>전체 선택 ({copies.length}개)</span>
              </div>

              {groupKeys.map((tbName) => (
                <div key={tbName} className="space-y-1">
                  <h4 className="text-xs font-semibold text-muted-foreground px-1">{tbName}</h4>
                  {grouped[tbName].map((copy) => (
                    <label
                      key={copy.id}
                      className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/50 cursor-pointer"
                    >
                      <Checkbox
                        checked={selected.has(copy.id)}
                        onCheckedChange={() => toggleSelect(copy.id)}
                      />
                      <span className="text-sm flex-1 truncate">
                        {copy.unit_number}단원 {copy.unit_title}
                      </span>
                      <Badge variant="outline" className="text-[10px] shrink-0">{copy.title}</Badge>
                    </label>
                  ))}
                </div>
              ))}
            </>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>닫기</Button>
          {copies.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={selected.size === 0 || deleting}
            >
              {deleting ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Trash2 className="h-3.5 w-3.5 mr-1" />}
              선택 삭제 ({selected.size})
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
