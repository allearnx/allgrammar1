'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import { scoreChipClass } from '@/lib/utils/progress-styles';
import { VocaDayShareButton } from './voca-day-share-button';
import type { VocaBook, VocaDay } from '@/types/voca';

interface StudentResult {
  studentId: string;
  studentName: string;
  progress: {
    flashcard_completed: boolean;
    quiz_score: number | null;
    spelling_score: number | null;
    matching_score: number | null;
    matching_completed: boolean;
    updated_at: string;
  } | null;
  wrongWords: {
    quiz: { front_text: string; back_text: string }[];
    spelling: { front_text: string; back_text: string }[];
    matching: { word: string; match: string; type: string }[];
  };
}

type Status = 'completed' | 'in_progress' | 'not_started';

function getStatus(p: StudentResult['progress']): Status {
  if (!p) return 'not_started';
  if (p.flashcard_completed && p.quiz_score !== null && p.spelling_score !== null && p.matching_completed) {
    return 'completed';
  }
  return 'in_progress';
}

const STATUS_CONFIG: Record<Status, { label: string; className: string }> = {
  completed: { label: '완료', className: 'bg-green-100 text-green-700' },
  in_progress: { label: '진행중', className: 'bg-amber-100 text-amber-700' },
  not_started: { label: '미시작', className: 'bg-gray-100 text-gray-500' },
};

function hasWrongWords(s: StudentResult) {
  return s.wrongWords.quiz.length > 0 || s.wrongWords.spelling.length > 0 || s.wrongWords.matching.length > 0;
}

const MATCHING_TYPE_LABEL: Record<string, string> = {
  synonym: '유의어',
  antonym: '반의어',
  example: '예문',
};

