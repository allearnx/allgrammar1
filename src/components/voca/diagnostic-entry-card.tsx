import Link from 'next/link';
import { VOCA_COLORS } from '@/lib/voca/brand-tokens';
import { formatLevel, type BandKey, type FinalLevel } from '@/lib/voca/diagnostic-bands';

interface Props {
  latest: {
    final_band: string;
    final_qualifier: string;
    coverage_score: number;
    created_at: string;
  } | null;
}

/** 보카 홈 상단 어휘 레벨 진단 진입 카드 (서버 컴포넌트) */
export function DiagnosticEntryCard({ latest }: Props) {
  return (
    <Link
      href="/student/voca/diagnostic"
      className="mb-4 flex items-center justify-between gap-3 rounded-2xl border-2 border-transparent p-4 transition-all hover:-translate-y-0.5 hover:shadow-md md:px-5"
      style={{ background: VOCA_COLORS.sky }}
    >
      <div className="min-w-0">
        <p className="font-bold" style={{ color: VOCA_COLORS.ink }}>
          {latest ? '어휘 레벨 진단' : '내 어휘 레벨 확인하기'}
        </p>
        <p className="mt-0.5 truncate text-sm" style={{ color: VOCA_COLORS.gray }}>
          {latest
            ? `레벨 ${formatLevel({ band: latest.final_band as BandKey, qualifier: latest.final_qualifier as FinalLevel['qualifier'] })} · 커버리지 ${latest.coverage_score}% (${new Date(latest.created_at).toLocaleDateString('ko-KR')})`
            : '5분 진단으로 나에게 맞는 단어장을 찾아보세요'}
        </p>
      </div>
      <span
        className="shrink-0 rounded-full px-4 py-2 text-sm font-bold text-white"
        style={{ background: VOCA_COLORS.blue }}
      >
        {latest ? '다시 측정' : '진단 시작'}
      </span>
    </Link>
  );
}
