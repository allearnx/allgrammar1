'use client';

import { BookOpen, BookMarked, Lock } from 'lucide-react';
import type { RoundMode } from '@/lib/voca/home-progress';

/** 학습 방식 — 책 전체(1회독 훑고 2회독) vs Day별 완벽(Day마다 1+2회독). 잠금(무료)이면 Day별 비활성 */
export function RoundModeToggle({ roundMode, round2Locked: planLocked, round2FreeDays = 0, isPending, onChange }: {
  roundMode: RoundMode;
  round2Locked: boolean;
  /** 무료라도 2회독이 열리는 앞 Day 수 — 있으면 Day별 모드도 쓸 수 있다 */
  round2FreeDays?: number;
  isPending: boolean;
  onChange: (mode: RoundMode) => void;
}) {
  const freeRound2 = planLocked && round2FreeDays > 0;
  const round2Locked = planLocked && !freeRound2;
  return (
    <div className="rounded-3xl border bg-white p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="voca-display text-sm text-gray-800" style={{ fontWeight: 700 }}>학습 방식</p>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          <button
            onClick={() => onChange('book')}
            disabled={isPending || roundMode === 'book'}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold transition-colors ${
              roundMode === 'book'
                ? 'bg-primary text-white'
                : 'bg-white text-gray-500 hover:bg-gray-50'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            책 전체
          </button>
          <button
            onClick={() => onChange('day')}
            disabled={isPending || roundMode === 'day' || round2Locked}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold transition-colors ${
              roundMode === 'day'
                ? 'bg-primary text-white'
                : round2Locked
                  ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                  : 'bg-white text-gray-500 hover:bg-gray-50'
            }`}
          >
            {round2Locked ? <Lock className="h-3.5 w-3.5" /> : <BookMarked className="h-4 w-4" />}
            Day별 완벽
          </button>
        </div>
      </div>
      <p className="text-xs text-gray-400">
        {round2Locked
          ? 'Day별 완벽 모드는 2회독을 포함해서 유료 플랜에서 열려요. 무료 체험은 책 전체 1회독으로 진행됩니다.'
          : freeRound2
            ? `무료 체험은 Day 1~${round2FreeDays}까지 1회독·2회독을 모두 해 볼 수 있어요. 그 뒤 Day의 2회독은 유료 플랜에서 열려요.`
          : roundMode === 'book'
            ? '전체 Day를 1회독으로 훑은 뒤, 다시 처음부터 2회독으로 반복합니다.'
            : '각 Day를 1회독+2회독 완벽히 마치고 다음 Day로 넘어갑니다.'}
      </p>
    </div>
  );
}
