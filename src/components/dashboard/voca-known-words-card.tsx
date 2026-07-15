import { VocaBrandStyle } from '@/components/voca/voca-brand';
import { VOCA_COLORS } from '@/lib/voca/brand-tokens';

/**
 * 누적 암기 단어 카드 — "지금까지 외운 단어 N개" (학부모 리포트).
 * 교재가 여러 권이어도 하나로 합쳐지는 대표 숫자. 시험 히어로 아래 슬림 밴드.
 */
export function VocaKnownWordsCard({ knownWords, weeklyNew }: { knownWords: number; weeklyNew: number }) {
  if (knownWords === 0) return null;

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border bg-white px-5 py-4 shadow-sm">
      <VocaBrandStyle />
      <div className="min-w-0">
        <p className="voca-display text-sm text-gray-800" style={{ fontWeight: 700 }}>
          📚 지금까지 외운 단어
        </p>
        <p className="mt-0.5 text-[11px] text-gray-400">모든 교재 합산 · 오답 정복 시 실시간 반영</p>
      </div>
      <div className="flex shrink-0 items-baseline gap-2">
        <p className="voca-display text-3xl tabular-nums" style={{ color: VOCA_COLORS.blue, fontWeight: 700 }}>
          {knownWords.toLocaleString()}<span className="text-lg">개</span>
        </p>
        {weeklyNew > 0 && (
          <span className="rounded-full px-2 py-0.5 text-xs font-bold" style={{ background: VOCA_COLORS.greenLight, color: VOCA_COLORS.greenDark }}>
            +{weeklyNew} 이번 주
          </span>
        )}
      </div>
    </div>
  );
}
