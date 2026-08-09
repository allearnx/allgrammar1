'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import type { VocaBook, VocaDay } from '@/types/voca';
import { X, Plus, Search } from 'lucide-react';

const MAX_DAYS = 3;
const PASS = 90;

/**
 * 올킬시험 배정 — 학생-우선 플로우 (2026-08-09 사장님 현장 피드백으로 재설계).
 *
 * 구 설계(교재 → Day → 학생)는 선생님이 학생마다 어떤 교재를 쓰는지 외워야 했다.
 * 새 설계: 학생을 먼저 고르면 각자의 배정 교재로 자동 그룹핑되고, 그룹마다
 * Day를 고른다 (교재가 섞여 있어도 한 번에 배정 — 자동 분리). 학생 칩에는
 * 배정 교재·학습 진도·최근 시험이 표시되어 외울 것이 없다.
 * 교재 미배정 학생은 그 자리에서 바로 배정할 수 있다 (숨어 있던 기능 노출).
 */

interface Student { id: string; name: string; bookId: string | null }
interface Assignment {
  id: string;
  studentId: string;
  studentName: string;
  bookId: string;
  dayIds: string[];
  title: string | null;
  bestScore: number | null;
  attempts: number;
}

export function VocaExamAssignPanel() {
  const [books, setBooks] = useState<VocaBook[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [dayTitles, setDayTitles] = useState<Record<string, string>>({});
  const [progressByBook, setProgressByBook] = useState<Record<string, Record<string, number>>>({});
  const [bookDays, setBookDays] = useState<Record<string, VocaDay[]>>({});

  const [search, setSearch] = useState('');
  const [selStudents, setSelStudents] = useState<string[]>([]);
  /** 교재별 Day 선택 — 그룹마다 독립 */
  const [selDaysByBook, setSelDaysByBook] = useState<Record<string, string[]>>({});
  const [title, setTitle] = useState('');
  // 이 시험의 제한시간(초). 0 = 학생/학원 강도 따름 (미지정)
  const [secondsPerWord, setSecondsPerWord] = useState(0);
  const [examType, setExamType] = useState<'headword' | 'syn_ant'>('headword');
  // 기본 펼침 — 접혀 있으면 선생님들이 배정 기능 자체를 못 찾는다 (사장님 피드백)
  const [open, setOpen] = useState(true);
  const [saving, setSaving] = useState(false);

  const bookTitle = useMemo(() => new Map(books.map((b) => [b.id, b.title])), [books]);

  const load = useCallback(async () => {
    const [booksRes, asgRes] = await Promise.all([
      fetchWithToast<VocaBook[]>('/api/voca/books', { method: 'GET', silent: true }),
      fetchWithToast<{
        students: Student[];
        assignments: Assignment[];
        dayTitles: Record<string, string>;
        progressByBook: Record<string, Record<string, number>>;
      }>('/api/voca/exam-assignments', { method: 'GET', silent: true }),
    ]);
    setBooks(booksRes ?? []);
    setStudents(asgRes?.students ?? []);
    setAssignments(asgRes?.assignments ?? []);
    setDayTitles(asgRes?.dayTitles ?? {});
    setProgressByBook(asgRes?.progressByBook ?? {});
  }, []);

  useEffect(() => { load(); }, [load]);

  // 선택된 학생들을 배정 교재별로 그룹핑 (null = 교재 미배정)
  const groups = useMemo(() => {
    const byBook = new Map<string | null, Student[]>();
    for (const id of selStudents) {
      const s = students.find((st) => st.id === id);
      if (!s) continue;
      const key = s.bookId;
      byBook.set(key, [...(byBook.get(key) ?? []), s]);
    }
    return byBook;
  }, [selStudents, students]);

  // 그룹에 등장한 교재의 Day 목록을 필요할 때 로드
  useEffect(() => {
    for (const bookId of groups.keys()) {
      if (!bookId || bookDays[bookId]) continue;
      (async () => {
        const days = await fetchWithToast<VocaDay[]>(`/api/voca/days?bookId=${bookId}`, { method: 'GET', silent: true });
        setBookDays((p) => ({ ...p, [bookId]: days ?? [] }));
      })();
    }
  }, [groups, bookDays]);

  function toggleStudent(id: string) {
    setSelStudents((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }

  function toggleDay(bookId: string, dayId: string) {
    setSelDaysByBook((p) => {
      const cur = p[bookId] ?? [];
      const next = cur.includes(dayId) ? cur.filter((x) => x !== dayId) : cur.length >= MAX_DAYS ? cur : [...cur, dayId];
      return { ...p, [bookId]: next };
    });
  }

  /** 교재 미배정 학생에게 그 자리에서 교재 배정 */
  async function assignBook(studentId: string, bookId: string) {
    const res = await fetchWithToast('/api/voca/book-assignments', {
      body: { studentId, bookId },
      successMessage: `${bookTitle.get(bookId) ?? '교재'} 배정됨`,
      errorMessage: '교재 배정에 실패했습니다',
    });
    if (res) setStudents((p) => p.map((s) => (s.id === studentId ? { ...s, bookId } : s)));
  }

  /** 학생의 최근 시험 힌트 — 해당 교재의 가장 최근 배정 기준 */
  function lastExamHint(studentId: string, bookId: string): string | null {
    const a = assignments.find((x) => x.studentId === studentId && x.bookId === bookId);
    if (!a) return null;
    const range = a.dayIds.map((d) => dayTitles[d] ?? '?').join('+');
    return a.bestScore != null ? `최근 시험 ${range} ${a.bestScore}점` : `최근 배정 ${range} (미응시)`;
  }

  async function assign() {
    const bookGroups = [...groups.entries()].filter(([bookId]) => bookId !== null) as [string, Student[]][];
    if (bookGroups.length === 0) return;
    // 모든 그룹이 Day를 골랐는지 검증
    for (const [bookId] of bookGroups) {
      if ((selDaysByBook[bookId] ?? []).length === 0) {
        toast.error(`${bookTitle.get(bookId) ?? '교재'}의 Day를 선택해주세요`);
        return;
      }
    }
    setSaving(true);
    try {
      let total = 0;
      for (const [bookId, members] of bookGroups) {
        const res = await fetchWithToast<{ count: number }>('/api/voca/exam-assignments', {
          body: {
            bookId,
            dayIds: selDaysByBook[bookId],
            studentIds: members.map((m) => m.id),
            title: title.trim() || null,
            secondsPerWord: secondsPerWord > 0 ? secondsPerWord : null,
            examType,
          },
          errorMessage: `${bookTitle.get(bookId) ?? '교재'} 배정 실패`,
        });
        if (res) total += res.count;
      }
      if (total > 0) {
        toast.success(`${total}명에게 시험을 배정했어요`);
        setSelStudents([]); setSelDaysByBook({}); setTitle(''); setSecondsPerWord(0); setExamType('headword');
        load();
      }
    } finally { setSaving(false); }
  }

  async function remove(id: string) {
    if (!window.confirm('이 배정을 삭제할까요?')) return;
    await fetchWithToast('/api/voca/exam-assignments', { method: 'DELETE', body: { id }, errorMessage: '삭제 실패' });
    load();
  }

  const rangeLabel = (a: Assignment) => a.title?.trim() || a.dayIds.map((d) => dayTitles[d] ?? '?').join(' + ');

  const filteredStudents = students.filter((s) => !search.trim() || s.name.includes(search.trim()));
  const unassignedSelected = (groups.get(null) ?? []) as Student[];
  const readyGroupCount = [...groups.keys()].filter(Boolean).length;

  return (
    <div className="rounded-2xl border border-brand-200 bg-brand-50/40 p-4 space-y-3">
      <p className="font-bold text-brand-700">📋 시험 배정</p>

      {!open ? (
        <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700">
          <Plus className="h-4 w-4" /> 새 시험 배정하기
        </button>
      ) : (
        <div className="space-y-4 rounded-xl bg-white p-3">
          {/* 1단계: 학생 선택 (검색 + 교재 표시) */}
          <div>
            <p className="mb-1 text-xs font-medium text-gray-500">① 학생 선택 ({selStudents.length}명) — 교재는 학생을 따라 자동으로 정해져요</p>
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="이름 검색"
                className="w-full rounded-lg border border-gray-200 py-1.5 pl-8 pr-3 text-sm"
              />
            </div>
            <div className="flex max-h-48 flex-wrap content-start gap-1.5 overflow-y-auto">
              {filteredStudents.map((s) => {
                const on = selStudents.includes(s.id);
                const book = s.bookId ? bookTitle.get(s.bookId) : null;
                const maxDay = s.bookId ? progressByBook[s.id]?.[s.bookId] : undefined;
                return (
                  <button key={s.id} onClick={() => toggleStudent(s.id)}
                    className={`rounded-lg border px-2.5 py-1.5 text-left text-sm transition-colors ${on ? 'border-brand-600 bg-brand-600 text-white' : 'border-gray-200 bg-gray-50 hover:border-brand-300'}`}>
                    <span className="font-semibold">{s.name}</span>
                    <span className={`ml-1.5 text-[11px] ${on ? 'text-white/80' : book ? 'text-gray-400' : 'text-red-500 font-semibold'}`}>
                      {book ? `${book}${maxDay ? ` · Day${maxDay}까지` : ''}` : '⚠️ 교재 미배정'}
                    </span>
                  </button>
                );
              })}
              {filteredStudents.length === 0 && <p className="py-2 text-sm text-gray-400">검색 결과가 없어요</p>}
            </div>
          </div>

          {/* 교재 미배정 학생 — 그 자리에서 배정 */}
          {unassignedSelected.length > 0 && (
            <div className="space-y-1.5 rounded-lg bg-red-50 p-2.5">
              <p className="text-xs font-semibold text-red-600">⚠️ 교재 미배정 — 먼저 교재를 정해주세요 (배정하면 아래 그룹에 합류)</p>
              {unassignedSelected.map((s) => (
                <div key={s.id} className="flex items-center gap-2 text-sm">
                  <span className="w-16 shrink-0 font-medium">{s.name}</span>
                  <select defaultValue="" onChange={(e) => e.target.value && assignBook(s.id, e.target.value)}
                    className="min-w-0 flex-1 rounded-lg border border-gray-200 px-2 py-1.5 text-sm">
                    <option value="" disabled>교재 선택</option>
                    {books.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}
                  </select>
                </div>
              ))}
            </div>
          )}

          {/* 2단계: 교재 그룹별 Day 선택 (자동 분리) */}
          {[...groups.entries()].filter(([bookId]) => bookId !== null).map(([bookId, members]) => {
            const bid = bookId as string;
            const days = bookDays[bid] ?? [];
            const sel = selDaysByBook[bid] ?? [];
            const numCounts = new Map<number, number>();
            for (const d of days) numCounts.set(d.day_number, (numCounts.get(d.day_number) ?? 0) + 1);
            const hasDup = [...numCounts.values()].some((c) => c > 1);
            return (
              <div key={bid} className="space-y-1.5 rounded-lg border border-gray-100 p-2.5">
                <p className="text-xs font-medium text-gray-500">
                  ② <strong className="text-brand-700">{bookTitle.get(bid) ?? '교재'}</strong> Day 선택 (최대 {MAX_DAYS}개)
                </p>
                <div className="space-y-0.5">
                  {(members as Student[]).map((m) => {
                    const maxDay = progressByBook[m.id]?.[bid];
                    const hint = lastExamHint(m.id, bid);
                    return (
                      <p key={m.id} className="text-[11px] text-gray-400">
                        {m.name} · {maxDay ? `Day ${maxDay}까지 학습` : '학습 기록 없음'}{hint ? ` · ${hint}` : ''}
                      </p>
                    );
                  })}
                </div>
                {hasDup && (
                  <p className="rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700">
                    ⚠️ 이 교재에 같은 번호의 Day가 2개 이상 있어요. 빨간 Day는 중복이니 배정 전에 보카 관리에서 정리해주세요.
                  </p>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {days.map((d) => {
                    const on = sel.includes(d.id);
                    const dis = !on && sel.length >= MAX_DAYS;
                    const dup = (numCounts.get(d.day_number) ?? 0) > 1;
                    return (
                      <button key={d.id} onClick={() => toggleDay(bid, d.id)} disabled={dis}
                        className={`rounded-lg px-2.5 py-1 text-sm font-semibold ${on ? 'bg-brand-600 text-white' : dis ? 'bg-gray-100 text-gray-300' : dup ? 'border border-red-300 bg-red-50 text-red-600' : 'border border-brand-200 bg-gray-50 text-brand-600'}`}>
                        {d.title}{dup ? ' ⚠️' : ''}
                      </button>
                    );
                  })}
                  {days.length === 0 && <p className="text-sm text-gray-400">Day 불러오는 중...</p>}
                </div>
              </div>
            );
          })}

          {/* 3단계: 공통 옵션 */}
          <div className="flex gap-2">
            {([['headword', '1회독 표제어 (스펠링)'], ['syn_ant', '2회독 유의어·반의어']] as const).map(([v, label]) => (
              <button key={v} type="button" onClick={() => setExamType(v)}
                className={`flex-1 rounded-lg border-2 px-3 py-2 text-xs font-bold transition-colors ${examType === v ? 'border-[#1A73E8] bg-[#E8F0FE] text-[#174EA6]' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'}`}>
                {label}
              </button>
            ))}
          </div>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="시험 제목 (선택)"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" maxLength={100} />
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <span className="shrink-0">단어당 제한시간</span>
            <input type="number" min={0} max={60} value={secondsPerWord}
              onChange={(e) => setSecondsPerWord(Math.max(0, Math.min(60, Number(e.target.value) || 0)))}
              className="w-20 rounded-lg border border-gray-200 px-2 py-1.5 text-sm" />
            <span className="text-xs text-gray-400">{secondsPerWord > 0 ? '초 · 긴 단어는 자동 연장' : '초 (0 = 학생 강도 따름)'}</span>
          </label>
          <div className="flex gap-2">
            <button onClick={assign} disabled={saving || readyGroupCount === 0 || unassignedSelected.length > 0}
              className="flex-1 rounded-xl bg-brand-600 py-2.5 text-sm font-bold text-white hover:bg-brand-700 disabled:bg-gray-300">
              {saving ? '배정 중...' : `${selStudents.length - unassignedSelected.length}명에게 배정${readyGroupCount > 1 ? ` (교재 ${readyGroupCount}종 자동 분리)` : ''}`}
            </button>
            <button onClick={() => setOpen(false)} className="rounded-xl border border-gray-200 px-4 text-sm font-bold text-gray-500">취소</button>
          </div>
        </div>
      )}

      {/* 배정 목록 */}
      {assignments.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-gray-500">배정됨 ({assignments.length})</p>
          {assignments.map((a) => (
            <div key={a.id} className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 text-sm">
              <span className="min-w-0 truncate">
                <strong>{a.studentName}</strong> · {rangeLabel(a)}
                <span className="ml-1.5 text-xs text-gray-400">{bookTitle.get(a.bookId) ?? ''}</span>
                {a.bestScore != null && <span className={`ml-2 text-xs ${a.bestScore >= PASS ? 'text-green-600' : 'text-amber-600'}`}>최고 {a.bestScore}점 ({a.attempts}회)</span>}
              </span>
              <button onClick={() => remove(a.id)} aria-label="삭제" className="shrink-0 text-gray-300 hover:text-red-500">
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
