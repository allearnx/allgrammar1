import { VocaBrandStyle } from '@/components/voca/voca-brand';
import { VOCA_COLORS } from '@/lib/voca/brand-tokens';
import { getBand, recommendBandKey, type BandKey, type FinalLevel } from '@/lib/voca/diagnostic-bands';
import {
  DIAGNOSTIC_LINEUP,
  lineupColumnGap,
  resolveLineupPlacement,
} from '@/lib/voca/diagnostic-lineup';

export interface DiagnosticLineupResult {
  grade: string;
  start_band: string;
  final_band: string;
  final_qualifier: string;
  coverage_score: number;
  /** 확정 밴드 정답률 — 저장된 rounds에서 재계산 (추천 상향 컷 반영용) */
  final_band_score: number;
  created_at: string;
}

/**
 * 어휘 레벨 진단 카드 — 학부모 리포트용 라인업 프레임 (2026-08-06, 결과 개편 2단계).
 * "○○ 수준/레벨" 학년 주장 없이 "지금 시작할 교재"를 보여준다 — 학생 결과 화면(2026-07-25
 * 개편)과 같은 프레임. 학년 라벨은 칸 헤더로 교재를 설명할 뿐이다.
 * 관리자/선생님 화면은 기존 레벨 카드(voca-diagnostic-card.tsx)를 유지 (내부 실무용).
 * results는 최신순 정렬을 기대 (results[0]=최근, results[1]=직전).
 */
export function VocaDiagnosticLineupCard({
  results,
  activeBands,
  lineupBookIds,
}: {
  results: DiagnosticLineupResult[];
  activeBands: BandKey[];
  lineupBookIds: Record<string, string>;
}) {
  const latest = results[0];
  if (!latest) return null;

  const level: FinalLevel = {
    band: latest.final_band as BandKey,
    qualifier: latest.final_qualifier as FinalLevel['qualifier'],
  };
  const recBand = recommendBandKey(level, activeBands, latest.final_band_score);
  const placement = resolveLineupPlacement(recBand, lineupBookIds);
  const column = DIAGNOSTIC_LINEUP.find((c) => c.key === placement.columnKey);
  // 정답률은 응시 당시 시작 밴드에서 측정됨 → 라벨도 저장된 start_band 기준
  const sourceLabel = getBand(latest.start_band as BandKey)?.sourceLabel ?? '학년';

  const prev = results[1];
  const delta = prev ? latest.coverage_score - prev.coverage_score : null;
  // 재진단 칸 비교 — 올라간 경우만 언급 (출제 풀 조정으로도 내려갈 수 있어 하락은 무언급)
  const columnGap = prev
    ? lineupColumnGap(
        recommendBandKey(
          { band: prev.final_band as BandKey, qualifier: prev.final_qualifier as FinalLevel['qualifier'] },
          activeBands,
          prev.final_band_score,
        ),
        recBand,
      )
    : 0;

  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <VocaBrandStyle />
      <div className="flex items-center gap-2">
        <p className="voca-display text-sm text-gray-800" style={{ fontWeight: 700 }}>
          🎯 어휘 레벨 진단
        </p>
        <span className="ml-auto text-xs text-gray-400">
          {new Date(latest.created_at).toLocaleDateString('ko-KR')} 응시
        </span>
      </div>

      {/* 미니 라인업 — 칸 헤더(학년 라벨)로 시작 위치만 보여준다 */}
      <div className="mt-3 flex gap-1">
        {DIAGNOSTIC_LINEUP.map((c) => {
          const mine = c.key === placement.columnKey;
          return (
            <span
              key={c.key}
              className="flex-1 rounded-md py-1 text-center text-[11px] font-bold"
              style={
                mine
                  ? { background: VOCA_COLORS.blue, color: '#fff' }
                  : { background: '#F1F3F4', color: '#9AA0A6' }
              }
            >
              {c.gradeLabel}
            </span>
          );
        })}
      </div>

      <div className="mt-3 rounded-lg p-4 text-center" style={{ background: VOCA_COLORS.blueLight }}>
        <p className="text-[11px] text-gray-500">지금 시작할 교재{column ? ` · ${column.gradeLabel} 단계` : ''}</p>
        <p className="voca-display mt-1 text-lg leading-snug" style={{ color: VOCA_COLORS.blue, fontWeight: 700, wordBreak: 'keep-all' }}>
          {placement.highlightTitle}
        </p>
      </div>

      <div className="mt-3 rounded-lg bg-gray-50 p-3 text-center">
        <p className="text-[11px] text-gray-500">{sourceLabel} 단어 정답률</p>
        <p className="voca-display text-2xl tabular-nums" style={{ color: VOCA_COLORS.ink, fontWeight: 700 }}>
          {latest.coverage_score}%
        </p>
        {delta !== null && (
          <p
            className="mt-0.5 text-[11px] font-bold tabular-nums"
            style={{ color: delta >= 0 ? VOCA_COLORS.greenDark : VOCA_COLORS.red }}
          >
            지난 진단 대비 {delta >= 0 ? '+' : ''}{delta}%p
          </p>
        )}
        {columnGap > 0 && (
          <p className="mt-0.5 text-[11px] font-bold" style={{ color: VOCA_COLORS.greenDark }}>
            {columnGap === 1 ? '지난 진단보다 한 칸 올라갔어요 🎉' : `지난 진단보다 ${columnGap}칸 올라갔어요 🎉`}
          </p>
        )}
      </div>
    </div>
  );
}
