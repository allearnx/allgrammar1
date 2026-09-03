import { VocaBrandStyle } from '@/components/voca/voca-brand';
import { VOCA_COLORS } from '@/lib/voca/brand-tokens';
import {
  DIAGNOSTIC_GRADES,
  formatLevel,
  levelGapFromGrade,
  getBand,
  recommendBandKey,
  type BandKey,
  type DiagnosticGrade,
  type FinalLevel,
} from '@/lib/voca/diagnostic-bands';
import { LINEUP_ACCENTS, resolveLineupPlacement } from '@/lib/voca/diagnostic-lineup';

export interface DiagnosticCardResult {
  grade: string;
  start_band: string;
  final_band: string;
  final_qualifier: string;
  coverage_score: number;
  /** 확정 밴드 정답률 — 추천 상향 컷(60%) 재현용. 없으면 컷 없이 동작 */
  final_band_score?: number;
  created_at: string;
}

/**
 * 어휘 레벨 진단 카드 (관리자·선생님 학생 상세) — 레벨 + 학년 격차 + 커버리지 + 이전 대비 개선폭.
 * 내부 실무용이라 레벨 표시는 유지하고, 그 아래 "지금 시작할 교재"를 학생 결과 화면과
 * 같은 규칙(상향 컷 포함)으로 덧붙인다 (2026-09-03 사장님: 레벨만 보이고 교재가 안 보인다).
 * results는 최신순 정렬을 기대 (results[0]=최근, results[1]=직전).
 */
export function VocaDiagnosticCard({
  results,
  activeBands = [],
  lineupBookIds = {},
}: {
  results: DiagnosticCardResult[];
  activeBands?: BandKey[];
  lineupBookIds?: Record<string, string>;
}) {
  const latest = results[0];
  if (!latest) return null;

  const grade = latest.grade as DiagnosticGrade;
  const gradeInfo = DIAGNOSTIC_GRADES.find((g) => g.key === grade);
  const level: FinalLevel = {
    band: latest.final_band as BandKey,
    qualifier: latest.final_qualifier as FinalLevel['qualifier'],
  };
  // 추천 교재 — 활성 밴드를 모르면(구 호출부) 판정 밴드 그대로, 알면 상향 컷까지 적용
  const recBand = activeBands.length ? recommendBandKey(level, activeBands, latest.final_band_score) : level.band;
  const placement = resolveLineupPlacement(recBand, lineupBookIds);
  const accent = LINEUP_ACCENTS[placement.columnKey];
  const gap = gradeInfo ? levelGapFromGrade(grade, level) : 0;
  const gapText = gap === 0 ? '학년 수준' : gap > 0 ? `학년보다 ${gap}단계 위` : `학년보다 ${-gap}단계 아래`;
  const gapColor = gap >= 0 ? VOCA_COLORS.greenDark : VOCA_COLORS.red;
  // 커버리지는 응시 당시 시작 밴드에서 측정됨 → 라벨도 저장된 start_band 기준
  const sourceLabel = getBand(latest.start_band as BandKey)?.sourceLabel ?? '학년';

  const prev = results[1];
  const delta = prev ? latest.coverage_score - prev.coverage_score : null;

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
      <div className="mt-3 flex items-center gap-4">
        <div className="min-w-0 flex-1 rounded-lg p-3 text-center" style={{ background: VOCA_COLORS.blueLight }}>
          <p className="text-[11px] text-gray-500">어휘 레벨</p>
          <p className="voca-display text-2xl" style={{ color: VOCA_COLORS.blue, fontWeight: 700 }}>
            {formatLevel(level)}
          </p>
          {gradeInfo && (
            <p className="mt-0.5 text-[11px] font-bold" style={{ color: gapColor }}>
              {gradeInfo.label} 기준 · {gapText}
            </p>
          )}
          {/* 학생 결과 화면의 "지금 시작할 교재"와 같은 값 — 상향 컷(확정 밴드 60%↑)까지 반영 */}
          <div className="mt-2 border-t border-white/70 pt-2">
            <p className="text-[11px] text-gray-500">지금 시작할 교재</p>
            <p className="text-sm font-bold leading-snug" style={{ color: accent.deep, wordBreak: 'keep-all' }}>
              {placement.highlightTitle}
            </p>
          </div>
        </div>
        <div className="min-w-0 flex-1 rounded-lg bg-gray-50 p-3 text-center">
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
        </div>
      </div>
    </div>
  );
}
