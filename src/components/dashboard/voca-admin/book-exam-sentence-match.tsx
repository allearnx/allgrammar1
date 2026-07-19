'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { FileSearch, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import type { VocaDay, VocaVocabulary } from '@/types/voca';

interface DayResult {
  dayTitle: string;
  total: number;
  matched: number;
  failed: boolean;
}

/**
 * 교재 전체 기출 예문 일괄 매칭 — 지문 PDF 한 번 올리면 전 Day를 순회하며
 * 각 단어가 지문에서 실제로 쓰인 문장을 찾아 예문으로 교체 (exam_source 뱃지 포함).
 * Day별로 "기출 예문 매칭"을 반복해야 했던 수고를 없앤다.
 * 매칭된 문장은 자동 저장, 못 찾은 단어는 기존 예문 유지.
 */
export function BookExamSentenceMatch({ days, onDone }: { days: VocaDay[]; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [examLabel, setExamLabel] = useState('');
  const [running, setRunning] = useState(false);
  // 이미 기출 예문(exam_source)이 붙은 단어는 건너뛰기 — 회차별 지문을 연달아
  // 올릴 때 앞서 매칭된 예문이 덮어써지지 않고 빈 단어만 채워진다 (기본 켜짐)
  const [skipMatched, setSkipMatched] = useState(true);
  const [progress, setProgress] = useState<{ done: number; total: number; matched: number } | null>(null);
  const [results, setResults] = useState<DayResult[] | null>(null);

  function reset() {
    setFile(null);
    setExamLabel('');
    setRunning(false);
    setSkipMatched(true);
    setProgress(null);
    setResults(null);
  }

  async function handleRun() {
    if (!file || !examLabel.trim()) return;
    setRunning(true);
    setResults(null);
    const dayResults: DayResult[] = [];
    let matchedTotal = 0;
    setProgress({ done: 0, total: days.length, matched: 0 });

    try {
      for (let i = 0; i < days.length; i++) {
        const day = days[i];
        try {
          const vocab = await fetchWithToast<VocaVocabulary[]>(
            `/api/voca/vocabulary?dayId=${day.id}`,
            { method: 'GET', silent: true, logContext: 'voca_admin.book_exam_match' },
          );
          // 건너뛰기 켜짐: 아직 기출 예문이 없는 단어만 매칭 대상 (이미 다 찬 Day는 통째 스킵)
          const words = (vocab || []).filter((w) => (skipMatched ? !w.exam_source : true));
          if (words.length === 0) {
            dayResults.push({ dayTitle: day.title, total: 0, matched: 0, failed: false });
            continue;
          }

          const formData = new FormData();
          formData.append('file', file);
          formData.append('words', JSON.stringify(words.map((w) => ({ id: w.id, front_text: w.front_text }))));

          const data = await fetchWithToast<{
            matches: { id: string; matched: boolean; example_sentence: string | null; example_sentence_ko: string | null }[];
          }>('/api/voca/vocabulary/match-exam-sentences', {
            body: formData,
            errorMessage: `${day.title} 매칭 실패 (나머지 계속 진행)`,
            logContext: 'voca_admin.book_exam_match',
            retry: 1,
          });

          const hits = data.matches.filter((m) => m.matched && m.example_sentence);
          await Promise.all(
            hits.map((m) =>
              fetchWithToast('/api/voca/vocabulary', {
                method: 'PATCH',
                body: {
                  id: m.id,
                  example_sentence: m.example_sentence,
                  example_sentence_ko: m.example_sentence_ko,
                  exam_source: examLabel.trim(), // 학생 화면 "📄 기출" 뱃지의 근거
                  // 예문이 바뀌면 기존 음원은 이전 문장을 읽음 — 초기화해서 재생성 대상으로
                  audio_url: null,
                  word_timestamps: null,
                },
                silent: true,
                logContext: 'voca_admin.book_exam_match',
              }),
            ),
          );
          matchedTotal += hits.length;
          dayResults.push({ dayTitle: day.title, total: words.length, matched: hits.length, failed: false });
        } catch {
          dayResults.push({ dayTitle: day.title, total: 0, matched: 0, failed: true });
        } finally {
          setProgress({ done: i + 1, total: days.length, matched: matchedTotal });
        }
      }

      setResults(dayResults);
      toast.success(`일괄 매칭 완료 — 총 ${matchedTotal}개 단어에 기출 예문 저장`);
      onDone();
    } finally {
      setRunning(false);
      setProgress(null);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v && running) return; // 실행 중 닫힘 방지
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <FileSearch className="h-4 w-4 mr-1" />
          기출 예문 일괄 매칭
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>기출 예문 일괄 매칭 (전체 Day)</DialogTitle>
        </DialogHeader>

        {!results ? (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              기출 지문 PDF를 한 번 올리면 <strong>전체 {days.length}개 Day</strong>를 돌며 각 단어가
              지문에서 실제로 쓰인 문장을 찾아 예문으로 교체합니다. 매칭된 문장은 자동 저장되고,
              못 찾은 단어는 기존 예문이 유지돼요. (Day당 30초~1분 소요)
            </p>
            <div>
              <Label>기출 시험명 (필수)</Label>
              <Input
                value={examLabel}
                onChange={(e) => setExamLabel(e.target.value)}
                placeholder="예: 2026년 3월 고1 모의고사"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                학생 화면 예문에 &ldquo;📄 {examLabel.trim() || '시험명'} 기출&rdquo; 뱃지로 표시돼요.
              </p>
            </div>
            <div>
              <Label>기출 지문 PDF</Label>
              <Input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </div>
            <label className="flex items-start gap-2 text-sm cursor-pointer">
              <Checkbox checked={skipMatched} onCheckedChange={(v) => setSkipMatched(v === true)} className="mt-0.5" />
              <span>
                이미 기출 예문이 붙은 단어는 건너뛰기
                <span className="block text-xs text-muted-foreground">
                  회차별 지문을 연달아 올릴 때 켜두세요 — 빈 단어만 채워지고 기존 매칭은 유지돼요
                </span>
              </span>
            </label>
            <Button className="w-full" onClick={handleRun} disabled={!file || !examLabel.trim() || running}>
              {running ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {progress
                    ? `매칭 중... (Day ${progress.done}/${progress.total} · 누적 ${progress.matched}개)`
                    : '매칭 중...'}
                </>
              ) : (
                `${days.length}개 Day 일괄 매칭 시작`
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-800">
              완료 — 총 {results.reduce((s, r) => s + r.matched, 0)}개 단어에 기출 예문 저장
            </p>
            <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border p-2 text-sm">
              {results.map((r, i) => (
                <div key={i} className="flex items-center justify-between px-2 py-1">
                  <span className="text-gray-700">{r.dayTitle}</span>
                  {r.failed ? (
                    <span className="text-xs font-bold text-red-500">실패</span>
                  ) : (
                    <span className="text-xs text-gray-500">{r.matched}/{r.total} 매칭</span>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              실패한 Day는 해당 Day를 펼쳐 &ldquo;기출 예문 매칭&rdquo;으로 개별 재시도할 수 있어요.
            </p>
            <Button className="w-full" variant="outline" onClick={() => { setOpen(false); reset(); }}>
              닫기
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
