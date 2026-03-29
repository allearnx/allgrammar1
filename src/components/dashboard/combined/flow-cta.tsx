import Link from 'next/link';
import { getCtaText } from '@/lib/dashboard/voca-helpers';
import type { VocaStage } from '@/lib/dashboard/voca-helpers';

export function FlowCta({ stage, dayId }: { stage: VocaStage; dayId: string }) {
  const cta = getCtaText(stage);
  return (
    <div className="flex items-center justify-between rounded-xl p-3.5 md:p-4" style={{ background: 'linear-gradient(120deg, #F5F3FF, #EDE9FE)', border: '1px solid rgba(37,99,235,0.08)' }}>
      <div className="mr-3 min-w-0">
        <div className="text-sm font-semibold" style={{ color: '#7C3AED' }}>{cta.title}</div>
        <div className="text-sm text-gray-500 mt-0.5 truncate">{cta.sub}</div>
      </div>
      <Link
        href={`/student/voca/${dayId}`}
        className="shrink-0 rounded-[10px] px-5 py-2.5 text-sm font-bold text-white whitespace-nowrap"
        style={{ background: '#7C3AED', boxShadow: '0 4px 12px rgba(37,99,235,0.15)' }}
      >
        {stage.label} 시작하기 →
      </Link>
    </div>
  );
}
