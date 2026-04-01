import { Badge } from '@/components/ui/badge';
import { PartyPopper } from 'lucide-react';
import type { StudentReportData } from '@/types/student-report';

export function WrongAnalysisTab({ data, hasVoca, hasNaesin }: { data: StudentReportData; hasVoca: boolean; hasNaesin: boolean }) {
  return (
    <div className="space-y-6">
      {hasVoca && data.wrongAnalysis.vocaTopWrong.length > 0 && (
        <div className="rounded-xl bg-rose-50/60 p-4">
          <h4 className="text-sm font-semibold mb-3 text-rose-800">자주 틀리는 단어 TOP 10</h4>
          <div className="space-y-2">
            {data.wrongAnalysis.vocaTopWrong.map((w) => {
              const borderColor = w.count >= 3 ? '#F43F5E' : w.count === 2 ? '#FB7185' : '#FCA5A5';
              return (
                <div key={w.word} className="flex items-center justify-between rounded-lg bg-white px-3 py-2" style={{ borderLeft: `3px solid ${borderColor}` }}>
                  <span className="text-sm font-medium text-gray-800">{w.word}</span>
                  <Badge className="bg-rose-100 text-rose-700 border-0 text-xs hover:bg-rose-100">{w.count}회</Badge>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {hasNaesin && data.wrongAnalysis.naesinWrongByStage.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-3">내신 스테이지별 오답</h4>
          <div className="grid gap-2 sm:grid-cols-2">
            {data.wrongAnalysis.naesinWrongByStage.map((s) => (
              <div key={s.stage} className="flex items-center justify-between rounded-lg border px-3 py-2.5" style={{ borderLeft: '3px solid #06B6D4' }}>
                <span className="text-sm font-medium">{s.stage}</span>
                <div className="flex gap-3 text-xs">
                  <span className="text-gray-500">전체 {s.total}</span>
                  {s.unresolved > 0 && (
                    <span className="text-red-500 font-semibold">미해결 {s.unresolved}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {hasNaesin && data.wrongAnalysis.naesinWrongByUnit.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-3">내신 단원별 오답</h4>
          <div className="space-y-2">
            {data.wrongAnalysis.naesinWrongByUnit.map((u) => (
              <div key={u.unitId} className="flex items-center justify-between rounded-lg border px-3 py-2" style={{ borderLeft: '3px solid #06B6D4' }}>
                <span className="text-sm font-medium truncate">{u.unitTitle}</span>
                <div className="flex gap-3 text-xs shrink-0">
                  <span className="text-gray-500">전체 {u.total}</span>
                  {u.unresolved > 0 && (
                    <span className="text-red-500 font-semibold">미해결 {u.unresolved}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.wrongAnalysis.vocaTopWrong.length === 0 && data.wrongAnalysis.naesinWrongByStage.length === 0 && (
        <div className="rounded-xl border border-dashed p-8 text-center">
          <PartyPopper className="h-8 w-8 text-violet-400 mb-2" />
          <p className="text-sm text-gray-500 font-medium">오답 없음! 완벽해요!</p>
        </div>
      )}
    </div>
  );
}
