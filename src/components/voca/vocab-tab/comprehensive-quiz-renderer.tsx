'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Question, QuestionType, MCQuestion } from './comprehensive-quiz-generator';

export function QuestionRenderer({
  question,
  answer,
  onAnswer,
}: {
  question: Question;
  answer: string;
  onAnswer: (answer: string) => void;
}) {
  switch (question.type) {
    case 'mc_synonym':
    case 'mc_antonym': {
      const mcQ = question as MCQuestion;
      return (
        <div className="space-y-3">
          <p className="font-medium">{mcQ.prompt}</p>
          <div className="space-y-2">
            {mcQ.choices.map((choice, i) => (
              <Button
                key={i}
                variant="outline"
                className={cn(
                  'w-full justify-start text-left h-auto py-3',
                  answer === String(i) && 'ring-2 ring-primary bg-primary/5'
                )}
                onClick={() => onAnswer(String(i))}
              >
                <span className="mr-2 text-muted-foreground">{i + 1}.</span>
                {choice}
              </Button>
            ))}
          </div>
        </div>
      );
    }

    case 'short_synonym':
    case 'short_antonym':
    case 'fill_blank':
    case 'idiom_en_to_ko':
    case 'idiom_ko_to_en':
    case 'idiom_example_translate':
    case 'idiom_writing': {
      return (
        <div className="space-y-3">
          <p className="font-medium whitespace-pre-line">{question.prompt}</p>
          <Input
            value={answer}
            onChange={(e) => onAnswer(e.target.value)}
            placeholder="답을 입력하세요"
            className="text-base"
          />
        </div>
      );
    }

    default:
      return null;
  }
}

export function QuestionTypeBadge({ type }: { type: QuestionType }) {
  const labels: Record<QuestionType, string> = {
    mc_synonym: '유의어 선택',
    mc_antonym: '반의어 선택',
    short_synonym: '유의어 쓰기',
    short_antonym: '반의어 쓰기',
    fill_blank: '빈칸 채우기',
    idiom_en_to_ko: '숙어 해석',
    idiom_ko_to_en: '숙어 영작',
    idiom_example_translate: '예문 해석',
    idiom_writing: '영작',
  };

  const isAI = type.startsWith('idiom_');

  return (
    <Badge variant="outline" className={cn('text-[10px] h-5', isAI && 'border-blue-300 text-blue-600')}>
      {labels[type]}
      {isAI && ' AI'}
    </Badge>
  );
}