export function VocaDayResultsClient() {
  const [books, setBooks] = useState<VocaBook[]>([]);
  const [days, setDays] = useState<VocaDay[]>([]);
  const [selectedBookId, setSelectedBookId] = useState('');
  const [selectedDayId, setSelectedDayId] = useState('');
  const [students, setStudents] = useState<StudentResult[]>([]);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [loadingDays, setLoadingDays] = useState(false);
  const [loadingResults, setLoadingResults] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Fetch books on mount
  useEffect(() => {
    (async () => {
      try {
        const data = await fetchWithToast<VocaBook[]>('/api/voca/books', { method: 'GET', silent: true });
        const active = data.filter((b) => b.is_active);
        setBooks(active);
        if (active.length > 0) {
          setSelectedBookId(active[0].id);
        }
      } finally {
        setLoadingBooks(false);
      }
    })();
  }, []);

  // Fetch days when book changes
  useEffect(() => {
    if (!selectedBookId) {
      setDays([]);
      setSelectedDayId('');
      return;
    }
    setLoadingDays(true);
    setSelectedDayId('');
    setStudents([]);
    (async () => {
      try {
        const data = await fetchWithToast<VocaDay[]>(`/api/voca/days?bookId=${selectedBookId}`, {
          method: 'GET',
          silent: true,
        });
        setDays(data);
        if (data.length > 0) {
          setSelectedDayId(data[0].id);
        }
      } finally {
        setLoadingDays(false);
      }
    })();
  }, [selectedBookId]);

  // Fetch results when day changes
  const fetchResults = useCallback(async () => {
    if (!selectedDayId) {
      setStudents([]);
      return;
    }
    setLoadingResults(true);
    try {
      const data = await fetchWithToast<{ students: StudentResult[] }>(
        `/api/voca/day-results?dayId=${selectedDayId}`,
        { method: 'GET', silent: true },
      );
      setStudents(data.students);
    } finally {
      setLoadingResults(false);
    }
  }, [selectedDayId]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  if (loadingBooks) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (books.length === 0) {
    return <p className="text-sm text-gray-500 py-8 text-center">등록된 교재가 없습니다.</p>;
  }

  const completedCount = students.filter((s) => getStatus(s.progress) === 'completed').length;
  const inProgressCount = students.filter((s) => getStatus(s.progress) === 'in_progress').length;

  return (
    <div className="space-y-4">
      {/* Selectors */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={selectedBookId}
          onChange={(e) => setSelectedBookId(e.target.value)}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          {books.map((b) => (
            <option key={b.id} value={b.id}>{b.title}</option>
          ))}
        </select>

        <select
          value={selectedDayId}
          onChange={(e) => setSelectedDayId(e.target.value)}
          disabled={loadingDays || days.length === 0}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-50"
        >
          {loadingDays ? (
            <option>로딩 중...</option>
          ) : days.length === 0 ? (
            <option>Day 없음</option>
          ) : (
            days.map((d) => (
              <option key={d.id} value={d.id}>Day {d.day_number} — {d.title}</option>
            ))
          )}
        </select>
      </div>

      {/* Summary */}
      {students.length > 0 && (
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>전체 <strong>{students.length}</strong>명</span>
          <span className="text-green-600">완료 <strong>{completedCount}</strong></span>
          <span className="text-amber-600">진행중 <strong>{inProgressCount}</strong></span>
          <span className="text-gray-400">미시작 <strong>{students.length - completedCount - inProgressCount}</strong></span>
        </div>
      )}

      {/* Results table */}
      {loadingResults ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : students.length === 0 ? (
        <p className="text-sm text-gray-500 py-8 text-center">
          {selectedDayId ? '보카 서비스가 배정된 학생이 없습니다.' : 'Day를 선택하세요.'}
        </p>
      ) : (
        <div className="rounded-lg border bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-gray-600">
                <th className="px-4 py-3 font-medium">이름</th>
                <th className="px-4 py-3 font-medium text-center">플래시카드</th>
                <th className="px-4 py-3 font-medium text-center">스펠링</th>
                <th className="px-4 py-3 font-medium text-center">매칭</th>
                <th className="px-4 py-3 font-medium text-center">퀴즈</th>
                <th className="px-4 py-3 font-medium text-center">상태</th>
                <th className="px-4 py-3 font-medium text-center">공유</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => {
                const status = getStatus(s.progress);
                const cfg = STATUS_CONFIG[status];
                const hasWrong = hasWrongWords(s);
                const isExpanded = expandedId === s.studentId;
                return (
                  <React.Fragment key={s.studentId}>
                    <tr
                      className={`border-b hover:bg-gray-50 ${hasWrong ? 'cursor-pointer' : ''} ${isExpanded ? 'border-b-0 bg-gray-50' : ''}`}
                      onClick={() => hasWrong && setExpandedId(isExpanded ? null : s.studentId)}
                    >
                      <td className="px-4 py-3 font-medium text-gray-800">
                        <span className="inline-flex items-center gap-1">
                          {s.studentName}
                          {hasWrong && (
                            isExpanded
                              ? <ChevronUp className="h-4 w-4 text-gray-400" />
                              : <ChevronDown className="h-4 w-4 text-gray-400" />
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {s.progress?.flashcard_completed ? (
                          <span className="text-green-600">✅</span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {s.progress?.spelling_score != null ? (
                          <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${scoreChipClass(s.progress.spelling_score)}`}>
                            {s.progress.spelling_score}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {s.progress?.matching_score != null ? (
                          <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${scoreChipClass(s.progress.matching_score)}`}>
                            {s.progress.matching_score}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {s.progress?.quiz_score != null ? (
                          <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${scoreChipClass(s.progress.quiz_score)}`}>
                            {s.progress.quiz_score}
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.className}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <VocaDayShareButton studentId={s.studentId} dayId={selectedDayId} />
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="border-b bg-gray-50">
                        <td colSpan={7} className="px-6 pb-4 pt-2">
                          <div className="space-y-3">
                            {s.wrongWords.quiz.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-gray-500 mb-1">퀴즈 오답</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {s.wrongWords.quiz.map((w, i) => (
                                    <span key={i} className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-1 text-xs text-red-700">
                                      {w.front_text} → {w.back_text}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {s.wrongWords.spelling.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-gray-500 mb-1">스펠링 오답</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {s.wrongWords.spelling.map((w, i) => (
                                    <span key={i} className="inline-flex items-center rounded-full bg-brand-50 px-2.5 py-1 text-xs text-brand-700">
                                      {w.front_text}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {s.wrongWords.matching.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-gray-500 mb-1">매칭 오답</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {s.wrongWords.matching.map((w, i) => (
                                    <span key={i} className="inline-flex items-center rounded-full bg-orange-50 px-2.5 py-1 text-xs text-orange-700">
                                      {w.word} → {w.match}
                                      <span className="ml-1 text-orange-400">[{MATCHING_TYPE_LABEL[w.type] || w.type}]</span>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
