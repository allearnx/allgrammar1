'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Pencil, Trash2, Loader2, Wand2, Plus, X, Upload, Download, FileUp } from 'lucide-react';
import { usePassageEditForm } from '@/hooks/use-passage-edit-form';
import { usePassagePdf } from '@/hooks/use-passage-pdf';
import type { NaesinPassage } from '@/types/database';

interface UnitPassageListProps {
  passages: NaesinPassage[];
  regeneratingGV: string | null;
  onUpdate: (updated: NaesinPassage) => void;
  onRequestDelete: (id: string) => void;
  onRegenerateGrammarVocab: (passage: NaesinPassage) => void;
}

export function UnitPassageList({
  passages, regeneratingGV,
  onUpdate, onRequestDelete, onRegenerateGrammarVocab,
}: UnitPassageListProps) {
  const edit = usePassageEditForm(onUpdate);
  const pdf = usePassagePdf(onUpdate);

  return (
    <div className="space-y-1 rounded-lg border p-2">
      {passages.map((passage) => (
        <div key={passage.id} className="rounded hover:bg-muted/50">
          <div className="flex items-center gap-2 py-1.5 px-2 group">
            <FileText className="h-3.5 w-3.5 text-orange-500 shrink-0" />
            <span className="text-sm flex-1 truncate">{passage.title}</span>
            {passage.pdf_url ? (
              <span className="flex items-center gap-1 shrink-0">
                <a href={passage.pdf_url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-500 font-medium flex items-center gap-0.5 hover:underline">
                  <Download className="h-3 w-3" />PDF
                </a>
                <button type="button" className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100" onClick={() => pdf.removePdf(passage.id)}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            ) : (
              <>
                <input type="file" accept=".pdf" className="hidden" id={`quick-pdf-${passage.id}`} onChange={(e) => pdf.quickPdfUpload(passage.id, e)} disabled={pdf.quickUploadingId === passage.id} />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[10px] px-1.5 shrink-0 text-muted-foreground"
                  disabled={pdf.quickUploadingId === passage.id}
                  onClick={() => document.getElementById(`quick-pdf-${passage.id}`)?.click()}
                >
                  {pdf.quickUploadingId === passage.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <><FileUp className="h-3 w-3 mr-0.5" />PDF</>
                  )}
                </Button>
              </>
            )}
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
              onClick={() => edit.editingId === passage.id ? edit.cancelEdit() : edit.startEdit(passage)}
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
          {edit.editingId === passage.id && (
            <div className="px-2 pb-3 space-y-3">
              <Input
                className="h-8 text-sm"
                value={edit.editTitle}
                onChange={(e) => edit.setEditTitle(e.target.value)}
                placeholder="제목"
              />
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">문장별 한/영 수정</p>
                {edit.editSentences.map((s, idx) => (
                  <div key={idx}>
                    <div className="grid grid-cols-[auto_1fr_auto] gap-2 items-start">
                      <span className="text-xs text-muted-foreground pt-2 w-5 text-right">{idx + 1}</span>
                      <div className="space-y-1">
                        <Textarea
                          className="text-sm min-h-[2.5rem] resize-none"
                          rows={1}
                          value={s.korean}
                          onChange={(e) => edit.updateSentence(idx, 'korean', e.target.value)}
                          placeholder="한국어"
                        />
                        <Textarea
                          className="text-sm min-h-[2.5rem] resize-none"
                          rows={1}
                          value={s.original}
                          onChange={(e) => edit.updateSentence(idx, 'original', e.target.value)}
                          placeholder="English (기본 정답)"
                        />
                        {s.acceptedAnswers.map((ans, aIdx) => (
                          <div key={aIdx} className="flex gap-1">
                            <Input
                              className="h-7 text-sm flex-1"
                              value={ans}
                              onChange={(e) => edit.updateAcceptedAnswer(idx, aIdx, e.target.value)}
                              placeholder={`대체 정답 ${aIdx + 1}`}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 shrink-0"
                              onClick={() => edit.removeAcceptedAnswer(idx, aIdx)}
                            >
                              <X className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-[11px] text-muted-foreground"
                          onClick={() => edit.addAcceptedAnswer(idx)}
                        >
                          <Plus className="h-3 w-3 mr-1" />대체 정답 추가
                        </Button>
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
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium">본문 PDF</span>
                <input type="file" accept=".pdf" className="hidden" id={`edit-pdf-${passage.id}`} onChange={(e) => pdf.editPdfUpload(e, (url) => edit.setEditPdfUrl(url))} disabled={pdf.uploadingPdf} />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-6 text-[11px]"
                  disabled={pdf.uploadingPdf}
                  onClick={() => document.getElementById(`edit-pdf-${passage.id}`)?.click()}
                >
                  {pdf.uploadingPdf ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Upload className="h-3 w-3 mr-1" />}
                  {edit.editPdfUrl ? '변경' : '업로드'}
                </Button>
                {edit.editPdfUrl && (
                  <>
                    <a href={edit.editPdfUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 flex items-center gap-0.5">
                      <Download className="h-3 w-3" />보기
                    </a>
                    <button type="button" className="text-muted-foreground hover:text-destructive" onClick={() => edit.setEditPdfUrl(null)}>
                      <X className="h-3 w-3" />
                    </button>
                  </>
                )}
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
