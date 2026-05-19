'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Question, QuestionType, MCQuestion, ArrangeQuestion } from './comprehensive-quiz-generator';

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
    case 'mc_antonym':
    case 'idiom_en_to_ko': {
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
    case 'idiom_ko_to_en':
    case 'idiom_example_translate': {
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

    case 'word_arrange': {
      const arrQ = question as ArrangeQuestion;
      const selected: string[] = answer ? JSON.parse(answer) : [];
      const remaining = [...arrQ.scrambledWords];
      // Remove already-selected words from remaining (handle duplicates)
      for (const s of selected) {
        const idx = remaining.indexOf(s);
        if (idx !== -1) remaining.splice(idx, 1);
      }

      function toggleWord(word: string) {
        const next = [...selected, word];
        onAnswer(JSON.stringify(next));
      }

      function removeWord(index: number) {
        const next = selected.filter((_, i) => i !== index);
        onAnswer(next.length > 0 ? JSON.stringify(next) : '');
      }

      function resetAll() {
        onAnswer('');
      }

      return (
        <div className="space-y-4">
          <p className="font-medium whitespace-pre-line">{arrQ.prompt}</p>

          {/* Selected words (answer area) */}
          <div className="min-h-[48px] rounded-lg border-2 border-dashed border-gray-300 p-3 flex flex-wrap gap-2 items-start">
            {selected.length === 0 && (
              <span className="text-sm text-muted-foreground">단어를 터치하여 배열하세요</span>
            )}
            {selected.map((w, i) => (
              <button
                key={i}
                onClick={() => removeWord(i)}
                className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/80 transition-colors"
              >
                {w}
              </button>
            ))}
          </div>

          {/* Remaining scrambled words */}
          <div className="flex flex-wrap gap-2">
            {remaining.map((w, i) => (
              <button
                key={i}
                onClick={() => toggleWord(w)}
                className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-sm font-medium hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                {w}
              </button>
            ))}
          </div>

          {selected.length > 0 && (
            <button
              onClick={resetAll}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              초기화
            </button>
          )}
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
    word_arrange: '단어 배열',
  };

  const isAI = type === 'idiom_ko_to_en' || type === 'idiom_example_translate';

  return (
    <Badge variant="outline" className={cn('text-[10px] h-5', isAI && 'border-blue-300 text-blue-600')}>
      {labels[type]}
      {isAI && ' AI'}
    </Badge>
  );
}
