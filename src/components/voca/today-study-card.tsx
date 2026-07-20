'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { isR1Complete, isR2Complete } from '@/lib/dashboard/voca-helpers';
import { VOCA_STEP_THEMES } from '@/lib/voca/brand-tokens';
import type { VocaBook, VocaDay, VocaStudentProgress } from '@/types/voca';

/** 이 일수 이상 활동이 없으면 "쉬는 중" 배지 표시 */
const IDLE_DAYS = 3;

interface TodayTask {
  book: VocaBook;
  /** 다음에 할 Day — null이면 이 교재는 완료 */
  nextDay: VocaDay | null;
  round: 1 | 2;
  idleDays: number;
  lastActivity: number;
}

interface TodayStudyCardProps {
  books: VocaBook[];
  days: VocaDay[];
  progressMap: Map<string, VocaStudentProgress>;
  freeDayLimit: number;
  round2Locked: boolean;
  /** 관리자 '2회독' 토글 = 1회독 면제 — 1회독 건너뛰고 바로 2회독 안내 */
  round2Forced?: boolean;
  /** 이어하기 클릭 시 홈의 선택 교재도 함께 전환 (돌아왔을 때 그 교재가 보이도록) */
  onSelectBook: (bookId: string) => void;
}

/**
 * 오늘의 학습 카드 — 학습 중인 교재별 "다음 할 Day"를 한눈에.
 * 2권 이상 병행하는 학생이 교재를 오가며 기억할 필요 없게 하고,
 * 방치된 교재(3일+ 쉼)를 시스템이 알려준다. 1권 학생에게도 "이어하기"로 유용.
 */
export function TodayStudyCard({ books, days, progressMap, freeDayLimit, round2Locked, round2Forced = false, onSelectBook }: TodayStudyCardProps) {
  // 렌더 순수성: 현재 시각은 마운트 시 1회 스냅샷 (쉬는 일수 계산용)
  const [now] = useState(() => Date.now());
  // 학습 기록이 있는 교재만 대상
  const tasks: TodayTask[] = [];
  for (const book of books) {
    const bookDaysAll = days.filter((d) => d.book_id === book.id);
    const bookDays = freeDayLimit > 0 ? bookDaysAll.slice(0, freeDayLimit) : bookDaysAll;
    const progressRows = bookDays
      .map((d) => progressMap.get(d.id))
      .filter((p): p is VocaStudentProgress => !!p);
    if (progressRows.length === 0) continue; // 시작 안 한 교재는 제외

    const lastActivity = Math.max(
      ...progressRows.map((p) => (p.updated_at ? new Date(p.updated_at).getTime() : 0)),
    );
    const idleDays = lastActivity > 0 ? Math.floor((now - lastActivity) / 86_400_000) : 0;

    const nextR1 = round2Forced ? undefined : bookDays.find((d) => !isR1Complete(progressMap.get(d.id) ?? null));
    if (nextR1) {
      tasks.push({ book, nextDay: nextR1, round: 1, idleDays, lastActivity });
      continue;
    }
    if (!round2Locked) {
      const nextR2 = bookDays.find((d) => !isR2Complete(progressMap.get(d.id) ?? null));
      if (nextR2) {
        tasks.push({ book, nextDay: nextR2, round: 2, idleDays, lastActivity });
        continue;
      }
    }
    tasks.push({ book, nextDay: null, round: 1, idleDays, lastActivity });
  }

  if (tasks.length === 0) return null;
  // 최근 활동 교재 먼저
  tasks.sort((a, b) => b.lastActivity - a.lastActivity);

  return (
    <div className="rounded-3xl border bg-white p-4 space-y-2.5">
      <p className="voca-display text-sm text-gray-800 px-1" style={{ fontWeight: 700 }}>
        📌 오늘의 학습
      </p>
      {tasks.map((t, i) => {
        const theme = VOCA_STEP_THEMES[i % VOCA_STEP_THEMES.length];
        if (!t.nextDay) {
          return (
            <div key={t.book.id} className="flex items-center gap-3 rounded-2xl bg-green-50 px-4 py-3">
              <CheckCircle className="h-5 w-5 shrink-0 text-green-600" />
              <p className="min-w-0 flex-1 truncate text-sm font-semibold text-green-700">
                {t.book.title} — 전부 끝냈어요! 👏
              </p>
            </div>
          );
        }
        return (
          <Link
            key={t.book.id}
            href={`/student/voca/${t.nextDay.id}`}
            onClick={() => onSelectBook(t.book.id)}
            className="group flex items-center gap-3 rounded-2xl border border-gray-100 px-4 py-3 transition-all hover:-translate-y-0.5 hover:border-gray-200 hover:shadow-md active:scale-[0.99]"
          >
            <span
              className="voca-display flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs text-white"
              style={{ background: theme.solid, fontWeight: 700 }}
            >
              GO
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-medium text-gray-400">{t.book.title}</span>
              <span className="flex items-center gap-1.5">
                <span className="voca-display truncate text-[15px] text-gray-800" style={{ fontWeight: 700 }}>
                  {t.nextDay.title}
                </span>
                {t.round === 2 && (
                  <span className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold" style={{ background: theme.bg, color: theme.text }}>
                    2회독
                  </span>
                )}
                {t.idleDays >= IDLE_DAYS && (
                  <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                    {t.idleDays}일째 쉬는 중
                  </span>
                )}
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-1 text-sm font-bold" style={{ color: theme.solid }}>
              이어하기
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        );
      })}
    </div>
  );
}
