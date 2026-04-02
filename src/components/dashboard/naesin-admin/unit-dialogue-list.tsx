'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Pencil, Trash2, Loader2, Plus, X } from 'lucide-react';
import { useDialogueEditForm } from '@/hooks/use-dialogue-edit-form';
import type { NaesinDialogue } from '@/types/naesin';

interface UnitDialogueListProps {
  dialogues: NaesinDialogue[];
  onUpdate: (updated: NaesinDialogue) => void;
  onRequestDelete: (id: string) => void;
}

export function UnitDialogueList({ dialogues, onUpdate, onRequestDelete }: UnitDialogueListProps) {
  const edit = useDialogueEditForm(onUpdate);

  return (
    <div className="space-y-1 rounded-lg border p-2">
      {dialogues.map((dialogue) => (
        <div key={dialogue.id} className="rounded hover:bg-muted/50">
          <div className="flex items-center gap-2 py-1.5 px-2 group">
            <MessageSquare className="h-3.5 w-3.5 text-violet-500 shrink-0" />
            <span className="text-sm flex-1 truncate">{dialogue.title}</span>
            <span className="text-xs text-muted-foreground shrink-0">{dialogue.sentences.length}문장</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100"
              onClick={() => edit.editingId === dialogue.id ? edit.cancelEdit() : edit.startEdit(dialogue)}
              aria-label="수정"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100"
              onClick={() => onRequestDelete(dialogue.id)}
              aria-label="삭제"
            >
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>
          {edit.editingId === dialogue.id && (
            <div className="px-2 pb-3 space-y-3">
              <Input
                className="h-8 text-sm"
                value={edit.editTitle}
                onChange={(e) => edit.setEditTitle(e.target.value)}
                placeholder="제목"
              />
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">문장별 화자 / 영어 / 한국어 수정</p>
                {edit.editSentences.map((s, idx) => (
                  <div key={idx}>
                    <div className="grid grid-cols-[auto_1fr_auto] gap-2 items-start">
                      <span className="text-xs text-muted-foreground pt-2 w-5 text-right">{idx + 1}</span>
                      <div className="space-y-1">
                        <Input
                          className="h-7 text-sm"
                          value={s.speaker || ''}
                          onChange={(e) => edit.updateSentence(idx, 'speaker', e.target.value)}
                          placeholder="화자 (예: A, B, Mike)"
                        />
                        <Textarea
                          className="text-sm min-h-[2.5rem] resize-none"
                          rows={1}
                          value={s.original}
                          onChange={(e) => edit.updateSentence(idx, 'original', e.target.value)}
                          placeholder="English"
                        />
                        <Textarea
                          className="text-sm min-h-[2.5rem] resize-none"
                          rows={1}
                          value={s.korean}
                          onChange={(e) => edit.updateSentence(idx, 'korean', e.target.value)}
                          placeholder="한국어"
                        />
                      </div>
                      {edit.editSentences.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 mt-1"
                          onClick={() => edit.removeSentence(idx)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      )}
                    </div>
                    {idx < edit.editSentences.length - 1 && (
                      <div className="flex justify-center py-0.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 text-[10px] text-muted-foreground/60 hover:text-muted-foreground px-2"
                          onClick={() => edit.addSentence(idx)}
                        >
                          <Plus className="h-2.5 w-2.5 mr-0.5" />사이에 삽입
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-7 text-xs"
                  onClick={() => edit.addSentence()}
                >
                  <Plus className="h-3 w-3 mr-1" />문장 추가
                </Button>
              </div>
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="outline" className="h-7" onClick={edit.cancelEdit}>취소</Button>
                <Button size="sm" className="h-7" onClick={edit.saveEdit} disabled={edit.saving}>
                  {edit.saving && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
                  저장
                </Button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
