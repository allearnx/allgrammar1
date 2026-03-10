import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { NaesinVocabulary } from '@/types/database';
import { CreateQuizSetFromSelection } from './quiz-set-manager';

interface VocabEditForm {
  front_text: string;
  back_text: string;
  part_of_speech: string;
  example_sentence: string;
  synonyms: string;
  antonyms: string;
}

export interface UnitVocabListProps {
  unitId: string;
  items: NaesinVocabulary[];
  selectedIds: Set<string>;
  toggleSelectAll: () => void;
  toggleSelect: (id: string) => void;
  deleting: boolean;
  setSelectedIds: (ids: Set<string>) => void;
  editingId: string | null;
  editForm: VocabEditForm;
  setEditForm: (form: VocabEditForm) => void;
  startEdit: (item: NaesinVocabulary) => void;
  cancelEdit: () => void;
  saveEdit: () => void;
  onRequestDelete: (id: string) => void;
  onBulkDeleteOpen: () => void;
}

export function UnitVocabList({
  unitId, items, selectedIds, toggleSelectAll, toggleSelect, deleting,
  setSelectedIds, editingId, editForm, setEditForm, startEdit, cancelEdit,
  saveEdit, onRequestDelete, onBulkDeleteOpen,
}: UnitVocabListProps) {
  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox
              checked={selectedIds.size === items.length}
              onCheckedChange={toggleSelectAll}
            />
            전체 선택
          </label>
          {selectedIds.size > 0 && (
            <Button
              size="sm"
              variant="destructive"
              onClick={onBulkDeleteOpen}
              disabled={deleting}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              {deleting ? '삭제 중...' : `${selectedIds.size}개 삭제`}
            </Button>
          )}
        </div>
        <div className="max-h-[70vh] overflow-y-auto space-y-1 rounded-lg border p-2">
          {items.map((v) => (
            <div key={v.id} className="rounded hover:bg-muted/50">
              <div className="flex items-center gap-2 py-1.5 px-2 group">
                <Checkbox
                  checked={selectedIds.has(v.id)}
                  onCheckedChange={() => toggleSelect(v.id)}
                />
                <span className="text-sm font-medium flex-1 truncate">{v.front_text}</span>
                <span className="text-sm text-muted-foreground truncate max-w-[120px]">{v.back_text}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100"
                  onClick={() => editingId === v.id ? cancelEdit() : startEdit(v)}
                  aria-label="수정"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100"
                  onClick={() => onRequestDelete(v.id)}
                  aria-label="삭제"
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
              {editingId === v.id && (
                <div className="px-2 pb-2 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Input className="h-7 text-sm" value={editForm.front_text} onChange={(e) => setEditForm({ ...editForm, front_text: e.target.value })} placeholder="영어" />
                    <Input className="h-7 text-sm" value={editForm.back_text} onChange={(e) => setEditForm({ ...editForm, back_text: e.target.value })} placeholder="한국어" />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Input className="h-7 text-sm" value={editForm.part_of_speech} onChange={(e) => setEditForm({ ...editForm, part_of_speech: e.target.value })} placeholder="품사" />
                    <Input className="h-7 text-sm col-span-2" value={editForm.example_sentence} onChange={(e) => setEditForm({ ...editForm, example_sentence: e.target.value })} placeholder="예문" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input className="h-7 text-sm" value={editForm.synonyms} onChange={(e) => setEditForm({ ...editForm, synonyms: e.target.value })} placeholder="유의어" />
                    <Input className="h-7 text-sm" value={editForm.antonyms} onChange={(e) => setEditForm({ ...editForm, antonyms: e.target.value })} placeholder="반의어" />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="outline" className="h-7" onClick={cancelEdit}>취소</Button>
                    <Button size="sm" className="h-7" onClick={saveEdit}>저장</Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="border rounded-lg p-3 bg-blue-50/50">
          <CreateQuizSetFromSelection
            unitId={unitId}
            vocabList={items}
            selectedIds={selectedIds}
            onCreated={() => { setSelectedIds(new Set()); toast.success('시험지가 생성되었습니다'); }}
          />
        </div>
      )}
    </>
  );
}
