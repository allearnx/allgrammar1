'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Pencil, Trash2, Loader2, Wand2, Plus, X, Upload, Check, Download } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import type { NaesinPassage } from '@/types/database';

interface PassageSentence {
  original: string;
  korean: string;
  acceptedAnswers: string[];
}

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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSentences, setEditSentences] = useState<PassageSentence[]>([]);
  const [editPdfUrl, setEditPdfUrl] = useState<string | null>(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [saving, setSaving] = useState(false);

  function startEdit(passage: NaesinPassage) {
    setEditingId(passage.id);
    setEditTitle(passage.title);
    setEditPdfUrl(passage.pdf_url || null);
    const sentences = Array.isArray(passage.sentences) && passage.sentences.length > 0
      ? passage.sentences.map((s) => ({ original: s.original, korean: s.korean, acceptedAnswers: s.acceptedAnswers || [] }))
      : [{ original: passage.original_text, korean: passage.korean_translation, acceptedAnswers: [] as string[] }];
    setEditSentences(sentences);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditTitle('');
    setEditSentences([]);
    setEditPdfUrl(null);
  }

  async function handleEditPdfUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPdf(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/naesin/passages/upload-pdf', { method: 'POST', body: formData });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || '업로드 실패');
      }
      const data = await res.json();
      setEditPdfUrl(data.url);
      toast.success('PDF 업로드 완료');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'PDF 업로드 실패');
    } finally {
      setUploadingPdf(false);
    }
  }

  function updateSentence(idx: number, field: 'original' | 'korean', value: string) {
    setEditSentences((prev) => prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));
  }

  function addSentence(afterIdx?: number) {
    setEditSentences((prev) => {
      const newSentence: PassageSentence = { original: '', korean: '', acceptedAnswers: [] };
      if (afterIdx === undefined) return [...prev, newSentence];
      const copy = [...prev];
      copy.splice(afterIdx + 1, 0, newSentence);
      return copy;
    });
  }

  function removeSentence(idx: number) {
    if (editSentences.length <= 1) return;
    setEditSentences((prev) => prev.filter((_, i) => i !== idx));
  }

  function addAcceptedAnswer(sentenceIdx: number) {
    setEditSentences((prev) => prev.map((s, i) =>
      i === sentenceIdx ? { ...s, acceptedAnswers: [...s.acceptedAnswers, ''] } : s
    ));
  }

  function updateAcceptedAnswer(sentenceIdx: number, answerIdx: number, value: string) {
    setEditSentences((prev) => prev.map((s, i) =>
      i === sentenceIdx
        ? { ...s, acceptedAnswers: s.acceptedAnswers.map((a, j) => (j === answerIdx ? value : a)) }
        : s
    ));
  }

  function removeAcceptedAnswer(sentenceIdx: number, answerIdx: number) {
    setEditSentences((prev) => prev.map((s, i) =>
      i === sentenceIdx
        ? { ...s, acceptedAnswers: s.acceptedAnswers.filter((_, j) => j !== answerIdx) }
        : s
    ));
  }

  async function saveEdit() {
    if (!editingId) return;
    setSaving(true);
    try {
      const res = await fetch('/api/naesin/passages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingId,
          title: editTitle,
          pdf_url: editPdfUrl || null,
          sentences: editSentences.map((s) => ({
            original: s.original,
            korean: s.korean,
            ...(s.acceptedAnswers.filter(Boolean).length > 0
              ? { acceptedAnswers: s.acceptedAnswers.filter(Boolean) }
              : {}),
          })),
        }),
      });
      if (!res.ok) throw new Error('수정 실패');
      const updated = await res.json();
      onUpdate(updated);
      cancelEdit();
      toast.success('지문이 수정되었습니다');
    } catch (err) {
      logger.error('unit.save_passage', { error: err instanceof Error ? err.message : String(err) });
      toast.error('지문 수정 중 오류가 발생했습니다');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-1 rounded-lg border p-2">
      {passages.map((passage) => (
        <div key={passage.id} className="rounded hover:bg-muted/50">
          <div className="flex items-center gap-2 py-1.5 px-2 group">
            <FileText className="h-3.5 w-3.5 text-orange-500 shrink-0" />
            <span className="text-sm flex-1 truncate">{passage.title}</span>
            {passage.pdf_url && <span className="text-[10px] text-blue-500 font-medium shrink-0">PDF</span>}
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
              onClick={() => editingId === passage.id ? cancelEdit() : startEdit(passage)}
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
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="제목"
              />
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">문장별 한/영 수정</p>
                {editSentences.map((s, idx) => (
                  <div key={idx}>
                    <div className="grid grid-cols-[auto_1fr_auto] gap-2 items-start">
                      <span className="text-xs text-muted-foreground pt-2 w-5 text-right">{idx + 1}</span>
                      <div className="space-y-1">
                        <Textarea
                          className="text-sm min-h-[2.5rem] resize-none"
                          rows={1}
                          value={s.korean}
                          onChange={(e) => updateSentence(idx, 'korean', e.target.value)}
                          placeholder="한국어"
                        />
                        <Textarea
                          className="text-sm min-h-[2.5rem] resize-none"
                          rows={1}
                          value={s.original}
                          onChange={(e) => updateSentence(idx, 'original', e.target.value)}
                          placeholder="English (기본 정답)"
                        />
                        {s.acceptedAnswers.map((ans, aIdx) => (
                          <div key={aIdx} className="flex gap-1">
                            <Input
                              className="h-7 text-sm flex-1"
                              value={ans}
                              onChange={(e) => updateAcceptedAnswer(idx, aIdx, e.target.value)}
                              placeholder={`대체 정답 ${aIdx + 1}`}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 shrink-0"
                              onClick={() => removeAcceptedAnswer(idx, aIdx)}
                            >
                              <X className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-[11px] text-muted-foreground"
                          onClick={() => addAcceptedAnswer(idx)}
                        >
                          <Plus className="h-3 w-3 mr-1" />대체 정답 추가
                        </Button>
                      </div>
                      {editSentences.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 mt-1"
                          onClick={() => removeSentence(idx)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      )}
                    </div>
                    {idx < editSentences.length - 1 && (
                      <div className="flex justify-center py-0.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 text-[10px] text-muted-foreground/60 hover:text-muted-foreground px-2"
                          onClick={() => addSentence(idx)}
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
                  onClick={() => addSentence()}
                >
                  <Plus className="h-3 w-3 mr-1" />문장 추가
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium">본문 PDF</span>
                <input type="file" accept=".pdf" className="hidden" id={`edit-pdf-${passage.id}`} onChange={handleEditPdfUpload} disabled={uploadingPdf} />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-6 text-[11px]"
                  disabled={uploadingPdf}
                  onClick={() => document.getElementById(`edit-pdf-${passage.id}`)?.click()}
                >
                  {uploadingPdf ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Upload className="h-3 w-3 mr-1" />}
                  {editPdfUrl ? '변경' : '업로드'}
                </Button>
                {editPdfUrl && (
                  <>
                    <a href={editPdfUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 flex items-center gap-0.5">
                      <Download className="h-3 w-3" />보기
                    </a>
                    <button type="button" className="text-muted-foreground hover:text-destructive" onClick={() => setEditPdfUrl(null)}>
                      <X className="h-3 w-3" />
                    </button>
                  </>
                )}
              </div>
              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="outline" className="h-7" onClick={cancelEdit}>취소</Button>
                <Button size="sm" className="h-7" onClick={saveEdit} disabled={saving}>
                  {saving && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
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
