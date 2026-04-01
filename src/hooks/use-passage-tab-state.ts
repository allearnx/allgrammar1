import { useState, useEffect, useMemo } from 'react';

export type PassageStageType = 'fill_blanks' | 'ordering' | 'translation' | 'grammar_vocab';

const ONBOARDING_KEY = 'naesin-passage-onboarding-seen';
const STAGE_DIRECTION_KEY = 'naesin-passage-stage-directions-seen';

export const STAGE_TAB_MAP: Record<PassageStageType, { value: string; label: string }> = {
  fill_blanks: { value: 'fill-blanks', label: '빈칸 채우기' },
  ordering: { value: 'ordering', label: '순서 배열' },
  translation: { value: 'translation', label: '영작' },
  grammar_vocab: { value: 'grammar-vocab', label: '어법/어휘' },
};

interface UsePassageTabStateOptions {
  requiredStages?: string[];
  naesinRequiredRounds?: number;
  round1Completed?: boolean;
}

export function usePassageTabState({ requiredStages, naesinRequiredRounds, round1Completed }: UsePassageTabStateOptions) {
  const hasRound2 = (naesinRequiredRounds ?? 1) >= 2;
  const [currentRound, setCurrentRound] = useState<1 | 2>(1);

  const stages = useMemo(() => {
    const raw = (requiredStages ?? ['fill_blanks', 'translation']) as PassageStageType[];
    return raw.filter((s) => STAGE_TAB_MAP[s]);
  }, [requiredStages]);

  const uniqueStages = useMemo(() => [...new Set(stages)], [stages]);

  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of stages) {
      counts[s] = (counts[s] || 0) + 1;
    }
    return counts;
  }, [stages]);

  const firstTabValue = uniqueStages.length > 0 ? STAGE_TAB_MAP[uniqueStages[0]].value : 'fill-blanks';
  const [activeTab, setActiveTab] = useState(firstTabValue);
  const [currentPassageIndex, setCurrentPassageIndex] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [stageDirection, setStageDirection] = useState<PassageStageType | null>(null);

  const [seenDirections, setSeenDirections] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(STAGE_DIRECTION_KEY);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    try {
      if (!localStorage.getItem(ONBOARDING_KEY)) {
        setShowOnboarding(true);
      } else {
        const stageKey = (Object.entries(STAGE_TAB_MAP) as [PassageStageType, { value: string }][])
          .find(([, v]) => v.value === activeTab)?.[0];
        if (stageKey && !seenDirections.has(stageKey)) {
          setStageDirection(stageKey);
        }
      }
    } catch {
      // localStorage unavailable
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function dismissOnboarding() {
    setShowOnboarding(false);
    try {
      localStorage.setItem(ONBOARDING_KEY, '1');
    } catch {
      // localStorage unavailable
    }
    const firstStage = uniqueStages[0];
    if (firstStage && !seenDirections.has(firstStage)) {
      setStageDirection(firstStage);
    }
  }

  function handleTabChange(tabValue: string) {
    setActiveTab(tabValue);
    const stageKey = (Object.entries(STAGE_TAB_MAP) as [PassageStageType, { value: string }][])
      .find(([, v]) => v.value === tabValue)?.[0];
    if (stageKey && !seenDirections.has(stageKey)) {
      setStageDirection(stageKey);
    }
  }

  function dismissStageDirection() {
    if (!stageDirection) return;
    const next = new Set(seenDirections);
    next.add(stageDirection);
    setSeenDirections(next);
    setStageDirection(null);
    try {
      localStorage.setItem(STAGE_DIRECTION_KEY, JSON.stringify([...next]));
    } catch {
      // localStorage unavailable
    }
  }

  const round2Locked = hasRound2 && currentRound === 2 && !round1Completed;

  const gridCols = uniqueStages.length === 1 ? 'grid-cols-1' : uniqueStages.length === 2 ? 'grid-cols-2' : uniqueStages.length === 3 ? 'grid-cols-3' : 'grid-cols-4';

  return {
    hasRound2,
    currentRound,
    setCurrentRound,
    uniqueStages,
    stageCounts,
    activeTab,
    currentPassageIndex,
    setCurrentPassageIndex,
    showOnboarding,
    stageDirection,
    round2Locked,
    gridCols,
    round1Completed,
    dismissOnboarding,
    handleTabChange,
    dismissStageDirection,
  };
}
