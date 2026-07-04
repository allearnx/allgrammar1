import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { BRAND } from '@/lib/utils/brand-colors';
import { FlowStep } from '../combined/flow-step';
import type { Stage } from '../combined/flow-step';
import type { NaesinUnit } from '@/types/naesin';

interface Props {
  currentUnit: NaesinUnit;
  currentStages: Stage[];
  ctaStage: Stage | undefined;
  currentDDay: number | null;
}

const STEP_DONE_BORDER = BRAND.step.doneBorder;
const CTA_BUTTON = BRAND.violet;

export function LearningFlowSection({ currentUnit, currentStages, ctaStage, currentDDay }: Props) {
  return (
    <div className="rounded-2xl border bg-white p-5 md:p-6 space-y-5">
      <h3 className="text-lg font-bold flex items-center gap-2">
        학습 흐름 — {currentUnit.title}
        {currentDDay !== null && currentDDay >= 0 && (
          <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium" style={{ borderColor: STEP_DONE_BORDER }}>
            {currentDDay === 0 ? 'D-Day' : `D-${currentDDay}`}
          </span>
        )}
      </h3>

      <div className="flex items-stretch gap-0 overflow-visible">
        {currentStages.map((stage, i) => (
          <div key={stage.key} className="contents">
            {i > 0 && <div className="flex items-center justify-center self-center px-1 md:px-1.5 text-gray-300 text-sm shrink-0">→</div>}
            <FlowStep stage={stage} dayId={`${currentUnit.id}/${stage.stageKey}`} linkPrefix="/student/naesin/" />
          </div>
        ))}
      </div>

      {ctaStage && (
        <div
          className="flex items-center justify-between rounded-xl px-5 py-3"
          style={{ background: 'linear-gradient(to right, #E8F0FE, #D2E3FC)' }}
        >
          <span className="text-sm font-medium text-gray-700">
            다음 단계: <strong>{ctaStage.label}</strong>
          </span>
          <Link
            href={`/student/naesin/${currentUnit.id}/${ctaStage.stageKey}`}
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90"
            style={{ background: CTA_BUTTON }}
          >
            {ctaStage.label} 시작하기
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
