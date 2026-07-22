'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Lock } from 'lucide-react';
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
  /** 첫 진입 탭 — 1회독 완료/면제 여부로 서버가 결정. 이후엔 학생이 자유 전환 (2026-07-22 완전 개방) */
  initialRound: '1' | '2';
  /** 무료 플랜 2회독 잠금 (결제 정책 — 자유 전환과 별개) */
  round2Locked?: boolean;
  hasMatchingSubmission?: boolean;
}

export function VocaDayClient({ day, vocabulary, progress, initialRound, round2Locked = false }: VocaDayClientProps) {
  const router = useRouter();
  const [round, setRound] = useState<'1' | '2'>(round2Locked ? '1' : initialRound);
  useLearningSession('voca', day.id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.push(`/student/voca?bookId=${day.book_id}`)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-lg font-semibold">{day.title}</h2>
            <p className="text-sm text-muted-foreground">{vocabulary.length}개 단어</p>
          </div>
        </div>

        {/* 1회독/2회독 자유 전환 (무료 플랜은 2회독 잠금) */}
        <div className="flex rounded-full bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => setRound('1')}
            className={`rounded-full px-4 py-1.5 text-sm font-bold transition-colors ${
              round === '1' ? 'bg-white text-cyan-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            1회독
          </button>
          <button
            type="button"
            onClick={() => !round2Locked && setRound('2')}
            disabled={round2Locked}
            className={`flex items-center gap-1 rounded-full px-4 py-1.5 text-sm font-bold transition-colors ${
              round === '2'
                ? 'bg-white text-brand-700 shadow-sm'
                : round2Locked
                  ? 'cursor-not-allowed text-gray-300'
                  : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {round2Locked && <Lock className="h-3 w-3" />}
            2회독
          </button>
        </div>
      </div>

      {round === '1' ? (
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
