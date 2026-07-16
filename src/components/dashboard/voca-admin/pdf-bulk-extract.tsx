'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { FileText, Loader2, Check, X as XIcon } from 'lucide-react';
import { toast } from 'sonner';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import type { VocaVocabulary } from '@/types/voca';

interface ExtractedWord {
  front_text: string;
  back_text: string;
  part_of_speech: string | null;
  example_sentence: string | null;
  synonyms: string | null;
  antonyms: string | null;
  idioms: { en: string; ko: string; example_en?: string; example_ko?: string }[] | null;
  selected: boolean;
}

export function PdfBulkExtract({ bookId, definitionLang = 'ko', onCreated }: { bookId: string; definitionLang?: 'ko' | 'en'; onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [file, setFile] = useState<File | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [words, setWords] = useState<ExtractedWord[]>([]);
  const [wordsPerDay, setWordsPerDay] = useState(30);
  const [examLabel, setExamLabel] = useState('');

  function reset() {
    setStep(1);
    setFile(null);
    setExtracting(false);
    setProgress(null);
    setSaving(false);
    setWords([]);
    setWordsPerDay(30);
    setExamLabel('');
  }

  async function handleExtract() {
    if (!file) return;
    setExtracting(true);
    try {
      const { uploadForExtract } = await import('@/lib/upload-for-extract');
      // 큰 PDF는 통짜로 보내면 AI 출력 한도(단어 ~150개 분량)에 잘려 실패 →
      // 몇 페이지씩 분할해 순차 추출 후 합친다 (중복 단어는 첫 등장만 유지)
      const { splitPdfIntoChunks } = await import('@/lib/split-pdf');
      const chunks = await splitPdfIntoChunks(file);
      setProgress({ done: 0, total: chunks.length });

      const merged: Omit<ExtractedWord, 'selected'>[] = [];
      const seen = new Set<string>();
      let anySucceeded = false;

      for (let idx = 0; idx < chunks.length; idx++) {
        try {
          const { publicUrl, storagePath } = await uploadForExtract(chunks[idx]);
          const data = await fetchWithToast<{ items: Omit<ExtractedWord, 'selected'>[] }>(
            '/api/voca/vocabulary/extract-pdf',
            {
              body: { pdfUrl: publicUrl, storagePath, bookId, examSource: examLabel.trim() || undefined }, // 정의 언어 분기 + 기출 모드
              errorMessage: chunks.length > 1 ? `${idx + 1}번째 구간 추출 실패 (나머지 계속 진행)` : 'PDF 단어 추출 실패',
              logContext: 'voca_admin.pdf_bulk',
            },
          );
          anySucceeded = true;
          for (const item of data.items) {
            const key = item.front_text?.toLowerCase().trim();
            if (!key || seen.has(key)) continue;
            seen.add(key);
            merged.push(item);
          }
        } catch {
          // 개별 구간 실패는 토스트로 안내 — 나머지 구간은 계속 진행
        } finally {
          setProgress({ done: idx + 1, total: chunks.length });
        }
      }

      if (!anySucceeded) return; // 전부 실패 → step1 유지
      setWords(merged.map((item) => ({ ...item, selected: true })));
      setStep(2);
    } finally {
      setExtracting(false);
      setProgress(null);
    }
  }

  // 선택된 단어를 Day별로 분할 미리보기
  const selectedWords = words.filter((w) => w.selected);
  const dayChunks: ExtractedWord[][] = [];
  for (let i = 0; i < selectedWords.length; i += wordsPerDay) {
    dayChunks.push(selectedWords.slice(i, i + wordsPerDay));
  }

  async function autoEnrichDays(dayIds: string[]) {
    const toastId = toast.loading(`2회독 데이터 자동 생성 중... (0/${dayIds.length})`);
    let done = 0;

    for (const dayId of dayIds) {
      try {
        const vocab = await fetchWithToast<VocaVocabulary[]>(
          `/api/voca/vocabulary?dayId=${dayId}`,
          { method: 'GET', silent: true, logContext: 'voca_admin.auto_enrich' },
        );
        const needsEnrich = (vocab || []).filter(
          (v) => !v.synonyms && !v.antonyms && !v.example_sentence,
        );
        if (needsEnrich.length > 0) {
          await fetchWithToast('/api/voca/vocabulary/enrich-round2', {
            body: {
              items: needsEnrich.map((v) => ({
                id: v.id,
                front_text: v.front_text,
                back_text: v.back_text,
                part_of_speech: v.part_of_speech,
                example_sentence: v.example_sentence,
                spelling_answer: v.spelling_answer,
              })),
              bookId, // 교재 정의 언어(영한/영영) 자동 분기용
            },
            silent: true,
            logContext: 'voca_admin.auto_enrich',
          });
        }
      } catch {
        // enrichment 실패해도 Day 생성에는 영향 없음
      }
      done++;
      toast.loading(`2회독 데이터 자동 생성 중... (${done}/${dayIds.length})`, { id: toastId });
    }

    toast.success(`${done}개 Day의 2회독 데이터가 자동 생성되었습니다`, { id: toastId });
  }

  async function handleSave() {
    if (selectedWords.length === 0) {
      toast.error('저장할 단어를 선택해주세요.');
      return;
    }
    setSaving(true);
    try {
      const items = selectedWords.map(({ selected: _selected, ...rest }) => ({
        ...rest,
        spelling_answer: rest.front_text,
      }));

      const data = await fetchWithToast<{ days: { id: string }[]; totalWords: number }>(
        '/api/voca/days-with-vocabulary',
        {
          body: {
            book_id: bookId,
            words_per_day: wordsPerDay,
            items: items.map((it) => ({ ...it, exam_source: examLabel.trim() || null })),
          },
          errorMessage: '저장 실패',
          logContext: 'voca_admin.pdf_bulk',
        },
      );

      toast.success(`${data.days.length}개 Day, ${data.totalWords}개 단어가 생성되었습니다`);
      onCreated();
      setOpen(false);
      reset();

      // Day 저장 후 자동으로 2회독 데이터 보강 실행
      autoEnrichDays(data.days.map((d) => d.id));
    } catch {
      // fetchWithToast already shows toast
    } finally {
      setSaving(false);
    }
  }

  function updateWord(index: number, field: keyof ExtractedWord, value: string) {
    setWords((prev) =>
      prev.map((w, i) => (i === index ? { ...w, [field]: value || null } : w))
    );
  }

  function toggleWord(index: number) {
    setWords((prev) =>
      prev.map((w, i) => (i === index ? { ...w, selected: !w.selected } : w))
    );
  }

  function toggleAll() {
    const allSelected = words.every((w) => w.selected);
    setWords((prev) => prev.map((w) => ({ ...w, selected: !allSelected })));
  }

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
          <FileText className="h-4 w-4 mr-1" />
          PDF 대량 추출
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 1
              ? 'PDF 대량 추출 → Day 자동 분할'
              : `추출 결과 (${selectedWords.length}/${words.length}개 선택)`}
          </DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            {/* 교재 정의 언어 확인 — 잘못 설정된 채 추출하는 실수 방지 */}
            <div className={`rounded-lg px-3 py-2 text-xs font-semibold ${
              definitionLang === 'en' ? 'bg-brand-50 text-brand-700' : 'bg-gray-50 text-gray-600'
            }`}>
              {definitionLang === 'en'
                ? '🌐 이 교재는 영영(영어 정의) 모드예요 — 뜻이 영어로 생성되고 한글 해석은 만들지 않아요.'
                : '🇰🇷 이 교재는 영한(한글 뜻) 모드예요 — 국제학교·유학생용 영영 교재라면 추출 전에 교재 수정에서 바꿔주세요.'}
            </div>
            <div>
              <Label>기출 시험명 (선택)</Label>
              <Input
                value={examLabel}
                onChange={(e) => setExamLabel(e.target.value)}
                placeholder="예: 2026년 3월 고1 모의고사 — 기출 지문 PDF일 때만 입력"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                입력하면 예문을 지문의 실제 문장으로 추출하고, 학생 화면에 &ldquo;📄 기출&rdquo; 뱃지가 붙어요.
              </p>
            </div>
            <div>
              <Label>PDF 파일 선택</Label>
              <Input
                type="file"
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              PDF를 업로드하면 AI가 단어를 추출하고, 설정한 개수만큼 Day별로 자동 분할합니다.
            </p>
            <Button
              className="w-full"
              onClick={handleExtract}
              disabled={!file || extracting}
            >
              {extracting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {progress && progress.total > 1
                    ? `추출 중... (${progress.done}/${progress.total}구간)`
                    : '추출 중... (30초~1분 소요)'}
                </>
              ) : (
                '단어 추출'
              )}
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            {/* Day 분할 설정 */}
            <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Label className="whitespace-nowrap">Day당 단어 수</Label>
                <Input
                  type="number"
                  className="w-20 h-8"
                  value={wordsPerDay}
                  onChange={(e) => setWordsPerDay(Math.max(1, Number(e.target.value) || 1))}
                  min={1}
                  max={200}
                />
              </div>
              <div className="flex flex-wrap gap-1.5 text-xs">
                {dayChunks.map((chunk, i) => (
                  <span key={i} className="px-2 py-0.5 bg-brand-100 text-brand-700 rounded-full">
                    Day {i + 1} ({chunk.length}단어)
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={words.length > 0 && words.every((w) => w.selected)}
                  onCheckedChange={toggleAll}
                />
                전체 선택
              </label>
              <Button size="sm" variant="outline" onClick={() => reset()}>
                다시 추출
              </Button>
            </div>

            <div className="max-h-96 overflow-y-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="p-2 w-8" scope="col" aria-label="선택"></th>
                    <th className="p-2 text-left" scope="col">단어</th>
                    <th className="p-2 text-left" scope="col">뜻</th>
                    <th className="p-2 text-left hidden sm:table-cell" scope="col">품사</th>
                    <th className="p-2 text-left hidden md:table-cell" scope="col">예문</th>
                    <th className="p-2 w-8" scope="col" aria-label="삭제"></th>
                  </tr>
                </thead>
                <tbody>
                  {words.map((w, i) => (
                    <tr
                      key={i}
                      className={`border-t hover:bg-muted/30 ${!w.selected ? 'opacity-40' : ''}`}
                    >
                      <td className="p-2">
                        <Checkbox
                          checked={w.selected}
                          onCheckedChange={() => toggleWord(i)}
                        />
                      </td>
                      <td className="p-1">
                        <Input className="h-7 text-sm font-medium" value={w.front_text} onChange={(e) => updateWord(i, 'front_text', e.target.value)} />
                      </td>
                      <td className="p-1">
                        <Input className="h-7 text-sm" value={w.back_text} onChange={(e) => updateWord(i, 'back_text', e.target.value)} />
                      </td>
                      <td className="p-1 hidden sm:table-cell">
                        <Input className="h-7 text-sm w-16" value={w.part_of_speech || ''} onChange={(e) => updateWord(i, 'part_of_speech', e.target.value)} />
                      </td>
                      <td className="p-1 hidden md:table-cell">
                        <Input className="h-7 text-sm" value={w.example_sentence || ''} onChange={(e) => updateWord(i, 'example_sentence', e.target.value)} placeholder="예문 입력" />
                      </td>
                      <td className="p-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() =>
                            setWords((prev) => prev.filter((_, idx) => idx !== i))
                          }
                          aria-label="삭제"
                        >
                          <XIcon className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Button
              className="w-full"
              onClick={handleSave}
              disabled={saving || selectedWords.length === 0}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  저장 중...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  {dayChunks.length}개 Day, {selectedWords.length}개 단어 저장
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
