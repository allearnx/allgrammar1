import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getEncouragement } from '@/lib/naesin/encouragement';
import { extractAnswer } from '@/lib/naesin/normalize-answer';
import { FormattedText } from '@/components/shared/formatted-text';
import type { WrongItem } from '@/hooks/use-problem-draft';

export function ResultsScreen({
  score,
  totalQuestions,
  wrongList,
}: {
  score: { correct: number; wrong: number };
  totalQuestions: number;
  wrongList: WrongItem[];
}) {
  const pct = Math.round((score.correct / totalQuestions) * 100);

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <div className="text-center space-y-2">
        <p className={cn(
          'text-6xl font-bold',
          pct >= 80 ? 'text-green-600' : pct >= 50 ? 'text-yellow-600' : 'text-red-600'
        )}>
          {pct}점
        </p>
        <p className="text-muted-foreground">
          {totalQuestions}문제 중 {score.correct}개 정답
        </p>
        <p className={cn(
          'text-sm font-medium mt-1',
          pct >= 80 ? 'text-green-600' : 'text-orange-600'
        )}>
          {getEncouragement(pct)}
        </p>
      </div>

      {wrongList.length > 0 && (
        <>
          <Card>
            <CardContent className="py-4">
              <p className="font-medium text-red-600 mb-3">틀린 문제 ({wrongList.length}개)</p>
              <div className="space-y-3">
                {wrongList.map((w, i) => (
                  <div key={i} className="text-sm border-b last:border-0 pb-2 space-y-1">
                    <p className="font-medium">#{w.number}. <FormattedText text={w.question} /></p>
                    {w.subParts ? (() => {
                      const parts = String(w.userAnswer).split(' / ');
                      const norm = (s: string) => s.trim().toLowerCase().replace(/[.\s]+$/g, '');
                      return (
                        <div className="space-y-0.5">
                          {w.subParts.map((sp, j) => {
                            const student = parts[j]?.trim() ?? '';
                            const candidates = [sp.answer, ...(sp.acceptedAnswers ?? [])];
                            const ok = candidates.some(c => norm(c) === norm(student));
                            return (
                              <div key={j} className="flex gap-2">
                                <span className="font-medium w-8 shrink-0">{sp.label}</span>
                                <span className={ok ? 'text-green-600' : 'text-red-500'}>{student || '(미입력)'}</span>
                                {!ok && <span className="text-green-600">→ {sp.answer}</span>}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })() : (
                      <>
                        <p className="text-red-500">내 답: {w.userAnswer}</p>
                        <p className="text-green-600">정답: {extractAnswer(w.correctAnswer)}</p>
                      </>
                    )}
                    {w.options && w.options.length > 0 && (
                      <div className="mt-1 pl-2 border-l-2 border-muted space-y-0.5">
                        {w.options.map((opt, oi) => (
                          <p key={oi} className="text-xs text-muted-foreground">
                            <span className="font-medium">{'①②③④⑤'[oi] ?? `${oi + 1}`}</span>{' '}<FormattedText text={opt} />
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            오답이 기록되었습니다.
          </div>
        </>
      )}
    </div>
  );
}
