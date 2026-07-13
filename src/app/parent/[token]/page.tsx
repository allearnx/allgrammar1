import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';
import { ALLKILL_OG, ALLKILL_SLOGAN, OLLAYOUNG_OG } from '@/lib/og-cards';
import { NaesinProgressCard } from '@/components/dashboard/naesin-progress-card';
import { VocaProgressCard } from '@/components/dashboard/voca-progress-card';
import { VocaExamReportCard } from '@/components/dashboard/voca-exam-report-card';
import { ParentProgressTabs } from '@/components/dashboard/parent-progress-tabs';
import { fetchVocaExamGroups } from '@/lib/voca/fetch-exam-results';
import { fetchNaesinExamData } from '@/lib/naesin/fetch-exam-data';
import { fetchNaesinProgress } from '@/lib/naesin/fetch-naesin-progress';
import { fetchVocaProgress } from '@/lib/voca/fetch-voca-progress';
import { ParentWeeklySummary } from '@/components/dashboard/parent-weekly-summary';
import { Lock, BookA, CheckCircle, Clock, MinusCircle, History } from 'lucide-react';

interface Props {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ voca_day?: string; tab?: string }>;
}


export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { token } = await params;
  const { voca_day: vocaDayId, tab } = await searchParams;
  const admin = createAdminClient();

  const { data: tokenRow } = await admin
    .from('parent_share_tokens')
    .select('student_id')
    .eq('token', token)
    .eq('is_active', true)
    .single();

  if (!tokenRow) return { title: '올라영 학습 리포트' };

  const { data: student } = await admin
    .from('users')
    .select('full_name')
    .eq('id', tokenRow.student_id)
    .single();

  const name = student?.full_name ?? '학생';

  if (vocaDayId) {
    const { data: dayRow } = await admin
      .from('voca_days')
      .select('day_number, title, book:voca_books(title)')
      .eq('id', vocaDayId)
      .single();

    if (dayRow) {
      const bookArr = dayRow.book as unknown as { title: string }[] | null;
      const bookTitle = bookArr?.[0]?.title ?? '올킬보카';
      const title = `${name} 올킬보카 성적표`;
      const description = `${ALLKILL_SLOGAN} · ${bookTitle} Day ${dayRow.day_number} — ${dayRow.title}`;
      return {
        title,
        description,
        openGraph: { title, description, images: [ALLKILL_OG] },
      };
    }
  }

  if (tab === 'voca') {
    const title = `${name} 올킬보카 성적표`;
    const description = `${ALLKILL_SLOGAN} · 올킬보카 학습 현황 및 점수`;
    return {
      title,
      description,
      openGraph: { title, description, images: [ALLKILL_OG] },
    };
  }

  const title = `${name} 학습 리포트`;
  const description = '올라영 AI 러닝 엔진 학습 현황';
  return {
    title,
    description,
    openGraph: { title, description, images: [OLLAYOUNG_OG] },
  };
}

export default async function ParentReportPage({ params, searchParams }: Props) {
  const { token } = await params;
  const { voca_day: vocaDayId, tab } = await searchParams;
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
    const [{ data: dayRow }, { data: progress }, { data: attemptLogs }] = await Promise.all([
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
      admin
        .from('voca_attempt_log')
        .select('step, score, created_at')
        .eq('student_id', studentId)
        .eq('day_id', vocaDayId)
        .order('created_at', { ascending: true }),
    ]);

    if (dayRow) {
      const bookArr = dayRow.book as unknown as { title: string }[] | null;
      const bookTitle = bookArr?.[0]?.title ?? '';
      const p = progress;
      const isCompleted = p?.flashcard_completed && p?.quiz_score != null && p?.spelling_score != null && p?.matching_completed;
      const isStarted = !!p;

      return (
        <div className="min-h-screen bg-gray-50">
          <header className="relative overflow-hidden bg-gradient-to-r from-brand-400 to-brand-500 px-4 py-5">
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
                <BookA className="h-5 w-5 text-brand-500" />
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
            {/* ── Attempt History Timeline ── */}
            {attemptLogs && attemptLogs.length > 0 && (
              <AttemptTimeline logs={attemptLogs} />
            )}
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

  // 보카 시험 결과 (오늘 본 게 맨 위) — 학부모 리포트에 노출
  const vocaExam = hasVoca ? await fetchVocaExamGroups(admin, [studentId]) : { groups: [], dayTitles: {} };
  const vocaExamExams = vocaExam.groups[0]?.exams ?? [];

  const vocaCard = hasVoca ? (
    <div className="space-y-4">
      <VocaExamReportCard exams={vocaExamExams} dayTitles={vocaExam.dayTitles} />
      <VocaProgressCard vocaProgress={vocaProgress} submissionStatuses={vocaSubmissionStatuses} />
    </div>
  ) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Purple Hero Banner ── */}
      <header className="relative overflow-hidden bg-gradient-to-r from-brand-400 to-brand-500 px-4 py-5">
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
          <p className="text-sm text-gray-500 mt-1">실시간 학습 현황 — 열 때마다 최신 내용으로 갱신돼요</p>
        </div>

        {/* 이번 주 요약 — 엄마가 매주 열 이유 */}
        <ParentWeeklySummary studentId={studentId} />

        {/* Progress tabs: 올인내신 / 올킬보카 */}
        {(hasNaesin || hasVoca) && (
          <ParentProgressTabs
            hasNaesin={hasNaesin}
            hasVoca={hasVoca}
            naesinCard={naesinCard}
            vocaCard={vocaCard}
            defaultTab={tab === 'voca' ? 'voca' : undefined}
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

const STEP_LABEL: Record<string, string> = {
  flashcard: '플래시카드',
  quiz: '퀴즈',
  spelling: '스펠링',
  matching: '매칭',
};

/** Group attempt logs into sessions by 30-min gap */
function AttemptTimeline({ logs }: { logs: { step: string; score: number | null; created_at: string }[] }) {
  const GAP_MS = 30 * 60 * 1000; // 30 minutes
  const sessions: { logs: typeof logs; startTime: string }[] = [];

  for (const log of logs) {
    const last = sessions[sessions.length - 1];
    if (last) {
      const lastTime = new Date(last.logs[last.logs.length - 1].created_at).getTime();
      const curTime = new Date(log.created_at).getTime();
      if (curTime - lastTime < GAP_MS) {
        last.logs.push(log);
        continue;
      }
    }
    sessions.push({ logs: [log], startTime: log.created_at });
  }

  return (
    <div className="rounded-xl bg-white border shadow-sm p-5 space-y-3">
      <div className="flex items-center gap-2">
        <History className="h-5 w-5 text-brand-500" />
        <span className="font-semibold text-gray-800">학습 이력</span>
        <span className="ml-auto text-xs text-gray-400">{sessions.length}회 시도</span>
      </div>
      <div className="space-y-3">
        {sessions.map((session, i) => {
          const dt = new Date(session.startTime);
          const dateStr = dt.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
          const timeStr = dt.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
          return (
            <div key={i} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">{i + 1}차 시도</span>
                <span className="text-xs text-gray-400">{dateStr} {timeStr}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {session.logs.map((log, j) => (
                  <span key={j} className="inline-flex items-center gap-1 rounded-full bg-white border px-2.5 py-1 text-xs">
                    <span className="text-gray-500">{STEP_LABEL[log.step] ?? log.step}</span>
                    <span className="font-semibold text-gray-700">
                      {log.step === 'flashcard' ? '완료' : log.score != null ? `${log.score}점` : '—'}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
