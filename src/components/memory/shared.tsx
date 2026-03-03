import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, ChevronRight } from 'lucide-react';

interface ScoreBadgesProps {
  correct: number;
  wrong: number;
}

export function ScoreBadges({ correct, wrong }: ScoreBadgesProps) {
  return (
    <div className="flex gap-2">
      <Badge variant="outline" className="text-green-600">
        <CheckCircle className="h-3 w-3 mr-1" />
        {correct}
      </Badge>
      <Badge variant="outline" className="text-red-600">
        <XCircle className="h-3 w-3 mr-1" />
        {wrong}
      </Badge>
    </div>
  );
}

interface ResultCardProps {
  isCorrect: boolean;
  correctAnswer?: string;
}

export function ResultCard({ isCorrect, correctAnswer }: ResultCardProps) {
  return (
    <Card className={isCorrect ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}>
      <CardContent className="py-4 text-center">
        {isCorrect ? (
          <div className="flex items-center justify-center gap-2 text-green-700">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">정답!</span>
          </div>
        ) : (
          <div className="text-red-700">
            <div className="flex items-center justify-center gap-2 mb-2">
              <XCircle className="h-5 w-5" />
              <span className="font-medium">오답</span>
            </div>
            {correctAnswer && (
              <p className="text-sm">
                정답: <strong>{correctAnswer}</strong>
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface CompletionViewProps {
  label: string;
  correct: number;
  total: number;
  onReset: () => void;
}

export function CompletionView({ label, correct, total, onReset }: CompletionViewProps) {
  return (
    <div className="space-y-3">
      <p className="text-lg font-semibold">
        {label} 완료! {correct}/{total} 정답
      </p>
      <Button onClick={onReset}>다시 풀기</Button>
    </div>
  );
}

interface NextButtonProps {
  onClick: () => void;
}

export function NextButton({ onClick }: NextButtonProps) {
  return (
    <Button onClick={onClick}>
      다음 문제
      <ChevronRight className="h-4 w-4 ml-1" />
    </Button>
  );
}
