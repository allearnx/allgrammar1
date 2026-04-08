'use client';

import { lazy, Suspense, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PartyPopper, Loader2, Eye, EyeOff } from 'lucide-react';
import type { StudentReportData } from '@/types/student-report';

const WrongAnswerDetailPanel = lazy(() =>
  import('./wrong-answer-detail-panel').then((m) => ({ default: m.WrongAnswerDetailPanel }))
);

interface Props {
  data: StudentReportData;
  hasVoca: boolean;
  hasNaesin: boolean;
  studentId?: string;
  role?: string;
  onRefresh?: () => void;
}

export function WrongAnalysisTab({ data, hasVoca, hasNaesin, studentId, role, onRefresh }: Props) {
  const [showDetail, setShowDetail] = useState(false);
  const isStaff = role === 'teacher' || role === 'admin' || role === 'boss';

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

      {/* 선생님/원장/boss: 오답 상세 보기 버튼 */}
      {isStaff && studentId && hasNaesin && (
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2"
          onClick={() => setShowDetail((prev) => !prev)}
        >
          {showDetail ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {showDetail ? '오답 상세 닫기' : '오답 상세 보기'}
        </Button>
      )}

      {showDetail && studentId && (
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
              <span className="ml-2 text-sm text-gray-500">로딩 중...</span>
            </div>
          }
        >
          <WrongAnswerDetailPanel studentId={studentId} onRefresh={onRefresh} />
        </Suspense>
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
