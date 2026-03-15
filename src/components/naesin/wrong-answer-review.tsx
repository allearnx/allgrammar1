'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import type { NaesinWrongAnswer } from '@/types/database';

interface WrongAnswerReviewProps {
  unitId: string;
}

const STAGE_LABELS: Record<string, string> = {
  vocab: '단어',
  passage: '교과서 암기',
  grammar: '문법',
  problem: '문제풀이',
  lastReview: '직전보강',
};

export function WrongAnswerReview({ unitId }: WrongAnswerReviewProps) {
  const [wrongAnswers, setWrongAnswers] = useState<NaesinWrongAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unresolved'>('unresolved');

  const loadWrongAnswers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ unitId });
      if (filter === 'unresolved') params.set('resolved', 'false');
      const res = await fetch(`/api/naesin/wrong-answers?${params}`);
      const data = await res.json();
      setWrongAnswers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      } finally {
      setLoading(false);
    }
  }, [unitId, filter]);

  useEffect(() => {
    loadWrongAnswers();
  }, [loadWrongAnswers]);

  async function markResolved(id: string) {
    try {
      await fetch('/api/naesin/wrong-answers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, resolved: true }),
      });
      setWrongAnswers((prev) => prev.filter((wa) => wa.id !== id));
      toast.success('해결됨으로 표시되었습니다');
    } catch (err) {
      console.error(err);
      toast.error('업데이트 실패');
    }
  }

  // Group by stage
  const grouped: Record<string, NaesinWrongAnswer[]> = {};
  wrongAnswers.forEach((wa) => {
    if (!grouped[wa.stage]) grouped[wa.stage] = [];
    grouped[wa.stage].push(wa);
  });

  if (loading) {
    return <p className="text-center text-muted-foreground py-4">로딩 중...</p>;
  }

  if (wrongAnswers.length === 0) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
        <p className="text-muted-foreground">틀린 문제가 없습니다!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <span className="text-sm font-medium">틀린 문제 ({wrongAnswers.length}개)</span>
        </div>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant={filter === 'unresolved' ? 'default' : 'outline'}
            onClick={() => setFilter('unresolved')}
            className="h-7 text-xs"
          >
            미해결
          </Button>
          <Button
            size="sm"
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            className="h-7 text-xs"
          >
            전체
          </Button>
        </div>
      </div>

      {Object.entries(grouped).map(([stage, items]) => (
        <div key={stage}>
          <p className="text-sm font-medium text-muted-foreground mb-2">
            {STAGE_LABELS[stage] || stage} ({items.length}개)
          </p>
          <div className="space-y-2">
            {items.map((wa) => (
              <WrongAnswerCard key={wa.id} wrongAnswer={wa} onResolve={() => markResolved(wa.id)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function WrongAnswerCard({ wrongAnswer, onResolve }: { wrongAnswer: NaesinWrongAnswer; onResolve: () => void }) {
  const data = wrongAnswer.question_data as Record<string, string>;

  return (
    <Card className={wrongAnswer.resolved ? 'opacity-60' : ''}>
      <CardContent className="py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="text-sm space-y-1 flex-1">
            {data.question ? <p className="font-medium">{data.question}</p> : null}
            {data.type === 'fill_blank' ? (
              <>
                <p className="text-red-500">내 답: {data.userAnswer || '-'}</p>
                <p className="text-green-600">정답: {data.correctAnswer}</p>
              </>
            ) : null}
            {data.type === 'translation' ? (
              <>
                <p className="text-muted-foreground">{data.koreanText || ''}</p>
                <p className="text-red-500">내 답: {data.userAnswer || '-'}</p>
                {data.feedback ? <p className="text-sm">{data.feedback}</p> : null}
              </>
            ) : null}
            {data.number && data.type !== 'fill_blank' && data.type !== 'translation' ? (
              <>
                <p className="text-red-500">내 답: {data.userAnswer || '-'}</p>
                <p className="text-green-600">정답: {data.correctAnswer}</p>
              </>
            ) : null}
            <Badge variant="secondary" className="text-xs">
              {wrongAnswer.source_type}
            </Badge>
          </div>
          {!wrongAnswer.resolved && (
            <Button size="sm" variant="outline" className="h-7 text-xs shrink-0" onClick={onResolve}>
              해결됨
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
