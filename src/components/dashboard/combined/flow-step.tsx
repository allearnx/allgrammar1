'use client';

import Link from 'next/link';

type StageStatus = 'done' | 'active' | 'locked';

interface Stage {
  key: string;
  label: string;
  status: StageStatus;
  emoji: string;
  description: string;
  scoreRequirement: string;
  actualScore?: string;
}

export function FlowStep({ stage, dayId, linkPrefix }: { stage: Stage; dayId: string; linkPrefix: string }) {
  const isDone = stage.status === 'done';
  const isActive = stage.status === 'active';
  const isLocked = stage.status === 'locked';

  const green = '#22C55E';

  const card = (
    <div
      className="relative text-center transition-all flex flex-col items-center h-full"
      style={{
        background: isDone ? '#D9F7FC' : isActive ? 'white' : '#D9F7FC',
        border: isDone ? '1.5px solid #4DD9C0' : isActive ? '2px solid #7C3AED' : '1.5px solid #CCFAF4',
        borderRadius: isActive ? 16 : 14,
        padding: isActive ? '28px 10px 24px' : '24px 8px 20px',
        boxShadow: isActive ? '0 8px 24px rgba(37,99,235,0.08)' : 'none',
        zIndex: isActive ? 1 : 0,
        wordBreak: 'keep-all' as const,
      }}
    >
      {/* Active label */}
      {isActive && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold tracking-wide text-white" style={{ background: '#7C3AED' }}>
          ▶ 지금 여기!
        </div>
      )}

      {/* Status icon — top right circle */}
      <div className="absolute -top-2 -right-2 flex h-[24px] w-[24px] items-center justify-center rounded-full border-2 border-white text-xs font-bold" style={{
        background: isDone ? green : isActive ? '#7C3AED' : '#E5E7EB',
        color: isDone || isActive ? 'white' : '#9CA3AF',
      }}>
        {isDone ? '✓' : isActive ? '▶' : '🔒'}
      </div>

      {/* Icon wrap */}
      <div className="mx-auto mb-3 flex items-center justify-center rounded-xl" style={{
        width: isActive ? 58 : 48,
        height: isActive ? 58 : 48,
        fontSize: isActive ? 30 : 24,
        background: isDone ? 'rgba(37,99,235,0.08)' : 'white',
      }}>
        {stage.emoji}
      </div>

      {/* Name */}
      <div className="font-bold leading-tight" style={{
        fontSize: isActive ? 17 : 14,
        color: isDone ? green : isActive ? '#7C3AED' : '#4B5563',
      }}>
        {stage.label}
      </div>

      {/* Description */}
      <div className="mt-2 leading-snug whitespace-pre-line" style={{
        fontSize: isActive ? 14 : 13,
        color: isActive ? '#6B7280' : '#9CA3AF',
      }}>
        {stage.description}
      </div>

      {/* Score badge */}
      <div className="mt-3 inline-block rounded-full font-bold" style={{
        fontSize: isActive ? 14 : 13,
        padding: isActive ? '4px 12px' : '3px 10px',
        background: isDone ? green : isActive ? '#7C3AED' : '#E5E7EB',
        color: isDone || isActive ? 'white' : '#9CA3AF',
      }}>
        {isDone ? (stage.actualScore || '완료') : stage.scoreRequirement}
      </div>
    </div>
  );

  if (!isLocked && dayId) {
    return <Link href={`${linkPrefix}${dayId}`} className="block" style={{ flex: isActive ? 1.35 : 1 }}>{card}</Link>;
  }
  return <div style={{ flex: isActive ? 1.35 : 1 }}>{card}</div>;
}
