'use client';

import { useState, useMemo } from 'react';
import {
  ChevronLeft, ChevronRight, PenLine, Keyboard, Link2,
  BookOpen, FileText, Ruler, ClipboardList, Clock,
} from 'lucide-react';
import type { ActivityRecord } from '@/types/student-report';

interface Props {
  activities: ActivityRecord[];
  dailySeconds?: Record<string, number>;
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

const TYPE_ICONS: Record<string, React.ReactNode> = {
  voca_quiz: <PenLine className="h-4 w-4" />,
  voca_spelling: <Keyboard className="h-4 w-4" />,
  voca_matching: <Link2 className="h-4 w-4" />,
  naesin_vocab: <BookOpen className="h-4 w-4" />,
  naesin_passage: <FileText className="h-4 w-4" />,
  naesin_problem: <PenLine className="h-4 w-4" />,
  naesin_video: <Ruler className="h-4 w-4" />,
};


const BORDER_COLORS: Record<string, string> = {
  voca_quiz: '#7C3AED',
  voca_spelling: '#7C3AED',
  voca_matching: '#7C3AED',
  naesin_vocab: '#06B6D4',
  naesin_passage: '#06B6D4',
  naesin_problem: '#06B6D4',
  naesin_video: '#06B6D4',
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function getDaySummary(acts: ActivityRecord[], seconds?: number) {
  if (acts.length === 0 && (!seconds || seconds <= 0)) return null;
  const n = acts.filter(a => a.type.startsWith('naesin_')).length;
  const v = acts.filter(a => a.type.startsWith('voca_')).length;
  const parts: string[] = [];
  if (n > 0) parts.push(`내${n}`);
  if (v > 0) parts.push(`보${v}`);
  const m = seconds ? Math.floor(seconds / 60) : 0;
  const time = m >= 60 ? `${Math.floor(m / 60)}h` : m > 0 ? `${m}분` : null;
  return { label: parts.join('·') || null, time };
}

function getHeatmapBg(seconds: number | undefined): string {
  if (!seconds || seconds <= 0) return '';
  const minutes = seconds / 60;
  if (minutes >= 30) return 'rgba(34, 197, 94, 0.5)';
  if (minutes >= 15) return 'rgba(34, 197, 94, 0.3)';
  return 'rgba(34, 197, 94, 0.15)';
}

function formatMinutes(seconds: number): string {
  const m = Math.floor(seconds / 60);
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const rem = m % 60;
    return rem > 0 ? `${h}시간 ${rem}분` : `${h}시간`;
  }
  return `${m}분`;
}

export function ActivityCalendar({ activities, dailySeconds }: Props) {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Group activities by date
  const activityByDate = useMemo(() => {
    const map: Record<string, ActivityRecord[]> = {};
    for (const a of activities) {
      if (!map[a.date]) map[a.date] = [];
      map[a.date].push(a);
    }
    return map;
  }, [activities]);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    setSelectedDate(null);
  };

  const selectedActivities = selectedDate ? activityByDate[selectedDate] || [] : [];

  return (
    <div>
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={goToPrevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
          <ChevronLeft className="h-5 w-5 text-gray-500" />
        </button>
        <h4 className="text-sm font-semibold">
          {currentYear}년 {currentMonth + 1}월
        </h4>
        <button onClick={goToNextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
          <ChevronRight className="h-5 w-5 text-gray-500" />
        </button>
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Weekday headers */}
        {WEEKDAYS.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-gray-400 py-1">
            {day}
          </div>
        ))}

        {/* Empty cells before first day */}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} className="h-14" />
        ))}

        {/* Day cells */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayActivities = activityByDate[dateStr] || [];
          const count = dayActivities.length;
          const isSelected = selectedDate === dateStr;
          const isToday = dateStr === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

          const heatmapBg = dailySeconds ? getHeatmapBg(dailySeconds[dateStr]) : '';
          const summary = getDaySummary(dayActivities, dailySeconds?.[dateStr]);

          return (
            <button
              key={day}
              onClick={() => setSelectedDate(isSelected ? null : dateStr)}
              className={`h-14 flex flex-col items-center justify-start pt-1 rounded-md text-xs transition-all ${
                isSelected
                  ? 'bg-violet-100 ring-2 ring-violet-400'
                  : isToday
                    ? 'bg-violet-50 ring-1 ring-violet-300'
                    : 'hover:bg-violet-50'
              }`}
              style={!isSelected && !isToday && heatmapBg ? { backgroundColor: heatmapBg } : undefined}
            >
              <span className={`${isToday ? 'font-bold' : ''} ${count > 0 ? 'text-gray-800' : 'text-gray-400'}`}>
                {day}
              </span>
              {summary && (
                <div className="text-[10px] leading-tight text-gray-500 mt-0.5 text-center">
                  {summary.label && <div>{summary.label}</div>}
                  {summary.time && <div>{summary.time}</div>}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day activities */}
      {selectedDate && (
        <div className="mt-4 space-y-2">
          {dailySeconds && dailySeconds[selectedDate] > 0 && (
            <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2">
              <Clock className="h-4 w-4 text-green-600" />
              <span className="text-sm font-semibold text-green-700">
                총 {formatMinutes(dailySeconds[selectedDate])} 학습
              </span>
            </div>
          )}
          <h5 className="text-xs font-semibold text-gray-500">
            {selectedDate.slice(5).replace('-', '/')} 학습 기록
          </h5>
          {selectedActivities.length === 0 ? (
            <p className="text-xs text-gray-400 py-2">이 날은 학습 기록이 없어요</p>
          ) : (
            selectedActivities.map((a, i) => {
              const borderColor = BORDER_COLORS[a.type] || '#7C3AED';
              return (
                <div key={i} className="flex items-center justify-between rounded-lg border px-3 py-2" style={{ borderLeft: `3px solid ${borderColor}` }}>
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-gray-50 p-1.5 flex items-center justify-center text-gray-600">{TYPE_ICONS[a.type] || <ClipboardList className="h-4 w-4" />}</span>
                    <span className="text-sm text-gray-700">{a.label}</span>
                  </div>
                  {a.score !== null ? (
                    <span className={`text-sm font-bold ${a.score >= 80 ? 'text-green-600' : 'text-amber-600'}`}>{a.score}점</span>
                  ) : (
                    <span className="text-xs text-green-600 font-medium">완료</span>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
