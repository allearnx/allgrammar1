'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAiImproveState } from '@/hooks/use-ai-improve-state';
import type { NaesinProblemSheet } from '@/types/naesin';

const SEVERITY_CONFIG = {
  high: { label: '심각', variant: 'destructive' as const, className: 'bg-red-100 text-red-800' },
  medium: { label: '보통', variant: 'secondary' as const, className: 'bg-yellow-100 text-yellow-800' },
  low: { label: '낮음', variant: 'outline' as const, className: 'bg-gray-100 text-gray-800' },
};

interface Props {
  sheet: NaesinProblemSheet;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (updated: NaesinProblemSheet) => void;
}

export function AiProblemImproveDialog({ sheet, open, onOpenChange, onUpdate }: Props) {
  const {
    step,
    analysis,
    selectedIssues,
    selectedTraps,
    applying,
    hasSelections,
    handleOpenChange,
    handleAnalyze,
    toggleIssue,
    toggleTrap,
    handleApply,
  } = useAiImproveState({ sheet, onOpenChange, onUpdate });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>AI 문제 개선 — {sheet.title}</DialogTitle>
        </DialogHeader>

        {step === 'idle' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              AI가 문제 세트를 분석하여 패턴 게이밍 가능성, 오답 품질, 함정 문제 부재 등을 점검합니다.
            </p>
            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              <p>현재 문제 수: <span className="font-medium">{sheet.questions?.length || 0}문제</span></p>
            </div>
            <Button className="w-full" onClick={handleAnalyze}>
              AI 분석 시작
            </Button>
          </div>
        )}

        {step === 'analyzing' && (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">AI 분석 중... (최대 3분 소요)</p>
            <p className="text-xs text-muted-foreground">기존 검증 실행 + 품질 분석 + 개선안 생성</p>
          </div>
        )}

        {step === 'review' && analysis && (
          <div className="space-y-5">
            {/* Summary */}
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">분석 결과</h3>
                <Badge
                  variant={analysis.score >= 80 ? 'default' : analysis.score >= 50 ? 'secondary' : 'destructive'}
                  className="text-sm"
                >
                  {analysis.score}점
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{analysis.summary}</p>
            </div>

            {/* Issues */}
            {analysis.issues.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">문제별 이슈 ({analysis.issues.length}건)</h3>
                <div className="rounded-lg border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="p-2 w-8"></th>
                        <th className="text-left p-2 w-10">#</th>
                        <th className="text-left p-2">문제점</th>
                        <th className="text-left p-2 w-16">심각도</th>
                        <th className="text-left p-2">개선안</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysis.issues.map((issue, i) => (
                        <tr key={i} className="border-t">
                          <td className="p-2">
                            {issue.improvedQuestion && (
                              <Checkbox
                                checked={selectedIssues.has(i)}
                                onCheckedChange={() => toggleIssue(i)}
                              />
                            )}
                          </td>
                          <td className="p-2 font-mono">{issue.questionNumber}</td>
                          <td className="p-2">{issue.issue}</td>
                          <td className="p-2">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${SEVERITY_CONFIG[issue.severity].className}`}>
                              {issue.severity === 'high' && <AlertTriangle className="h-3 w-3 mr-1" />}
                              {SEVERITY_CONFIG[issue.severity].label}
                            </span>
                          </td>
                          <td className="p-2 text-muted-foreground">{issue.suggestion}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {analysis.issues.length === 0 && (
              <div className="flex items-center gap-2 rounded-lg border p-4 text-sm text-green-700 bg-green-50">
                <CheckCircle2 className="h-4 w-4" />
                문제 이슈가 발견되지 않았습니다.
              </div>
            )}

            {/* Trap suggestions */}
            {analysis.trapSuggestions.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">추가 함정 문제 제안 ({analysis.trapSuggestions.length}개)</h3>
                <div className="space-y-2">
                  {analysis.trapSuggestions.map((trap, i) => (
                    <div key={i} className="rounded-lg border p-3 space-y-1">
                      <div className="flex items-start gap-2">
                        <Checkbox
                          checked={selectedTraps.has(i)}
                          onCheckedChange={() => toggleTrap(i)}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{trap.question.question}</p>
                          {trap.question.options && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {trap.question.options.map((opt, oi) => (
                                <Badge key={oi} variant={String(oi + 1) === String(trap.question.answer) ? 'default' : 'outline'} className="text-xs">
                                  {oi + 1}. {opt}
                                </Badge>
                              ))}
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            <ArrowRight className="h-3 w-3 inline mr-1" />
                            {trap.reason}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Apply button */}
            <Button
              className="w-full"
              onClick={handleApply}
              disabled={applying || !hasSelections}
            >
              {applying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  적용 중...
                </>
              ) : hasSelections ? (
                `선택한 ${selectedIssues.size + selectedTraps.size}건 적용`
              ) : (
                '적용할 항목을 선택하세요'
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
