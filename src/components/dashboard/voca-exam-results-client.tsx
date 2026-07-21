'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import { VocaDayShareButton } from '@/components/dashboard/voca-day-share-button';
import type { VocaBook } from '@/types/voca';
import { Inbox, Loader2, ChevronDown } from 'lucide-react';

type WrongWord = { front_text: string; back_text: string };
interface ExamGroup {
  rangeKey: string;
  dayIds: string[];
  examType: 'headword' | 'syn_ant';
  attempts: number;
  bestScore: number;
  wrongWords: WrongWord[];
  isToday: boolean;
  lastAttemptAt: string;
}
interface StudentExams {
  studentId: string;
  studentName: string;
  exams: ExamGroup[];
  hasToday: boolean;
}

const PASS = 90;

export function VocaExamResultsClient() {
  const [books, setBooks] = useState<VocaBook[]>([]);
  const [selectedBookId, setSelectedBookId] = useState('');
  const [students, setStudents] = useState<StudentExams[]>([]);
  const [dayTitles, setDayTitles] = useState<Record<string, string>>({});
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchWithToast<VocaBook[]>('/api/voca/books', { method: 'GET', silent: true });
        setBooks(data ?? []);
        if (data && data.length > 0) setSelectedBookId(data[0].id);
      } finally {
        setLoadingBooks(false);
      }
    })();
  }, []);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      const qs = selectedBookId ? `?bookId=${selectedBookId}` : '';
      const data = await fetchWithToast<{ students: StudentExams[]; dayTitles: Record<string, string> }>(
        `/api/voca/exam-results${qs}`,
        { method: 'GET', silent: true },
      );
      setStudents(data?.students ?? []);
      setDayTitles(data?.dayTitles ?? {});
    } finally {
      setLoading(false);
    }
  }, [selectedBookId]);

  useEffect(() => { fetchResults(); }, [fetchResults]);

  const rangeLabel = (dayIds: string[]) =>
    dayIds.map((id) => dayTitles[id] ?? '?').join(' + ');

  if (loadingBooks) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-rose-50/50 px-4 py-3 text-sm text-rose-600">
        🎁 학생들이 본 <strong>묶음 시험(1회독 표제어 · 2회독 유의어·반의어)</strong> 결과입니다. Day 조합별 최고점·재응시 횟수·오답을 확인하세요.
      </div>

      {/* 교재 선택 */}
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-500">교재</label>
        <select
          value={selectedBookId}
          onChange={(e) => setSelectedBookId(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        >
          {books.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
      ) : students.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-16 text-gray-400">
          <Inbox className="h-8 w-8" />
          <p className="text-sm">아직 응시한 학생이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {students.map((s) => (
            <div key={s.studentId} className="rounded-xl border bg-white">
              <div className="flex items-center justify-between px-4 py-3">
                <button
                  onClick={() => setExpanded(expanded === s.studentId ? null : s.studentId)}
                  className="flex flex-1 items-center gap-2 text-left"
                >
                  <span className="font-medium text-gray-900">{s.studentName}</span>
                  {s.hasToday && (
                    <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-600">오늘 응시</span>
                  )}
                </button>
                <span className="flex items-center gap-2 text-xs text-gray-400">
                  <VocaDayShareButton studentId={s.studentId} />
                  시험 {s.exams.length}건
                  <button onClick={() => setExpanded(expanded === s.studentId ? null : s.studentId)} aria-label="펼치기">
                    <ChevronDown className={`h-4 w-4 transition-transform ${expanded === s.studentId ? 'rotate-180' : ''}`} />
                  </button>
                </span>
              </div>
              {expanded === s.studentId && (
                <div className="border-t px-4 py-3 space-y-3">
                  {s.exams.map((ex) => (
                    <div key={`${ex.rangeKey}-${ex.examType}`} className="rounded-lg bg-gray-50 px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 text-sm font-medium text-gray-800">
                          {ex.isToday && <span className="rounded bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">오늘</span>}
                          <span className="rounded-full px-1.5 py-0.5 text-[10px] font-bold" style={{ background: ex.examType === 'syn_ant' ? '#E8F0FE' : '#E6F4EA', color: ex.examType === 'syn_ant' ? '#174EA6' : '#188038' }}>
                            {ex.examType === 'syn_ant' ? '2회독' : '1회독'}
                          </span>
                          {rangeLabel(ex.dayIds)}
                        </span>
                        <span className="flex items-center gap-2 shrink-0">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${ex.bestScore >= PASS ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            최고 {ex.bestScore}점
                          </span>
                          <span className="text-xs text-gray-400">재응시 {ex.attempts}회</span>
                        </span>
                      </div>
                      {ex.wrongWords.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          <span className="text-[11px] text-gray-400">오답:</span>
                          {ex.wrongWords.map((w, i) => (
                            <span key={i} className="rounded bg-red-50 px-1.5 py-0.5 text-[11px] text-red-600">
                              {w.front_text}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
