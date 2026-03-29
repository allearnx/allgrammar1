import { CalendarDays } from 'lucide-react';
import { getDDay } from '@/lib/dashboard/naesin-helpers';
import type { NaesinUnit, NaesinExamAssignment } from '@/types/naesin';

interface Props {
  examAssignments: NaesinExamAssignment[];
  units: NaesinUnit[];
  stepDoneBorder: string;
}

export function ExamScopeList({ examAssignments, units, stepDoneBorder }: Props) {
  return (
    <div className="rounded-2xl border bg-white p-5 md:p-6">
      <h3 className="text-base font-bold mb-4 flex items-center gap-2">
        <CalendarDays className="h-4 w-4" />
        시험 범위
      </h3>
      <div className="space-y-3">
        {examAssignments.length > 0 ? (
          examAssignments
            .sort((a, b) => a.exam_round - b.exam_round)
            .map((ea) => {
              const dday = getDDay(ea.exam_date);
              const unitTitles = ea.unit_ids
                .map((uid) => units.find((u) => u.id === uid)?.title)
                .filter(Boolean);
              return (
                <div key={ea.id} className="rounded-xl border p-3.5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold">
                      {ea.exam_label || `${ea.exam_round}차 시험`}
                    </span>
                    {dday !== null && dday >= 0 && (
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                          dday <= 7 ? 'bg-rose-100 text-rose-700' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {dday === 0 ? 'D-Day' : `D-${dday}`}
                      </span>
                    )}
                    {ea.exam_date && dday !== null && dday < 0 && (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">완료</span>
                    )}
                  </div>
                  {ea.exam_date && (
                    <p className="text-xs text-gray-400 mb-1.5">
                      {new Date(ea.exam_date).toLocaleDateString('ko-KR')}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    {unitTitles.map((title, i) => (
                      <span key={i} className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs text-gray-600" style={{ borderColor: stepDoneBorder }}>
                        {title}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })
        ) : (
          <p className="text-sm text-gray-500">등록된 시험 범위가 없습니다.</p>
        )}
      </div>
    </div>
  );
}
