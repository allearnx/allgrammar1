import { CalendarDays, CheckCircle2, AlertTriangle, BarChart3 } from 'lucide-react';
import { getDDay } from '@/lib/dashboard/naesin-helpers';
import type { ExamReadiness } from '@/types/student-report';

function Stat({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: string }) {
  return (
    <div className="rounded-lg bg-gray-50 px-3 py-2">
      <div className="flex items-center gap-1 text-[11px] font-medium text-gray-500 mb-0.5">
        <span style={{ color: tone }}>{icon}</span>
        {label}
      </div>
      <p className="text-sm font-bold" style={{ color: tone }}>{value}</p>
    </div>
  );
}

/**
 * 시험별 준비도 카드 — 시험 배정(차수·날짜·범위)에 스코프된 진도·성적·오답.
 * 선생님 리포트·학부모 공유 페이지 공용 (프레젠테이션 전용).
 */
export function ExamReadinessSection({ items }: { items: ExamReadiness[] }) {
  if (!items || items.length === 0) return null;

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold flex items-center gap-1.5">
        <CalendarDays className="h-4 w-4 text-brand-600" />
        시험별 준비 현황
      </h4>
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((ex) => {
          const dday = getDDay(ex.examDate);
          const isPast = dday !== null && dday < 0;
          const title = ex.examLabel || `${ex.examRound}차 시험`;
          return (
            <div key={`${ex.textbookName}-${ex.examRound}`} className="rounded-xl border bg-white p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold">
                  {title}
                  {ex.textbookName && <span className="ml-1.5 text-xs font-medium text-gray-400">{ex.textbookName}</span>}
                </span>
                {dday !== null && dday >= 0 && (
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${dday <= 7 ? 'bg-rose-100 text-rose-700' : 'bg-brand-50 text-brand-700'}`}>
                    {dday === 0 ? 'D-Day' : `D-${dday}`}
                  </span>
                )}
                {isPast && (
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">시험 완료</span>
                )}
              </div>
              {ex.examDate && (
                <p className="text-xs text-gray-400 mb-2">{new Date(ex.examDate).toLocaleDateString('ko-KR')}</p>
              )}
              <div className="flex flex-wrap gap-1 mb-3">
                {ex.units.map((u) => (
                  <span key={u.id} className="inline-flex items-center rounded-md bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-600">
                    {u.title}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Stat
                  icon={<CheckCircle2 className="h-3 w-3" />}
                  label="범위 완료"
                  value={`${ex.unitsCompleted}/${ex.units.length}과`}
                  tone="#188038"
                />
                <Stat
                  icon={<BarChart3 className="h-3 w-3" />}
                  label="문제풀이 평균"
                  value={ex.problemAvgScore !== null ? `${ex.problemAvgScore}점` : '-'}
                  tone="#1A73E8"
                />
                <Stat
                  icon={<AlertTriangle className="h-3 w-3" />}
                  label="미해결 오답"
                  value={`${ex.wrongUnresolved}개`}
                  tone={ex.wrongUnresolved > 0 ? '#D93025' : '#188038'}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
