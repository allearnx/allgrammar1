import { createAdminClient } from '@/lib/supabase/admin';
import { NaesinProgressCard } from '@/components/dashboard/naesin-progress-card';
import { VocaProgressCard } from '@/components/dashboard/voca-progress-card';
import { ParentProgressTabs } from '@/components/dashboard/parent-progress-tabs';
import { fetchNaesinExamData } from '@/lib/naesin/fetch-exam-data';
import { fetchNaesinProgress } from '@/lib/naesin/fetch-naesin-progress';
import { fetchVocaProgress } from '@/lib/voca/fetch-voca-progress';
import { Lock, BookA, CheckCircle, Clock, MinusCircle } from 'lucide-react';

interface Props {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ voca_day?: string }>;
}

export default async function ParentReportPage({ params, searchParams }: Props) {
  const { token } = await params;
  const { voca_day: vocaDayId } = await searchParams;
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

  // ── Voca Day-specific view (shared link with ?voca_day=xxx) ──
  if (vocaDayId) {
    const [{ data: dayRow }, { data: progress }] = await Promise.all([
      admin
        .from('voca_days')
        .select('id, day_number, title, book:voca_books(title)')
        .eq('id', vocaDayId)
        .single(),
      admin
        .from('voca_student_progress')
        .select('flashcard_completed, quiz_score, spelling_score, matching_score, matching_completed, updated_at')
        .eq('student_id', studentId)
        .eq('day_id', vocaDayId)
        .maybeSingle(),
    ]);

    if (dayRow) {
      const bookArr = dayRow.book as unknown as { title: string }[] | null;
      const bookTitle = bookArr?.[0]?.title ?? '';
      const p = progress;
      const isCompleted = p?.flashcard_completed && p?.quiz_score != null && p?.spelling_score != null && p?.matching_completed;
      const isStarted = !!p;

      return (
        <div className="min-h-screen bg-gray-50">
          <header className="relative overflow-hidden bg-gradient-to-r from-violet-400 to-purple-500 px-4 py-5">
            <div className="max-w-4xl mx-auto flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
                <span className="text-white font-bold text-sm">OL</span>
              </div>
              <span className="font-bold text-white">올라영 AI 러닝 엔진</span>
            </div>
          </header>
          <main className="max-w-md mx-auto p-4 md:p-6 space-y-4">
            <div className="rounded-xl bg-white border shadow-sm p-5">
              <h1 className="text-xl font-bold text-gray-800">
                {student?.full_name || '학생'} 보카 학습 결과
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {bookTitle} · Day {dayRow.day_number} — {dayRow.title}
              </p>
            </div>
            <div className="rounded-xl bg-white border shadow-sm p-5 space-y-4">
              <div className="flex items-center gap-2">
                <BookA className="h-5 w-5 text-violet-500" />
                <span className="font-semibold text-gray-800">학습 현황</span>
                {isCompleted ? (
                  <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                    <CheckCircle className="h-3 w-3" /> 완료
                  </span>
                ) : isStarted ? (
                  <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                    <Clock className="h-3 w-3" /> 진행중
                  </span>
                ) : (
                  <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
                    <MinusCircle className="h-3 w-3" /> 미시작
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <ScoreItem label="플래시카드" value={p?.flashcard_completed ? '완료' : '미완료'} done={!!p?.flashcard_completed} />
                <ScoreItem label="스펠링" value={p?.spelling_score != null ? `${p.spelling_score}점` : '—'} done={p?.spelling_score != null} />
                <ScoreItem label="매칭" value={p?.matching_score != null ? `${p.matching_score}점` : '—'} done={!!p?.matching_completed} />
                <ScoreItem label="퀴즈" value={p?.quiz_score != null ? `${p.quiz_score}점` : '—'} done={p?.quiz_score != null} />
              </div>
              {p?.updated_at && (
                <p className="text-xs text-gray-400 text-right">
                  마지막 학습: {new Date(p.updated_at).toLocaleDateString('ko-KR')}
                </p>
              )}
            </div>
          </main>
          <footer className="text-center py-8 text-xs text-gray-300">
            Powered by 올라영 AI 러닝 엔진 &middot; &copy; 2026
          </footer>
        </div>
      );
    }
    // Invalid dayId → fall through to full report
  }

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

function ScoreItem({ label, value, done }: { label: string; value: string; done: boolean }) {
  return (
    <div className={`rounded-lg border p-3 ${done ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-lg font-bold ${done ? 'text-green-700' : 'text-gray-400'}`}>{value}</p>
    </div>
  );
}
