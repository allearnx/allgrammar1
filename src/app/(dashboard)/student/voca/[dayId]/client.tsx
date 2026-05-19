'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { NeonVocaTab } from '@/components/voca/neon';
import { VocaTab2 } from '@/components/voca/vocab-tab/voca-tab-round2';
import type { VocaDay, VocaVocabulary, VocaStudentProgress } from '@/types/voca';
import { useLearningSession } from '@/hooks/use-learning-session';

export interface WrongWordItem {
  front_text: string;
  back_text: string;
}

interface VocaDayClientProps {
  day: VocaDay;
  vocabulary: VocaVocabulary[];
  progress: VocaStudentProgress | null;
  wrongWords?: WrongWordItem[];
  currentRound: '1' | '2';
  hasMatchingSubmission?: boolean;
}

export function VocaDayClient({ day, vocabulary, progress, currentRound }: VocaDayClientProps) {
  const router = useRouter();
  useLearningSession('voca', day.id);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/student/voca?bookId=${day.book_id}`)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-lg font-semibold">{day.title}</h2>
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">{vocabulary.length}개 단어</p>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              currentRound === '2'
                ? 'bg-violet-100 text-violet-700'
                : 'bg-cyan-100 text-cyan-700'
            }`}>
              {currentRound}회독
            </span>
          </div>
        </div>
      </div>

      {currentRound === '1' ? (
        <NeonVocaTab
          vocabulary={vocabulary}
          dayId={day.id}
          progress={progress}
          dayTitle={day.title}
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
