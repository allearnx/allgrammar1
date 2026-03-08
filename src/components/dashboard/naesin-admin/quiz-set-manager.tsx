'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Trash2, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { NaesinVocabulary, NaesinVocabQuizSet } from '@/types/database';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';

export function CreateQuizSetFromSelection({
  unitId,
  vocabList,
  selectedIds,
  onCreated,
}: {
  unitId: string;
  vocabList: NaesinVocabulary[];
  selectedIds: Set<string>;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    if (!title.trim()) {
      toast.error('시험지 제목을 입력하세요');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/naesin/vocab-quiz-sets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unitId,
          title: title.trim(),
          vocabIds: Array.from(selectedIds),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || '요청에 실패했습니다');
      }
      setTitle('');
      onCreated();
    } catch (err) {
      console.error(err);
      toast.error('시험지 생성 실패');
    } finally {
      setSaving(false);
    }
  }

  const selectedWords = vocabList.filter((v) => selectedIds.has(v.id));

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-blue-700">
        선택한 {selectedIds.size}개 단어로 시험지 만들기
      </p>
      <div className="flex flex-wrap gap-1">
        {selectedWords.slice(0, 10).map((v) => (
          <Badge key={v.id} variant="secondary" className="text-xs">{v.front_text}</Badge>
        ))}
        {selectedWords.length > 10 && (
          <Badge variant="secondary" className="text-xs">+{selectedWords.length - 10}개</Badge>
        )}
      </div>
      <div className="flex gap-2">
        <Input
          className="h-8 text-sm flex-1"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="시험지 A"
        />
        <Button size="sm" className="h-8" onClick={handleCreate} disabled={saving || !title.trim()}>
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : '생성'}
        </Button>
      </div>
    </div>
  );
}

export function VocabQuizSetManager({ unitId }: { unitId: string }) {
  const [sets, setSets] = useState<NaesinVocabQuizSet[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    loadSets();
  }, [unitId]);

  async function loadSets() {
    try {
      const res = await fetch(`/api/naesin/vocab-quiz-sets?unitId=${unitId}`);
      const data = await res.json();
      setSets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch('/api/naesin/vocab-quiz-sets', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setSets((prev) => prev.filter((s) => s.id !== id));
        toast.success('시험지가 삭제되었습니다');
      } else {
        toast.error('시험지 삭제에 실패했습니다');
      }
    } catch (err) {
      console.error(err);
      toast.error('시험지 삭제 중 오류가 발생했습니다');
    }
  }

  if (sets.length === 0) return null;

  return (
    <div className="border rounded-lg p-3 space-y-2">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm font-medium w-full"
      >
        {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        단어 시험지 ({sets.length}개)
      </button>
      {expanded && (
        <div className="space-y-1">
          {sets.map((set) => (
            <div key={set.id} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50">
              <div>
                <span className="text-sm font-medium">{set.title}</span>
                <span className="text-xs text-muted-foreground ml-2">
                  ({set.vocab_ids.length}단어)
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setDeleteConfirmId(set.id)}
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={deleteConfirmId !== null}
        onOpenChange={(open) => { if (!open) setDeleteConfirmId(null); }}
        description="이 시험지를 삭제하시겠습니까?"
        onConfirm={() => {
          const id = deleteConfirmId;
          setDeleteConfirmId(null);
          if (id) handleDelete(id);
        }}
      />
    </div>
  );
}
