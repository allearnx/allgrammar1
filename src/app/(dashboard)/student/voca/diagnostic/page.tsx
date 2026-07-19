import { requireRole } from '@/lib/auth/helpers';
import { createClient } from '@/lib/supabase/server';
import { Topbar } from '@/components/layout/topbar';
import { getPlanContext } from '@/lib/billing/get-plan-context';
import { getBandBooks } from '@/lib/voca/diagnostic-sampling';
import { BAND_KEYS } from '@/lib/voca/diagnostic-bands';
import { DiagnosticClient, type LatestDiagnostic } from './diagnostic-client';

interface StoredRound {
  items?: { vocabId: string }[];
}

export default async function VocaDiagnosticPage() {
  const user = await requireRole(['student']);
  const supabase = await createClient();

  const [bandBooks, planContext, { data: results }] = await Promise.all([
    getBandBooks(supabase),
    getPlanContext(user.academy_id, user.id),
    supabase
      .from('voca_diagnostic_results')
      .select('id, grade, final_band, final_qualifier, coverage_score, attempt_number, rounds, created_at')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  const activeBands = BAND_KEYS.filter((k) => bandBooks[k].length > 0);
  const latest = results?.[0];
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const tookToday = !!latest && new Date(latest.created_at) >= todayStart;

  // 재진단 시 이전에 출제된 단어 제외 (최근 5회분)
  const prevVocabIds = [
    ...new Set(
      (results ?? []).flatMap((r) =>
        ((r.rounds ?? []) as StoredRound[]).flatMap((round) => (round.items ?? []).map((it) => it.vocabId)),
      ),
    ),
  ];

  const latestForClient: LatestDiagnostic | null = latest
    ? {
        grade: latest.grade,
        finalBand: latest.final_band,
        finalQualifier: latest.final_qualifier,
        coverageScore: latest.coverage_score,
        attemptNumber: latest.attempt_number,
        createdAt: latest.created_at,
      }
    : null;

  return (
    <>
      <Topbar user={user} title="어휘 레벨 진단" />
      <div className="p-4 md:p-6">
        <DiagnosticClient
          activeBands={activeBands}
          bandBooks={bandBooks}
          latest={latestForClient}
          tookToday={tookToday}
          prevVocabIds={prevVocabIds}
          isFree={planContext.tier === 'free'}
        />
      </div>
    </>
  );
}
