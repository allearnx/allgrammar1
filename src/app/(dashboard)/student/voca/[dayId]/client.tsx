'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { VocaTab } from '@/components/voca/vocab-tab';
import type { VocaDay, VocaVocabulary, VocaStudentProgress } from '@/types/voca';

interface VocaDayClientProps {
  day: VocaDay;
  vocabulary: VocaVocabulary[];
  progress: VocaStudentProgress | null;
}

export function VocaDayClient({ day, vocabulary, progress }: VocaDayClientProps) {
  const router = useRouter();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.push('/student/voca')}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-lg font-semibold">{day.title}</h2>
          <p className="text-sm text-muted-foreground">{vocabulary.length}개 단어</p>
        </div>
      </div>

      <VocaTab
        vocabulary={vocabulary}
        dayId={day.id}
        progress={progress}
      />
    </div>
  );
}
