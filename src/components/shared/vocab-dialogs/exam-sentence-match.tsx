'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { FileSearch, Loader2, Check, Languages } from 'lucide-react';
import { toast } from 'sonner';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import type { VocaVocabulary } from '@/types/voca';

interface MatchedWord {
  id: string;
  front_text: string;
  matched: boolean;
  example_sentence: string | null;
  example_sentence_ko: string | null;
  selected: boolean;
}

interface Props {
  words: VocaVocabulary[];
  onUpdate: () => void;
}

export function ExamSentenceMatch({ words, onUpdate }: Props) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [file, setFile] = useState<File | null>(null);
  const [matching, setMatching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [results, setResults] = useState<MatchedWord[]>([]);
  const [translating, setTranslating] = useState(false);

  function reset() {
    setStep(1);
    setFile(null);
    setMatching(false);
    setSaving(false);
    setResults([]);
    setTranslating(false);
  }

  async function handleMatch() {
    if (!file) return;
    setMatching(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append(
        'words',
        JSON.stringify(words.map((w) => ({ id: w.id, front_text: w.front_text }))),
      );

      const data = await fetchWithToast<{
        matches: Omit<MatchedWord, 'selected'>[];
      }>('/api/voca/vocabulary/match-exam-sentences', {
        body: formData,
        errorMessage: '기출 예문 매칭 실패',
        logContext: 'voca_admin.exam_sentence_match',
      });

      setResults(
        data.matches.map((m) => ({
          ...m,
          selected: m.matched,
        })),
      );
      setStep(2);
    } catch {
      // fetchWithToast already shows toast
    } finally {
      setMatching(false);
    }
  }

  async function handleSave() {
    const selected = results.filter((r) => r.selected && r.example_sentence);
    if (selected.length === 0) {
      toast.error('저장할 예문을 선택해주세요.');
      return;
    }
    setSaving(true);
    try {
      await Promise.all(
        selected.map((w) =>
          fetchWithToast('/api/voca/vocabulary', {
            method: 'PATCH',
            body: {
              id: w.id,
              example_sentence: w.example_sentence,
              example_sentence_ko: w.example_sentence_ko,
            },
            silent: true,
            logContext: 'voca_admin.exam_sentence_match',
          }),
        ),
      );
      toast.success(`${selected.length}개 단어에 기출 예문이 저장되었습니다`);
      onUpdate();
      setOpen(false);
      reset();
    } catch {
      toast.error('일부 예문 저장에 실패했습니다');
    } finally {
      setSaving(false);
    }
  }

  function toggleWord(index: number) {
    setResults((prev) =>
      prev.map((r, i) => (i === index ? { ...r, selected: !r.selected } : r)),
    );
  }

  function toggleAll() {
    const allSelected = results.filter((r) => r.matched).every((r) => r.selected);
    setResults((prev) =>
      prev.map((r) => (r.matched ? { ...r, selected: !allSelected } : r)),
    );
  }

  function updateResult(index: number, field: 'example_sentence' | 'example_sentence_ko', value: string) {
    setResults((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value || null } : r)),
    );
  }

  async function handleRetranslate() {
    const targets = results.filter((r) => r.matched && r.example_sentence);
    if (targets.length === 0) return;
    setTranslating(true);
    try {
      const data = await fetchWithToast<{
        translations: { id: string; ko: string }[];
      }>('/api/voca/vocabulary/translate-sentences', {
        body: {
          sentences: targets.map((r) => ({ id: r.id, sentence: r.example_sentence! })),
        },
        errorMessage: '해석 재생성 실패',
        logContext: 'voca_admin.exam_sentence_match',
      });
      const map = new Map(data.translations.map((t) => [t.id, t.ko]));
      setResults((prev) =>
        prev.map((r) => {
          const ko = map.get(r.id);
          return ko ? { ...r, example_sentence_ko: ko } : r;
        }),
      );
      toast.success('해석이 재생성되었습니다');
    } catch {
      // fetchWithToast already shows toast
    } finally {
      setTranslating(false);
    }
  }

  const matchedCount = results.filter((r) => r.matched).length;
  const selectedCount = results.filter((r) => r.selected && r.example_sentence).length;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <FileSearch className="h-3.5 w-3.5 mr-1" />
          기출 예문 매칭
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 1
              ? '기출 예문 매칭'
              : `매칭 결과 (${matchedCount}/${results.length}개 발견)`}
          </DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label>기출 지문 PDF</Label>
              <Input
                type="file"
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              기출 지문 PDF를 업로드하면 {words.length}개 단어에 해당하는 실제 문장을 자동으로 찾아줍니다.
            </p>
            <Button
              className="w-full"
              onClick={handleMatch}
              disabled={!file || matching}
            >
              {matching ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  매칭 중... (30초~1분 소요)
                </>
              ) : (
                '매칭 시작'
              )}
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={matchedCount > 0 && results.filter((r) => r.matched).every((r) => r.selected)}
                  onCheckedChange={toggleAll}
                />
                전체 선택
              </label>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleRetranslate} disabled={translating || matchedCount === 0}>
                  {translating ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Languages className="h-3.5 w-3.5 mr-1" />}
                  {translating ? '번역 중...' : '해석 재생성'}
                </Button>
                <Button size="sm" variant="outline" onClick={reset}>
                  다시 매칭
                </Button>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="p-2 w-8" scope="col" aria-label="선택"></th>
                    <th className="p-2 text-left" scope="col">단어 (뜻)</th>
                    <th className="p-2 text-left" scope="col">기출 예문</th>
                    <th className="p-2 w-16 text-center" scope="col">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => (
                    <tr
                      key={r.id}
                      className={`border-t hover:bg-muted/30 ${!r.matched ? 'opacity-50' : ''}`}
                    >
                      <td className="p-2">
                        <Checkbox
                          checked={r.selected}
                          disabled={!r.matched}
                          onCheckedChange={() => toggleWord(i)}
                        />
                      </td>
                      <td className="p-2 whitespace-nowrap">
                        <span className="font-medium">{r.front_text}</span>
                        <span className="text-muted-foreground ml-1 text-xs">
                          ({words.find((w) => w.id === r.id)?.back_text})
                        </span>
                      </td>
                      <td className="p-1 space-y-1">
                        {r.matched ? (
                          <>
                            <Input
                              className="h-7 text-sm"
                              value={r.example_sentence || ''}
                              onChange={(e) => updateResult(i, 'example_sentence', e.target.value)}
                            />
                            <Input
                              className="h-7 text-sm text-muted-foreground"
                              value={r.example_sentence_ko || ''}
                              onChange={(e) => updateResult(i, 'example_sentence_ko', e.target.value)}
                              placeholder="해석"
                            />
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-2 text-center">
                        {r.matched ? (
                          <Badge variant="default" className="bg-green-600 text-[10px]">발견</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-orange-600 text-[10px]">미발견</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Button
              className="w-full"
              onClick={handleSave}
              disabled={saving || selectedCount === 0}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  저장 중...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  {selectedCount}개 예문 저장
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
