'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import type { VocaBook, VocaDay } from '@/types/voca';
import { X, Plus } from 'lucide-react';

const MAX_DAYS = 3;
const PASS = 90;

interface Student { id: string; name: string }
interface Assignment {
  id: string;
  studentId: string;
  studentName: string;
  dayIds: string[];
  title: string | null;
  bestScore: number | null;
  attempts: number;
}

export function VocaExamAssignPanel() {
  const [books, setBooks] = useState<VocaBook[]>([]);
  const [bookId, setBookId] = useState('');
  const [days, setDays] = useState<VocaDay[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [dayTitles, setDayTitles] = useState<Record<string, string>>({});

  const [selDays, setSelDays] = useState<string[]>([]);
  const [selStudents, setSelStudents] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  // 기본 펼침 — 접혀 있으면 선생님들이 배정 기능 자체를 못 찾는다 (사장님 피드백)
  const [open, setOpen] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const data = await fetchWithToast<VocaBook[]>('/api/voca/books', { method: 'GET', silent: true });
      setBooks(data ?? []);
      if (data && data.length > 0) setBookId(data[0].id);
    })();
  }, []);

  const loadForBook = useCallback(async () => {
    if (!bookId) return;
    const [daysRes, asgRes] = await Promise.all([
      fetchWithToast<VocaDay[]>(`/api/voca/days?bookId=${bookId}`, { method: 'GET', silent: true }),
      fetchWithToast<{ students: Student[]; assignments: Assignment[]; dayTitles: Record<string, string> }>(
        `/api/voca/exam-assignments?bookId=${bookId}`, { method: 'GET', silent: true },
      ),
    ]);
    setDays(daysRes ?? []);
    setStudents(asgRes?.students ?? []);
    setAssignments(asgRes?.assignments ?? []);
    setDayTitles(asgRes?.dayTitles ?? {});
  }, [bookId]);

  useEffect(() => { loadForBook(); }, [loadForBook]);

  function toggleDay(id: string) {
    setSelDays((p) => p.includes(id) ? p.filter((x) => x !== id) : p.length >= MAX_DAYS ? p : [...p, id]);
  }
  function toggleStudent(id: string) {
    setSelStudents((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  }

  async function assign() {
    if (selDays.length === 0 || selStudents.length === 0) return;
    setSaving(true);
    try {
      const res = await fetchWithToast<{ count: number }>('/api/voca/exam-assignments', {
        body: { bookId, dayIds: selDays, studentIds: selStudents, title: title.trim() || null },
        errorMessage: '배정 실패',
      });
      if (res) {
        toast.success(`${res.count}명에게 시험을 배정했어요`);
        setSelDays([]); setSelStudents([]); setTitle(''); setOpen(false);
        loadForBook();
      }
    } finally { setSaving(false); }
  }

  async function remove(id: string) {
    if (!window.confirm('이 배정을 삭제할까요?')) return;
    await fetchWithToast('/api/voca/exam-assignments', { method: 'DELETE', body: { id }, errorMessage: '삭제 실패' });
    loadForBook();
  }

  const rangeLabel = (a: Assignment) => a.title?.trim() || a.dayIds.map((d) => dayTitles[d] ?? '?').join(' + ');

  return (
    <div className="rounded-2xl border border-brand-200 bg-brand-50/40 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="font-bold text-brand-700">📋 시험 배정</p>
        <select value={bookId} onChange={(e) => setBookId(e.target.value)} className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm">
          {books.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}
        </select>
      </div>

      {!open ? (
        <button onClick={() => setOpen(true)} className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700">
          <Plus className="h-4 w-4" /> 새 시험 배정하기
        </button>
      ) : (
        <div className="space-y-3 rounded-xl bg-white p-3">
          <div>
            <p className="mb-1 text-xs font-medium text-gray-500">Day 선택 (최대 {MAX_DAYS}개)</p>
            <div className="flex flex-wrap gap-1.5">
              {days.map((d) => {
                const on = selDays.includes(d.id);
                const dis = !on && selDays.length >= MAX_DAYS;
                return (
                  <button key={d.id} onClick={() => toggleDay(d.id)} disabled={dis}
                    className={`rounded-lg px-2.5 py-1 text-sm font-semibold ${on ? 'bg-brand-600 text-white' : dis ? 'bg-gray-100 text-gray-300' : 'bg-gray-50 text-brand-600 border border-brand-200'}`}>
                    {d.title}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-gray-500">학생 선택 ({selStudents.length}명)</p>
            <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
              {students.map((s) => {
                const on = selStudents.includes(s.id);
                return (
                  <button key={s.id} onClick={() => toggleStudent(s.id)}
                    className={`rounded-lg px-2.5 py-1 text-sm font-medium ${on ? 'bg-green-600 text-white' : 'bg-gray-50 text-gray-600 border border-gray-200'}`}>
                    {s.name}
                  </button>
                );
              })}
            </div>
            {students.length === 0 && <p className="text-xs text-gray-400">보카 배정된 학생이 없습니다.</p>}
          </div>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="시험 제목 (선택)"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" maxLength={100} />
          <div className="flex gap-2">
            <button onClick={assign} disabled={saving || selDays.length === 0 || selStudents.length === 0}
              className="flex-1 rounded-xl bg-brand-600 py-2.5 text-sm font-bold text-white hover:bg-brand-700 disabled:bg-gray-300">
              {saving ? '배정 중...' : `${selStudents.length}명에게 배정`}
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
