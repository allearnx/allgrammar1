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
import { chunkLabel } from '@/lib/split-pdf';
import type { VocabDialogProps } from './types';
import { getVocabConfig } from './types';

interface ExtractedWord {
  front_text: string;
  back_text: string;
  part_of_speech: string | null;
  example_sentence: string | null;
  example_sentence_ko: string | null;
  synonyms: string | null;
  antonyms: string | null;
  idioms: { en: string; ko: string; example_en?: string; example_ko?: string }[] | null;
  selected: boolean;
}

export function PdfVocabExtract({ module, parentId, onAdd, definitionLang }: VocabDialogProps & { definitionLang?: 'ko' | 'en' }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [files, setFiles] = useState<File[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [words, setWords] = useState<ExtractedWord[]>([]);
  // 추출 실패한 구간/파일 — 배너로 알리고 그것만 재시도 가능
  const [failedChunks, setFailedChunks] = useState<File[]>([]);
  const [examLabel, setExamLabel] = useState('');
  const cfg = getVocabConfig(module);

  function reset() {
    setStep(1);
    setFiles([]);
    setExtracting(false);
    setProgress(null);
    setSaving(false);
    setWords([]);
    setFailedChunks([]);
    setExamLabel('');
  }

  /** 파일/구간 목록을 순차 추출해 기존 words에 병합. 실패분은 failedChunks로 보관. */
  async function runExtraction(chunkFiles: File[], existing: ExtractedWord[]) {
    const { uploadForExtract } = await import('@/lib/upload-for-extract');
    // front_text(소문자) 기준 중복 제거하며 순차 추출 → 합치기.
    const merged = [...existing];
    const seen = new Set(existing.map((w) => w.front_text.toLowerCase().trim()));
    const failed: File[] = [];
    setProgress({ done: 0, total: chunkFiles.length });

    for (let idx = 0; idx < chunkFiles.length; idx++) {
      const file = chunkFiles[idx];
      try {
        const { publicUrl, storagePath } = await uploadForExtract(file);
        const isImage = file.type.startsWith('image/');
        const data = await fetchWithToast<{ items: Omit<ExtractedWord, 'selected'>[] }>(
          `${cfg.apiBase}/extract-pdf`,
          {
            body: {
              ...(isImage ? { imageUrl: publicUrl } : { pdfUrl: publicUrl }),
              storagePath,
              // voca: 교재 정의 언어(영한/영영) 자동 분기용 (API가 day→교재 역추적)
              ...(module === 'voca' ? { dayId: parentId, examSource: examLabel.trim() || undefined } : {}),
            },
            errorMessage: `${chunkLabel(file)} 구간 단어 추출 실패 (나머지 계속 진행)`,
            logContext: `${cfg.logPrefix}.pdf_vocab_extract`,
            retry: 1, // 일시적 5xx(AI 과부하 등)는 한 번 자동 재시도
          },
        );
        for (const item of data.items) {
          const key = item.front_text?.toLowerCase().trim();
          if (!key || seen.has(key)) continue;
          seen.add(key);
          merged.push({ ...item, selected: true });
        }
      } catch {
        failed.push(file); // 실패분 보관 — 배너에서 재시도
      } finally {
        setProgress({ done: idx + 1, total: chunkFiles.length });
      }
    }

    setWords(merged);
    setFailedChunks(failed);
    return { anySucceeded: chunkFiles.length > failed.length };
  }

  async function handleExtract() {
    if (files.length === 0) return;
    setExtracting(true);
    try {
      // 큰 PDF는 AI 출력 한도에 잘려 실패 → 페이지 단위로 분할해 순차 처리
      const { splitPdfIntoChunks } = await import('@/lib/split-pdf');
      const expanded: File[] = [];
      for (const f of files) expanded.push(...(await splitPdfIntoChunks(f)));

      const { anySucceeded } = await runExtraction(expanded, []);
      if (!anySucceeded) return; // 전부 실패 → step1 유지
      setStep(2);
    } finally {
      setExtracting(false);
      setProgress(null);
    }
  }

  /** 실패했던 구간/파일만 다시 추출 — 성공분은 기존 결과에 병합 */
  async function handleRetryFailed() {
    if (failedChunks.length === 0) return;
    setExtracting(true);
    try {
      await runExtraction(failedChunks, words);
    } finally {
      setExtracting(false);
      setProgress(null);
    }
  }

  async function handleSave() {
    const selectedWords = words.filter((w) => w.selected);
    if (selectedWords.length === 0) {
      toast.error('저장할 단어를 선택해주세요.');
      return;
    }
    setSaving(true);
    try {
      const items = selectedWords.map(({ selected: _selected, ...rest }) => ({
        ...rest,
        spelling_answer: rest.front_text,
        ...(module === 'voca' && examLabel.trim() ? { exam_source: examLabel.trim() } : {}),
      }));

      const data = await fetchWithToast<{ count: number }>(`${cfg.apiBase}/bulk`, {
        body: { [cfg.parentIdKey]: parentId, items },
        errorMessage: '단어 저장 실패',
        logContext: `${cfg.logPrefix}.pdf_vocab_extract`,
      });
      onAdd();
      setOpen(false);
      reset();
      toast.success(`${data.count}개 단어가 추가되었습니다`);
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

  const selectedCount = words.filter((w) => w.selected).length;
  const pdfLabel = module === 'naesin' ? '교과서 PDF' : 'PDF';

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        // 추출/저장 중 닫힘 방지 — 실수 클릭에 장시간 작업이 증발하는 사고 방지
        if (!v && (extracting || saving)) return;
        // 추출 결과가 있는 상태에선 닫기 전 확인
        if (!v && step === 2 && words.length > 0 && !window.confirm('추출된 단어가 사라집니다. 창을 닫을까요?')) return;
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <FileText className="h-3.5 w-3.5 mr-1" />
          PDF·이미지 단어 추출
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 1 ? 'PDF·이미지 단어 추출' : `추출 결과 (${selectedCount}/${words.length}개 선택)`}
          </DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            {/* 교재 정의 언어 확인 — 잘못 설정된 채 추출하는 실수 방지 (voca 전용) */}
            {module === 'voca' && definitionLang && (
              <div className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                definitionLang === 'en' ? 'bg-brand-50 text-brand-700' : 'bg-gray-50 text-gray-600'
              }`}>
                {definitionLang === 'en'
                  ? '🌐 이 교재는 영영(영어 정의) 모드예요 — 뜻이 영어로 생성되고 한글 해석은 만들지 않아요.'
                  : '🇰🇷 이 교재는 영한(한글 뜻) 모드예요 — 국제학교·유학생용 영영 교재라면 추출 전에 교재 수정에서 바꿔주세요.'}
              </div>
            )}
            {module === 'voca' && (
              <div>
                <Label>기출 시험명 (선택)</Label>
                <Input
                  value={examLabel}
                  onChange={(e) => setExamLabel(e.target.value)}
                  placeholder="예: 2026년 3월 고1 모의고사 — 기출 지문일 때만 입력"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  입력하면 예문을 지문의 실제 문장으로 추출하고, 학생 화면에 &ldquo;📄 기출&rdquo; 뱃지가 붙어요.
                </p>
              </div>
            )}
            <div>
              <Label>PDF 또는 이미지 파일 선택 (여러 장 가능)</Label>
              <Input
                type="file"
                multiple
                accept="application/pdf,image/png,image/jpeg,image/webp,image/gif"
                onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
              />
              {files.length > 0 && (
                <p className="mt-1 text-xs text-muted-foreground">{files.length}개 파일 선택됨</p>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {pdfLabel} 또는 <strong>단어 목록 사진/이미지</strong>를 올리면 AI가 단어를 읽어
              뜻·품사·예문·해석·유의어·반의어까지 자동 생성합니다. 여러 장은 순서대로 처리해
              중복 단어를 합칩니다.
            </p>
            <Button
              className="w-full"
              onClick={handleExtract}
              disabled={files.length === 0 || extracting}
            >
              {extracting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {progress && progress.total > 1
                    ? `추출 중... (${progress.done}/${progress.total}장)`
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
            {/* 실패 구간 안내 + 부분 재시도 — 어느 페이지가 빠졌는지 명확히 */}
            {failedChunks.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
                <p className="text-xs font-semibold text-amber-800">
                  ⚠️ {failedChunks.map((f) => chunkLabel(f)).join(', ')} 구간 추출 실패 — 이 부분 단어는 아래 목록에 없어요
                </p>
                <Button size="sm" variant="outline" className="h-7 border-amber-300 text-amber-700 hover:bg-amber-100" onClick={handleRetryFailed} disabled={extracting}>
                  {extracting ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : null}
                  실패 구간만 다시 추출
                </Button>
              </div>
            )}

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
                      <td className="p-1 hidden md:table-cell space-y-1">
                        <Input className="h-7 text-sm" value={w.example_sentence || ''} onChange={(e) => updateWord(i, 'example_sentence', e.target.value)} placeholder="예문 입력" />
                        <Input className="h-7 text-sm text-muted-foreground" value={w.example_sentence_ko || ''} onChange={(e) => updateWord(i, 'example_sentence_ko', e.target.value)} placeholder="예문 해석" />
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
                  {selectedCount}개 단어 저장
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
