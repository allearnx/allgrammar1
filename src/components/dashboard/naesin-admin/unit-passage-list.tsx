import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Pencil, Trash2, Loader2, Wand2, Plus, X } from 'lucide-react';
import type { NaesinPassage } from '@/types/database';

export interface PassageEditForm {
  title: string;
  sentences: { original: string; korean: string; acceptedAnswers: string[] }[];
}

export interface UnitPassageListProps {
  passages: NaesinPassage[];
  editingId: string | null;
  editForm: PassageEditForm;
  savingPassage: boolean;
  regeneratingGV: string | null;
  onStartEdit: (passage: NaesinPassage) => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onTitleChange: (title: string) => void;
  onUpdateSentence: (idx: number, field: 'original' | 'korean', value: string) => void;
  onAddSentence: (afterIdx?: number) => void;
  onRemoveSentence: (idx: number) => void;
  onAddAcceptedAnswer: (sentenceIdx: number) => void;
  onUpdateAcceptedAnswer: (sentenceIdx: number, answerIdx: number, value: string) => void;
  onRemoveAcceptedAnswer: (sentenceIdx: number, answerIdx: number) => void;
  onRequestDelete: (id: string) => void;
  onRegenerateGrammarVocab: (passage: NaesinPassage) => void;
}

export function UnitPassageList({
  passages, editingId, editForm, savingPassage, regeneratingGV,
  onStartEdit, onCancelEdit, onSaveEdit, onTitleChange,
  onUpdateSentence, onAddSentence, onRemoveSentence,
  onAddAcceptedAnswer, onUpdateAcceptedAnswer, onRemoveAcceptedAnswer,
  onRequestDelete, onRegenerateGrammarVocab,
}: UnitPassageListProps) {
  return (
    <div className="space-y-1 rounded-lg border p-2">
      {passages.map((passage) => (
        <div key={passage.id} className="rounded hover:bg-muted/50">
          <div className="flex items-center gap-2 py-1.5 px-2 group">
            <FileText className="h-3.5 w-3.5 text-orange-500 shrink-0" />
            <span className="text-sm flex-1 truncate">{passage.title}</span>
            {(() => {
              const hasGV = passage.grammar_vocab_items && (passage.grammar_vocab_items as unknown[]).length > 0;
              return (
                <Button
                  variant={hasGV ? 'outline' : 'secondary'}
                  size="sm"
                  className="h-6 text-[11px] px-2 shrink-0"
                  onClick={() => onRegenerateGrammarVocab(passage)}
                  disabled={regeneratingGV === passage.id}
                >
                  {regeneratingGV === passage.id ? (
                    <><Loader2 className="h-3 w-3 mr-1 animate-spin" />생성 중...</>
                  ) : hasGV ? (
                    <><Wand2 className="h-3 w-3 mr-1" />어법/어휘 재생성</>
                  ) : (
                    <><Wand2 className="h-3 w-3 mr-1" />어법/어휘 생성</>
                  )}
                </Button>
              );
            })()}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100"
              onClick={() => editingId === passage.id ? onCancelEdit() : onStartEdit(passage)}
              aria-label="수정"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100"
              onClick={() => onRequestDelete(passage.id)}
              aria-label="삭제"
            >
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </div>
          {editingId === passage.id && (
            <div className="px-2 pb-3 space-y-3">
              <Input
                className="h-8 text-sm"
                value={editForm.title}
                onChange={(e) => onTitleChange(e.target.value)}
                placeholder="제목"
              />
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">문장별 한/영 수정</p>
                {editForm.sentences.map((s, idx) => (
                  <div key={idx}>
                    <div className="grid grid-cols-[auto_1fr_auto] gap-2 items-start">
                      <span className="text-xs text-muted-foreground pt-2 w-5 text-right">{idx + 1}</span>
                      <div className="space-y-1">
                        <Textarea
                          className="text-sm min-h-[2.5rem] resize-none"
                          rows={1}
                          value={s.korean}
                          onChange={(e) => onUpdateSentence(idx, 'korean', e.target.value)}
                          placeholder="한국어"
                        />
                        <Textarea
                          className="text-sm min-h-[2.5rem] resize-none"
                          rows={1}
                          value={s.original}
                          onChange={(e) => onUpdateSentence(idx, 'original', e.target.value)}
                          placeholder="English (기본 정답)"
                        />
                        {s.acceptedAnswers.map((ans, aIdx) => (
                          <div key={aIdx} className="flex gap-1">
                            <Input
                              className="h-7 text-sm flex-1"
                              value={ans}
                              onChange={(e) => onUpdateAcceptedAnswer(idx, aIdx, e.target.value)}
                              placeholder={`대체 정답 ${aIdx + 1}`}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 shrink-0"
                              onClick={() => onRemoveAcceptedAnswer(idx, aIdx)}
                            >
                              <X className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-[11px] text-muted-foreground"
                          onClick={() => onAddAcceptedAnswer(idx)}
                        >
                          <Plus className="h-3 w-3 mr-1" />대체 정답 추가
                        </Button>
                      </div>
                      {editForm.sentences.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 mt-1"
                          onClick={() => onRemoveSentence(idx)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      )}
                    </div>
                    {idx < editForm.sentences.length - 1 && (
                      <div className="flex justify-center py-0.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 text-[10px] text-muted-foreground/60 hover:text-muted-foreground px-2"
                          onClick={() => onAddSentence(idx)}
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
                  onClick={() => onAddSentence()}
                >
                  <Plus className="h-3 w-3 mr-1" />문장 추가
                </Button>
              </div>
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="outline" className="h-7" onClick={onCancelEdit}>취소</Button>
                <Button size="sm" className="h-7" onClick={onSaveEdit} disabled={savingPassage}>
                  {savingPassage && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
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
