import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingUp, BarChart3, BookOpen, Target, Sparkles, PartyPopper } from 'lucide-react';
import { STAT_COLORS } from '@/lib/utils/brand-colors';
import type { StudentReportData } from '@/types/student-report';

function StatCard({ label, value, color, icon }: {
  label: string; value: string; color: string; icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-white p-3.5" style={{ borderLeftWidth: 4, borderLeftColor: color }}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</span>
        <span style={{ color }}>{icon}</span>
      </div>
      <p className="text-xl font-bold tracking-tight">{value}</p>
    </div>
  );
}

export function SummaryTab({ data, hasVoca, hasNaesin }: { data: StudentReportData; hasVoca: boolean; hasNaesin: boolean }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {hasVoca && data.current.voca && (
          <>
            <StatCard
              label="보카 퀴즈 평균"
              value={data.current.voca.quizAvgScore !== null ? `${data.current.voca.quizAvgScore}점` : '-'}
              color={STAT_COLORS.violet}
              icon={<Target className="h-5 w-5" />}
            />
            <StatCard
              label="보카 진행률"
              value={`${data.current.voca.daysInProgress}/${data.current.voca.totalDays} Day`}
              color={STAT_COLORS.mint}
              icon={<BookOpen className="h-5 w-5" />}
            />
          </>
        )}
        {hasNaesin && data.current.naesin && (
          <>
            <StatCard
              label="내신 문제풀이 평균"
              value={data.current.naesin.problemAvgScore !== null ? `${data.current.naesin.problemAvgScore}점` : '-'}
              color={STAT_COLORS.cyan}
              icon={<BarChart3 className="h-5 w-5" />}
            />
            <StatCard
              label="내신 진행률"
              value={`${data.current.naesin.unitsInProgress}/${data.current.naesin.totalUnits} 단원`}
              color={STAT_COLORS.amber}
              icon={<TrendingUp className="h-5 w-5" />}
            />
          </>
        )}
      </div>

      {data.current.weaknesses.length > 0 && (
        <div className="rounded-xl bg-amber-50/70 p-4">
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5 text-amber-800">
            <AlertTriangle className="h-4 w-4" />
            약점 분석
          </h4>
          <div className="flex flex-wrap gap-2">
            {data.current.weaknesses.map((w, i) => (
              <Badge key={i} variant="outline" className="bg-amber-100 border-amber-200 text-amber-800">
                {w}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {data.current.recommendations.length > 0 && (
        <div className="rounded-xl bg-cyan-50/70 p-4">
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5 text-cyan-800">
            <Sparkles className="h-4 w-4" />
            추천 학습
          </h4>
          <ul className="space-y-1.5">
            {data.current.recommendations.map((r, i) => (
              <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="mt-1.5 h-2 w-2 rounded-full bg-cyan-400 shrink-0" />
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.current.weaknesses.length === 0 && data.current.recommendations.length === 0 && (
        <div className="rounded-xl border border-dashed p-8 text-center">
          <PartyPopper className="h-8 w-8 text-violet-400 mb-2" />
          <p className="text-sm text-gray-500 font-medium">약점이 없습니다! 잘하고 있어요!</p>
        </div>
      )}
    </div>
  );
}
