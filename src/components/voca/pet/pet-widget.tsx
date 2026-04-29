'use client';

import { usePet } from '@/hooks/use-pet';
import { PetImage } from './pet-images';
import { STAGE_NAMES, STAGE_THRESHOLDS } from '@/lib/voca/pet-constants';

const MOOD_LABEL: Record<string, string> = {
  happy: '행복해요 😊',
  normal: '보통이에요',
  hungry: '배고파요... 🥺',
};

const MOOD_COLOR: Record<string, string> = {
  happy: 'text-green-600',
  normal: 'text-gray-500',
  hungry: 'text-orange-500',
};

export function PetWidget() {
  const { pet, loading } = usePet();

  if (loading || !pet) return null;

  const stageName = STAGE_NAMES[pet.stage];
  const isMaxStage = pet.stage === 4;

  return (
    <div className="rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50/80 to-orange-50/40 p-4">
      <div className="flex items-center gap-4">
        {/* Pet image */}
        <div className="shrink-0">
          <PetImage stage={pet.stage} mood={pet.mood} size={64} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-800">{stageName}</span>
            <span className={`text-xs font-medium ${MOOD_COLOR[pet.mood]}`}>
              {MOOD_LABEL[pet.mood]}
            </span>
          </div>

          {/* XP progress bar */}
          {!isMaxStage ? (
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 rounded-full bg-amber-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-400 transition-all duration-500"
                    style={{ width: `${pet.stageProgress * 100}%` }}
                  />
                </div>
                <span className="text-[11px] font-medium text-amber-600 tabular-nums shrink-0">
                  {pet.xp}/{STAGE_THRESHOLDS[pet.stage + 1]} XP
                </span>
              </div>
              <p className="text-[10px] text-gray-400">
                다음 단계까지 {pet.nextStageXp} XP
              </p>
            </div>
          ) : (
            <p className="text-xs font-semibold text-amber-600">MAX LEVEL ✨</p>
          )}
        </div>
      </div>
    </div>
  );
}
