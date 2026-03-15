'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { VocaTab } from '@/components/voca/vocab-tab';
import { VocaTab2 } from '@/components/voca/vocab-tab/voca-tab-round2';
import { cn } from '@/lib/utils';
import type { VocaDay, VocaVocabulary, VocaStudentProgress } from '@/types/voca';

export interface WrongWordItem {
  front_text: string;
  back_text: string;
}

interface VocaDayClientProps {
  day: VocaDay;
  vocabulary: VocaVocabulary[];
  progress: VocaStudentProgress | null;
  wrongWords: WrongWordItem[];
  round2Locked?: boolean;
}

export function VocaDayClient({ day, vocabulary, progress, wrongWords, round2Locked = false }: VocaDayClientProps) {
  const router = useRouter();
  const [round, setRound] = useState<'1' | '2'>('1');

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/student/voca?bookId=${day.book_id}`)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-lg font-semibold">{day.title}</h2>
          <p className="text-sm text-muted-foreground">{vocabulary.length}개 단어</p>
        </div>
      </div>

      {/* Round toggle */}
      <div className="flex gap-1 p-1 rounded-lg bg-muted w-fit">
        <button
          className={cn(
            'px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
            round === '1'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
          onClick={() => setRound('1')}
        >
          1회독
        </button>
        <button
          className={cn(
            'px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
            round2Locked && 'opacity-50 cursor-not-allowed',
            round === '2'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
          onClick={() => !round2Locked && setRound('2')}
          disabled={round2Locked}
        >
          {round2Locked && <Lock className="inline h-3 w-3 mr-1" />}
          2회독
        </button>
      </div>

      {round === '1' ? (
        <VocaTab
          vocabulary={vocabulary}
          dayId={day.id}
          progress={progress}
          wrongWords={wrongWords}
        />
      ) : (
        <VocaTab2
          vocabulary={vocabulary}
          dayId={day.id}
          progress={progress}
        />
      )}
    </div>
  );
}
