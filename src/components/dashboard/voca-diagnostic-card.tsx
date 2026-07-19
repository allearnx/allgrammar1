import { VocaBrandStyle } from '@/components/voca/voca-brand';
import { VOCA_COLORS } from '@/lib/voca/brand-tokens';
import {
  DIAGNOSTIC_GRADES,
  formatLevel,
  levelGapFromGrade,
  getBand,
  type BandKey,
  type DiagnosticGrade,
  type FinalLevel,
} from '@/lib/voca/diagnostic-bands';

export interface DiagnosticCardResult {
  grade: string;
  start_band: string;
  final_band: string;
  final_qualifier: string;
  coverage_score: number;
  created_at: string;
}

/**
 * 어휘 레벨 진단 카드 (학부모 리포트) — 레벨 + 학년 격차 + 커버리지 + 이전 대비 개선폭.
 * results는 최신순 정렬을 기대 (results[0]=최근, results[1]=직전).
 */
export function VocaDiagnosticCard({ results }: { results: DiagnosticCardResult[] }) {
  const latest = results[0];
  if (!latest) return null;

  const grade = latest.grade as DiagnosticGrade;
  const gradeInfo = DIAGNOSTIC_GRADES.find((g) => g.key === grade);
  const level: FinalLevel = {
    band: latest.final_band as BandKey,
    qualifier: latest.final_qualifier as FinalLevel['qualifier'],
  };
  const gap = gradeInfo ? levelGapFromGrade(grade, level) : 0;
  const gapText = gap === 0 ? '학년 수준' : gap > 0 ? `학년보다 ${gap}단계 위` : `학년보다 ${-gap}단계 아래`;
  const gapColor = gap >= 0 ? VOCA_COLORS.greenDark : VOCA_COLORS.red;
  // 커버리지는 응시 당시 시작 밴드에서 측정됨 → 라벨도 저장된 start_band 기준
  const sourceLabel = getBand(latest.start_band as BandKey)?.sourceLabel ?? '모의고사';

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
        </div>
        <div className="min-w-0 flex-1 rounded-lg bg-gray-50 p-3 text-center">
          <p className="text-[11px] text-gray-500">{sourceLabel} 단어 커버리지</p>
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
