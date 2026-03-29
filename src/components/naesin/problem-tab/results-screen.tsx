import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
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
      </div>

      {wrongList.length > 0 && (
        <>
          <Card>
            <CardContent className="py-4">
              <p className="font-medium text-red-600 mb-3">틀린 문제 ({wrongList.length}개)</p>
              <div className="space-y-3">
                {wrongList.map((w, i) => (
                  <div key={i} className="text-sm border-b last:border-0 pb-2 space-y-1">
                    <p className="font-medium">#{w.number}. {w.question}</p>
                    <p className="text-red-500">내 답: {w.userAnswer}</p>
                    <p className="text-green-600">정답: {w.correctAnswer}</p>
                    {w.aiFeedback && (
                      <div className="mt-1 pl-2 border-l-2 border-indigo-300">
                        <p className="text-xs text-indigo-600 font-medium">AI 채점: {w.aiFeedback.score}점</p>
                        <p className="text-xs text-muted-foreground">{w.aiFeedback.feedback}</p>
                        <p className="text-xs text-green-700">교정: {w.aiFeedback.correctedAnswer}</p>
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
