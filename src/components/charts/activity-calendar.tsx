'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ActivityRecord } from '@/types/student-report';

interface Props {
  activities: ActivityRecord[];
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

const TYPE_ICONS: Record<string, string> = {
  voca_quiz: '✏️',
  voca_spelling: '⌨️',
  voca_matching: '🔗',
  naesin_vocab: '📖',
  naesin_passage: '📝',
  naesin_problem: '✏️',
  naesin_video: '📐',
};

const DOT_COLORS = {
  voca: '#7C3AED',
  naesin: '#06B6D4',
  mixed: '#F59E0B',
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

function getDotColor(activities: ActivityRecord[]): string {
  const hasVoca = activities.some((a) => a.type.startsWith('voca_'));
  const hasNaesin = activities.some((a) => a.type.startsWith('naesin_'));
  if (hasVoca && hasNaesin) return DOT_COLORS.mixed;
  if (hasNaesin) return DOT_COLORS.naesin;
  return DOT_COLORS.voca;
}

export function ActivityCalendar({ activities }: Props) {
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
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {/* Day cells */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayActivities = activityByDate[dateStr] || [];
          const count = dayActivities.length;
          const isSelected = selectedDate === dateStr;
          const isToday = dateStr === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

          let dotOpacity = 0;
          if (count >= 5) dotOpacity = 1;
          else if (count >= 3) dotOpacity = 0.75;
          else if (count >= 1) dotOpacity = 0.45;

          const dotColor = count > 0 ? getDotColor(dayActivities) : '#7C3AED';

          return (
            <button
              key={day}
              onClick={() => setSelectedDate(isSelected ? null : dateStr)}
              className={`aspect-square flex flex-col items-center justify-center rounded-lg text-xs transition-all relative ${
                isSelected
                  ? 'bg-violet-100 ring-2 ring-violet-400'
                  : isToday
                    ? 'bg-violet-50 ring-1 ring-violet-300'
                    : 'hover:bg-violet-50'
              }`}
            >
              <span className={`${isToday ? 'font-bold' : ''} ${count > 0 ? 'text-gray-800' : 'text-gray-400'}`}>
                {day}
              </span>
              {count > 0 && (
                <div
                  className="absolute bottom-1 h-1.5 w-1.5 rounded-full"
                  style={{ background: dotColor, opacity: dotOpacity }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day activities */}
      {selectedDate && (
        <div className="mt-4 space-y-2">
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
                    <span className="rounded-lg bg-gray-50 p-1.5 text-base">{TYPE_ICONS[a.type] || '📋'}</span>
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
