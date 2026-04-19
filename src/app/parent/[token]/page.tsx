import { createAdminClient } from '@/lib/supabase/admin';
import { NaesinProgressCard } from '@/components/dashboard/naesin-progress-card';
import { VocaProgressCard } from '@/components/dashboard/voca-progress-card';
import { ParentProgressTabs } from '@/components/dashboard/parent-progress-tabs';
import { fetchNaesinExamData } from '@/lib/naesin/fetch-exam-data';
import { fetchNaesinProgress } from '@/lib/naesin/fetch-naesin-progress';
import { fetchVocaProgress } from '@/lib/voca/fetch-voca-progress';
import { Lock } from 'lucide-react';

interface Props {
  params: Promise<{ token: string }>;
}

export default async function ParentReportPage({ params }: Props) {
  const { token } = await params;
  const admin = createAdminClient();

  // Validate token
  const { data: tokenRow } = await admin
    .from('parent_share_tokens')
    .select('student_id')
    .eq('token', token)
    .eq('is_active', true)
    .single();

  if (!tokenRow) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4 px-4">
          <Lock className="h-12 w-12 text-gray-400 mx-auto" />
          <h1 className="text-xl font-bold text-gray-800">링크가 만료되었습니다</h1>
          <p className="text-gray-500 text-sm max-w-sm">
            이 리포트 링크는 더 이상 유효하지 않습니다.<br />
            선생님에게 새 링크를 요청해주세요.
          </p>
        </div>
      </div>
    );
  }

  const studentId = tokenRow.student_id;

  // Fetch base data in parallel
  const [{ data: student }, { data: svcData }, naesinData] = await Promise.all([
    admin.from('users').select('full_name, academy_id').eq('id', studentId).single(),
    admin.from('service_assignments').select('service').eq('student_id', studentId),
    fetchNaesinExamData(studentId),
  ]);

  const services = (svcData || []).map((s) => s.service);
  const hasNaesin = !!naesinData && naesinData.units.length > 0;
  const hasVoca = services.includes('voca');

  // Fetch progress data in parallel via shared helpers
  const [naesinProgressData, vocaProgress, vocaSubRes] = await Promise.all([
    hasNaesin ? fetchNaesinProgress(studentId, naesinData!) : null,
    hasVoca ? fetchVocaProgress(studentId) : Promise.resolve([]),
    hasVoca
      ? admin.from('voca_matching_submissions').select('day_id, status').eq('student_id', studentId)
      : Promise.resolve({ data: null }),
  ]);
  const vocaSubmissionStatuses: Record<string, string> = {};
  for (const s of vocaSubRes.data || []) vocaSubmissionStatuses[s.day_id] = s.status;

  // Fetch academy naesinRequiredRounds
  let naesinRequiredRounds = 1;
  if (student?.academy_id) {
    const { data: academy } = await admin.from('academies').select('naesin_required_rounds').eq('id', student.academy_id).single();
    naesinRequiredRounds = academy?.naesin_required_rounds ?? 1;
  }

  // Build cards
  const naesinCard = hasNaesin && naesinProgressData ? (
    <NaesinProgressCard
      studentId={studentId}
      naesinData={naesinData!}
      naesinProgress={naesinProgressData.naesinProgress}
      hours={naesinProgressData.hours}
      minutes={naesinProgressData.minutes}
      enabledStages={['vocab', 'passage', 'dialogue', 'textbookVideo', 'grammar', 'problem', 'mockExam', 'lastReview']}
      passageStages={['fill_blanks', 'translation']}
      translationSentencesPerPage={10}
      fillBlanksByUnit={naesinProgressData.fillBlanksByUnit}
      problemSheetsByUnit={naesinProgressData.problemSheetsByUnit}
      problemAttemptsBySheet={naesinProgressData.problemAttemptsBySheet}
      grammarContentByUnit={naesinProgressData.grammarContentByUnit}
      naesinRequiredRounds={naesinRequiredRounds}
      hideSettings
    />
  ) : null;

  const vocaCard = hasVoca ? <VocaProgressCard vocaProgress={vocaProgress} submissionStatuses={vocaSubmissionStatuses} /> : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Purple Hero Banner ── */}
      <header className="relative overflow-hidden bg-gradient-to-r from-violet-400 to-purple-500 px-4 py-5">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
            <span className="text-white font-bold text-sm">OL</span>
          </div>
          <span className="font-bold text-white">올라영 AI 러닝 엔진</span>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto p-4 md:p-6 space-y-4">
        {/* Student info card */}
        <div className="rounded-xl bg-white border shadow-sm p-5">
          <h1 className="text-xl font-bold text-gray-800">
            {student?.full_name || '학생'} 학습 리포트
          </h1>
          <p className="text-sm text-gray-500 mt-1">실시간 학습 현황</p>
        </div>

        {/* Progress tabs: 올인내신 / 올킬보카 */}
        {(hasNaesin || hasVoca) && (
          <ParentProgressTabs
            hasNaesin={hasNaesin}
            hasVoca={hasVoca}
            naesinCard={naesinCard}
            vocaCard={vocaCard}
          />
        )}

      </main>

      {/* Watermark */}
      <footer className="text-center py-8 text-xs text-gray-300">
        Powered by 올라영 AI 러닝 엔진 &middot; &copy; 2026
      </footer>
    </div>
  );
}
