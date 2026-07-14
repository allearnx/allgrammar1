import { VocaBrandStyle } from '@/components/voca/voca-brand';
import { VOCA_COLORS } from '@/lib/voca/brand-tokens';
import type { ExamGroup } from '@/lib/voca/fetch-exam-results';

const PASS = 90;

function kstDateLabel(iso: string): string {
  return new Date(iso).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric' });
}

/**
 * 학부모/리포트용 보카 시험 결과 카드.
 * 학습 flow의 마지막 단계(선생님이 낸 시험)가 최종 성과이므로,
 * 가장 최근 시험 점수를 히어로로 크게 — 나머지는 컴팩트 리스트.
 */
export function VocaExamReportCard({
  exams,
  dayTitles,
}: {
  exams: ExamGroup[];
  dayTitles: Record<string, string>;
}) {
  if (exams.length === 0) return null;
  const rangeLabel = (dayIds: string[]) => dayIds.map((id) => dayTitles[id] ?? '?').join(' + ');

  const [latest, ...rest] = exams;
  const latestPassed = latest.bestScore >= PASS;

  return (
    <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
      <VocaBrandStyle />

      {/* 최근 시험 히어로 — 최종 점수가 한눈에 */}
      <div className="relative px-5 py-6 text-center" style={{ background: VOCA_COLORS.sky }}>
        <p className="voca-display text-xs font-bold tracking-widest uppercase" style={{ color: VOCA_COLORS.blueDark }}>
          보카 시험 결과
        </p>
        <div className="mt-1 flex items-center justify-center gap-1.5 text-sm" style={{ color: VOCA_COLORS.gray }}>
          {latest.isToday && (
            <span className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white" style={{ background: VOCA_COLORS.red }}>오늘</span>
          )}
          <span className="font-medium">{rangeLabel(latest.dayIds)}</span>
        </div>
        <p
          className="voca-display mt-2 text-5xl tabular-nums"
          style={{ color: latestPassed ? VOCA_COLORS.green : VOCA_COLORS.blue, fontWeight: 700 }}
        >
          {latest.bestScore}<span className="text-2xl">점</span>
        </p>
        <p className="mt-1.5 text-xs" style={{ color: VOCA_COLORS.gray }}>
          {latestPassed ? '통과!' : `${PASS}점 통과 기준`} · {latest.attempts}회 응시 · {kstDateLabel(latest.lastAttemptAt)}
        </p>
        {latest.wrongWords.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center justify-center gap-1">
            <span className="text-[11px]" style={{ color: VOCA_COLORS.gray }}>틀린 단어:</span>
            {latest.wrongWords.map((w, i) => (
              <span key={i} className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-red-600 shadow-sm">{w.front_text}</span>
            ))}
          </div>
        )}
      </div>

      {/* 이전 시험 — 컴팩트 리스트 */}
      {rest.length > 0 && (
        <div className="space-y-2 p-4">
          <p className="text-xs font-semibold text-gray-400">이전 시험</p>
          {rest.map((ex) => (
            <div key={ex.rangeKey} className="rounded-lg border bg-gray-50/60 px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate text-sm font-medium text-gray-700">{rangeLabel(ex.dayIds)}</span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${ex.bestScore >= PASS ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {ex.bestScore}점
                  </span>
                  <span className="text-xs text-gray-400">{ex.attempts}회 · {kstDateLabel(ex.lastAttemptAt)}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
