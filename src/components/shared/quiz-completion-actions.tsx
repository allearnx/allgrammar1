import { Button } from '@/components/ui/button';
import { ListRestart, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuizCompletionActionsProps {
  wrongCount: number;
  onRetryWrong: () => void;
  onReset: () => void;
  passed?: boolean;
  layout?: 'row' | 'column';
}

export function QuizCompletionActions({
  wrongCount,
  onRetryWrong,
  onReset,
  passed,
  layout = 'row',
}: QuizCompletionActionsProps) {
  const isColumn = layout === 'column';
  const btnClass = isColumn ? 'w-full' : 'flex-1';

  return (
    <>
      {wrongCount > 0 && (
        <Button
          onClick={onRetryWrong}
          className={cn(btnClass, passed === false && 'ring-2 ring-orange-400')}
        >
          <ListRestart className="h-4 w-4 mr-1" />
          오답만 다시 풀기
        </Button>
      )}
      <Button onClick={onReset} variant="outline" className={btnClass}>
        <RotateCcw className="h-4 w-4 mr-1" />
        전체 다시 풀기
      </Button>
    </>
  );
}
