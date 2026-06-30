import type { ExamGroup } from '@/lib/voca/fetch-exam-results';

const PASS = 90;

/** 학부모/리포트용 보카 시험 결과 카드 (오늘 본 시험이 맨 위) */
export function VocaExamReportCard({
  exams,
  dayTitles,
}: {
  exams: ExamGroup[];
  dayTitles: Record<string, string>;
}) {
  if (exams.length === 0) return null;
  const rangeLabel = (dayIds: string[]) => dayIds.map((id) => dayTitles[id] ?? '?').join(' + ');

  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-gray-800">
        🎁 보카 시험 결과
      </h2>
      <div className="space-y-2">
        {exams.map((ex) => (
          <div key={ex.rangeKey} className="rounded-lg border bg-gray-50/60 px-3 py-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-sm font-medium text-gray-800">
                {ex.isToday && <span className="rounded bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">오늘</span>}
                {rangeLabel(ex.dayIds)}
              </span>
              <span className="flex items-center gap-2 shrink-0">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${ex.bestScore >= PASS ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                  {ex.bestScore}점
                </span>
                <span className="text-xs text-gray-400">{ex.attempts}회 응시</span>
              </span>
            </div>
            {ex.wrongWords.length > 0 && (
              <div className="mt-1.5 flex flex-wrap items-center gap-1">
                <span className="text-[11px] text-gray-400">틀린 단어:</span>
                {ex.wrongWords.map((w, i) => (
                  <span key={i} className="rounded bg-red-50 px-1.5 py-0.5 text-[11px] text-red-600">{w.front_text}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
