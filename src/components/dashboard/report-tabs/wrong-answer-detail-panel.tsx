'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import type { NaesinWrongAnswer } from '@/types/database';

const STAGE_LABELS: Record<string, string> = {
  vocab: '단어',
  passage: '교과서 암기',
  dialogue: '대화문 암기',
  grammar: '문법',
  problem: '문제풀이',
  lastReview: '직전보강',
};

interface Props {
  studentId: string;
}

export function WrongAnswerDetailPanel({ studentId }: Props) {
  const [wrongAnswers, setWrongAnswers] = useState<NaesinWrongAnswer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchWithToast<NaesinWrongAnswer[]>(
          `/api/naesin/wrong-answers/student?studentId=${studentId}`,
          { method: 'GET', silent: true, logContext: 'wrong_answer_detail_panel' }
        );
        if (!cancelled) setWrongAnswers(Array.isArray(data) ? data : []);
      } catch {
        // silently handled
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [studentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
        <span className="ml-2 text-sm text-gray-500">오답 상세 로딩 중...</span>
      </div>
    );
  }

  if (wrongAnswers.length === 0) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">오답 기록이 없습니다.</p>
      </div>
    );
  }

  // Group by stage
  const grouped: Record<string, NaesinWrongAnswer[]> = {};
  wrongAnswers.forEach((wa) => {
    if (!grouped[wa.stage]) grouped[wa.stage] = [];
    grouped[wa.stage].push(wa);
  });

  const unresolvedCount = wrongAnswers.filter((wa) => !wa.resolved).length;

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-red-500" />
        <span className="text-sm font-medium">
          전체 {wrongAnswers.length}개
          {unresolvedCount > 0 && (
            <span className="text-red-500 ml-1">(미해결 {unresolvedCount}개)</span>
          )}
        </span>
      </div>

      {Object.entries(grouped).map(([stage, items]) => (
        <div key={stage}>
          <p className="text-sm font-medium text-muted-foreground mb-2">
            {STAGE_LABELS[stage] || stage} ({items.length}개)
          </p>
          <div className="space-y-2">
            {items.map((wa) => (
              <ReadOnlyWrongAnswerCard key={wa.id} wrongAnswer={wa} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ReadOnlyWrongAnswerCard({ wrongAnswer }: { wrongAnswer: NaesinWrongAnswer }) {
  const data = wrongAnswer.question_data as Record<string, string>;

  return (
    <Card className={wrongAnswer.resolved ? 'opacity-60' : ''}>
      <CardContent className="py-3">
        <div className="text-sm space-y-1">
          {data.question ? <p className="font-medium">{data.question}</p> : null}
          {data.type === 'fill_blank' ? (
            <>
              <p className="text-red-500">학생 답: {data.userAnswer || '-'}</p>
              <p className="text-green-600">정답: {data.correctAnswer}</p>
            </>
          ) : null}
          {data.type === 'translation' ? (
            <>
              <p className="text-muted-foreground">{data.koreanText || ''}</p>
              <p className="text-red-500">학생 답: {data.userAnswer || '-'}</p>
              {data.feedback ? <p className="text-sm">{data.feedback}</p> : null}
            </>
          ) : null}
          {data.number && data.type !== 'fill_blank' && data.type !== 'translation' ? (
            <>
              <p className="text-red-500">학생 답: {data.userAnswer || '-'}</p>
              <p className="text-green-600">정답: {data.correctAnswer}</p>
            </>
          ) : null}
          <div className="flex gap-1.5 pt-1">
            <Badge variant="secondary" className="text-xs">
              {wrongAnswer.source_type}
            </Badge>
            {wrongAnswer.resolved && (
              <Badge className="bg-green-100 text-green-700 border-0 text-xs hover:bg-green-100">
                해결됨
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
