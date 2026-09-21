import Link from 'next/link';
import { BookMarked, BookA, ArrowRight } from 'lucide-react';
import type { QuickStart } from '@/lib/dashboard/quick-start';

/**
 * 학생 홈 맨 위 "바로 가기" 카드 — 사이드 메뉴 대신 여기서 올인내신·올킬보카로 진입.
 * 통계 카드보다 위에 두어 "홈 = 출발점"으로 읽히게 한다.
 */
export function QuickStartCards({ quickStart }: { quickStart: QuickStart }) {
  const items = [
    quickStart.naesin && {
      key: 'naesin', label: '올인내신', icon: BookMarked, entry: quickStart.naesin,
      bg: 'bg-[#E8F0FE] hover:bg-[#D2E3FC] border-[#1A73E8]/30', fg: 'text-[#174EA6]', iconBg: 'bg-[#1A73E8]',
    },
    quickStart.voca && {
      key: 'voca', label: '올킬보카', icon: BookA, entry: quickStart.voca,
      bg: 'bg-[#E6F4EA] hover:bg-[#CEEAD6] border-[#34A853]/30', fg: 'text-[#137333]', iconBg: 'bg-[#34A853]',
    },
  ].filter(Boolean) as { key: string; label: string; icon: typeof BookMarked; entry: NonNullable<QuickStart['naesin']>; bg: string; fg: string; iconBg: string }[];

  if (items.length === 0) return null;

  return (
    <div className={`grid gap-3 ${items.length > 1 ? 'sm:grid-cols-2' : ''}`}>
      {items.map(({ key, label, icon: Icon, entry, bg, fg, iconBg }) => (
        <Link
          key={key}
          href={entry.href}
          className={`group flex items-center gap-4 rounded-2xl border p-4 md:p-5 transition-colors ${bg}`}
        >
          <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white ${iconBg}`}>
            <Icon className="h-6 w-6" />
          </span>
          <span className="min-w-0 flex-1">
            <span className={`block text-xs font-bold tracking-wide ${fg}`}>{label} 하러 가기</span>
            <span className="block truncate text-base md:text-lg font-bold text-gray-900">{entry.headline}</span>
            {entry.sub && <span className="block truncate text-xs text-gray-600 mt-0.5">{entry.sub}</span>}
          </span>
          <ArrowRight className={`h-5 w-5 shrink-0 transition-transform group-hover:translate-x-0.5 ${fg}`} />
        </Link>
      ))}
    </div>
  );
}
