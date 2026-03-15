import { requireRole } from '@/lib/auth/helpers';
import { createClient } from '@/lib/supabase/server';
import { Topbar } from '@/components/layout/topbar';
import { BookMarked, Lock, BookA, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { VocaDashboard } from '@/components/dashboard/voca-dashboard';
import { NaesinDashboard } from '@/components/dashboard/naesin-dashboard';
import { CombinedDashboard } from '@/components/dashboard/combined-dashboard';
import { getPlanContext } from '@/lib/billing/get-plan-context';
import { mergeEnabledStages } from '@/lib/billing/feature-gate';
import { fetchVocaDashboardData } from '@/lib/dashboard/fetch-voca-data';
import { fetchNaesinDashboardData } from '@/lib/dashboard/fetch-naesin-data';
import type { VocaBook } from '@/types/voca';

export default async function StudentDashboard() {
  const user = await requireRole(['student']);
  const supabase = await createClient();

  // Check service assignments
  const { data: assignments } = await supabase
    .from('service_assignments')
    .select('service')
    .eq('student_id', user.id);

  const services = assignments?.map((a) => a.service) || [];
  const vocaOnly = services.length === 1 && services[0] === 'voca';
  const naesinOnly = services.length === 1 && services[0] === 'naesin';
  const hasBoth = services.includes('voca') && services.includes('naesin');

  const planContext = await getPlanContext(user.academy_id);

  // ── Voca-only dashboard ──
  if (vocaOnly) {
    const data = await fetchVocaDashboardData(supabase, user.id);
    return (
      <>
        <Topbar user={user} title="올킬보카" />
        <VocaDashboard
          userName={user.full_name}
          books={(data.books as VocaBook[]) || []}
          days={data.days}
          progressList={data.progressList}
          wordCount={data.wordCount}
          wrongWordCounts={data.wrongWordCounts}
          quizHistory={data.quizHistory}
        />
      </>
    );
  }

  // ── Naesin-only dashboard ──
  if (naesinOnly) {
    const { data: settings } = await supabase
      .from('naesin_student_settings')
      .select('textbook_id, enabled_stages')
      .eq('student_id', user.id)
      .single();

    const effectiveEnabledStages = mergeEnabledStages(
      planContext.tier,
      settings?.enabled_stages as string[] | null,
    );

    const textbookId = settings?.textbook_id;

    if (textbookId) {
      const data = await fetchNaesinDashboardData(supabase, user.id, textbookId);
      return (
        <>
          <Topbar user={user} title="내신 대비" />
          <NaesinDashboard
            userName={user.full_name}
            textbookName={data.textbookName}
            units={data.units}
            progressList={data.progressList}
            examAssignments={data.examAssignments}
            contentMap={data.contentMap}
            vocabQuizSetCounts={data.vocabQuizSetCounts}
            grammarVideoCounts={data.grammarVideoCounts}
            enabledStages={effectiveEnabledStages}
            quizHistory={data.quizHistory}
          />
        </>
      );
    }

    // naesin 배정되었지만 교과서 미선택
    return (
      <>
        <Topbar user={user} title="내신 대비" />
        <div className="p-4 md:p-6 space-y-6">
          <div
            className="relative overflow-hidden rounded-2xl p-6 md:p-8 text-white"
            style={{ background: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)' }}
          >
            <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} />
            <h2 className="relative text-xl md:text-2xl font-bold">
              환영합니다, {user.full_name}님!
            </h2>
            <p className="relative mt-1 text-white/80">올인내신이 배정되었어요</p>
          </div>

          <div
            className="rounded-2xl p-6"
            style={{ background: 'linear-gradient(120deg, #ECFEFF, #CFFAFE)' }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-cyan-500" />
              <h3 className="text-lg font-bold">시작하기</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center bg-cyan-500 text-white rounded-full w-7 h-7 text-sm font-bold shrink-0">1</span>
                <BookMarked className="h-5 w-5 text-cyan-400 shrink-0" />
                <span className="text-sm text-gray-700">교과서를 선택하면 학습을 시작할 수 있어요</span>
                <Link href="/student/naesin" className="ml-auto bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg px-4 py-1.5 text-xs font-medium shrink-0 transition-colors">교과서 선택</Link>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── Combined (voca + naesin) dashboard ──
  if (hasBoth) {
    const { data: naesinSettings } = await supabase
      .from('naesin_student_settings')
      .select('textbook_id, enabled_stages')
      .eq('student_id', user.id)
      .single();

    const textbookId = naesinSettings?.textbook_id;

    const [vocaData, naesinData] = await Promise.all([
      fetchVocaDashboardData(supabase, user.id),
      textbookId
        ? fetchNaesinDashboardData(supabase, user.id, textbookId)
        : Promise.resolve({
            textbookName: '교과서',
            units: [],
            progressList: [],
            examAssignments: [],
            contentMap: {},
            vocabQuizSetCounts: {},
            grammarVideoCounts: {},
            quizHistory: [],
          }),
    ]);

    return (
      <>
        <Topbar user={user} title="학습 대시보드" />
        <CombinedDashboard
          userName={user.full_name}
          vocaDays={vocaData.days}
          vocaProgressList={vocaData.progressList}
          textbookName={naesinData.textbookName}
          naesinUnits={naesinData.units}
          naesinProgressList={naesinData.progressList}
          examAssignments={naesinData.examAssignments}
          contentMap={naesinData.contentMap}
          vocabQuizSetCounts={naesinData.vocabQuizSetCounts}
          grammarVideoCounts={naesinData.grammarVideoCounts}
          enabledStages={mergeEnabledStages(
            planContext.tier,
            naesinSettings?.enabled_stages as string[] | null,
          )}
          wrongWordCounts={vocaData.wrongWordCounts}
          vocaQuizHistory={vocaData.quizHistory}
          naesinQuizHistory={naesinData.quizHistory}
        />
      </>
    );
  }

  // ── No services assigned: premium waiting screen ──
  return (
    <>
      <Topbar user={user} title="대시보드" />
      <div className="relative min-h-[calc(100vh-56px)] overflow-hidden bg-gradient-to-b from-slate-50 to-white">
        {/* Blurred background: rich fake dashboard preview */}
        <div className="pointer-events-none select-none blur-[6px] opacity-50 saturate-[1.2]">
          <div className="p-4 md:p-6 space-y-5">
            {/* Banner - matching project's premium header pattern */}
            <div className="relative overflow-hidden rounded-2xl p-6 md:p-8 text-white" style={{ background: 'linear-gradient(135deg, #A78BFA 0%, #7C3AED 50%, #6D28D9 100%)' }}>
              <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} />
              <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} />
              <div className="absolute top-4 right-20 h-16 w-16 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }} />
              <h2 className="text-xl font-bold">안녕하세요, {user.full_name}님!</h2>
              <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>오늘도 열심히 공부해봐요</p>
              <div className="mt-3 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold" style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}>
                Day 12 진행중
              </div>
            </div>

            {/* Stat cards - matching project's border-l-4 pattern */}
            <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
              {[
                { label: '평균 점수', value: '85점', color: '#7C3AED', bg: '#F5F3FF' },
                { label: '학습 진도', value: '12/20 Day', color: '#06B6D4', bg: '#ECFEFF' },
                { label: '연속 학습', value: '5일', color: '#F59E0B', bg: '#FFFBEB' },
                { label: '완료 단어', value: '240개', color: '#22C55E', bg: '#F0FDF4' },
                { label: '퀴즈 통과', value: '8회', color: '#F43F5E', bg: '#FFF1F2' },
                { label: '틀린 단어', value: '15개', color: '#F97316', bg: '#FFF7ED' },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl bg-white p-4" style={{ borderLeft: `4px solid ${stat.color}`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                  <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400">{stat.label}</span>
                  <p className="mt-0.5 text-lg font-bold text-gray-900">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Tab bar */}
            <div className="flex gap-2">
              <div className="rounded-full px-4 py-1.5 text-sm font-semibold text-violet-700" style={{ background: '#EDE9FE' }}>올킬보카</div>
              <div className="rounded-full bg-gray-100 px-4 py-1.5 text-sm font-medium text-gray-400">내신대비</div>
            </div>

            {/* Chart placeholder - faux mini chart */}
            <div className="rounded-xl bg-white p-5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <p className="text-sm font-semibold text-gray-700 mb-4">점수 추이</p>
              <div className="flex items-end gap-1.5 h-24">
                {[45, 60, 55, 70, 65, 80, 75, 85, 90, 88, 92, 95].map((h, i) => (
                  <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, background: `linear-gradient(to top, #A78BFA, #C4B5FD)`, opacity: 0.7 + (i * 0.025) }} />
                ))}
              </div>
            </div>

            {/* Flow steps - matching project pattern */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { step: '플래시카드', emoji: '📖' },
                { step: '퀴즈', emoji: '✏️' },
                { step: '스펠링', emoji: '🔤' },
                { step: '매칭', emoji: '🎯' },
              ].map((item, i) => (
                <div key={item.step} className="rounded-xl bg-white p-3 text-center" style={{ border: i === 0 ? '1.5px solid #4DD9C0' : '1px solid #E5E7EB', boxShadow: i === 0 ? '0 4px 12px rgba(37,99,235,0.08)' : 'none' }}>
                  <span className="text-lg">{item.emoji}</span>
                  <p className="mt-1 text-xs font-medium text-gray-600">{item.step}</p>
                </div>
              ))}
            </div>

            {/* Bottom cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl bg-white p-5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <p className="text-sm font-semibold text-gray-700 mb-3">틀린 단어 TOP 5</p>
                <div className="space-y-2">
                  {['vocabulary', 'grammar', 'pronunciation', 'comprehension', 'sentence'].map((word, i) => (
                    <div key={word} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: '#FAFAFA' }}>
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ background: i < 3 ? '#F43F5E' : '#D1D5DB' }}>{i + 1}</span>
                        <span className="text-sm text-gray-600">{word}</span>
                      </div>
                      <span className="text-xs font-medium" style={{ color: '#F43F5E' }}>{5 - i}회</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl bg-white p-5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <p className="text-sm font-semibold text-gray-700 mb-3">Day별 진행률</p>
                <div className="space-y-2.5">
                  {[
                    { day: 1, pct: 100, color: '#56C9A0' },
                    { day: 2, pct: 85, color: '#56C9A0' },
                    { day: 3, pct: 60, color: '#7C3AED' },
                    { day: 4, pct: 30, color: '#C4B5FD' },
                    { day: 5, pct: 0, color: '#E5E7EB' },
                  ].map(({ day, pct, color }) => (
                    <div key={day} className="flex items-center gap-3">
                      <span className="text-xs font-medium text-gray-500 w-12">Day {day}</span>
                      <div className="flex-1 h-2.5 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: `linear-gradient(to right, ${color}, ${color}dd)` }} />
                      </div>
                      <span className="text-[10px] font-medium text-gray-400 w-8 text-right">{pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Overlay gradient mesh for depth */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 30% 20%, rgba(167,139,250,0.06) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(6,182,212,0.04) 0%, transparent 50%)' }} />

        {/* Lock overlay - glassmorphism card */}
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0.3) 100%)', backdropFilter: 'blur(2px)' }}>
          <div
            className="relative max-w-[420px] w-[92%] text-center"
            style={{ animation: 'waitingFadeUp 0.6s ease-out both, waitingGlow 4s ease-in-out infinite 0.6s' }}
          >
            {/* Gradient border wrapper */}
            <div className="rounded-[20px] p-[1.5px]" style={{ background: 'linear-gradient(135deg, #A78BFA 0%, #7C3AED 30%, #06B6D4 70%, #4DD9C0 100%)' }}>
              <div className="rounded-[19px] bg-white/95 backdrop-blur-xl p-8">

                {/* Animated lock icon with pulse ring */}
                <div className="relative mx-auto mb-5 h-16 w-16">
                  <div className="absolute inset-0 rounded-full" style={{ background: 'linear-gradient(135deg, #EDE9FE, #F5F3FF)', animation: 'waitingPulseRing 3s ease-in-out infinite' }} />
                  <div
                    className="relative flex h-16 w-16 items-center justify-center rounded-full"
                    style={{ background: 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)', animation: 'waitingFloat 3s ease-in-out infinite' }}
                  >
                    <Lock className="h-7 w-7 text-violet-500" />
                  </div>
                </div>

                <h3 className="text-xl font-bold text-gray-900">
                  환영합니다, {user.full_name}님!
                </h3>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                  학원에서 과목을 배정하면<br />학습을 시작할 수 있어요
                </p>

                {/* Service cards with shimmer */}
                <div className="mt-7 grid grid-cols-2 gap-3">
                  {/* 올킬보카 */}
                  <div className="group relative overflow-hidden rounded-xl p-4" style={{ border: '1.5px solid #E5E7EB', background: 'linear-gradient(135deg, #FAFAFA 0%, #F5F3FF 100%)' }}>
                    <div className="absolute inset-0 opacity-30" style={{ background: 'linear-gradient(90deg, transparent 30%, rgba(167,139,250,0.15) 50%, transparent 70%)', backgroundSize: '200% 100%', animation: 'waitingShimmer 3s ease-in-out infinite' }} />
                    <div className="relative">
                      <div className="mx-auto mb-2.5 flex h-11 w-11 items-center justify-center rounded-full" style={{ background: 'linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%)' }}>
                        <BookA className="h-5 w-5 text-violet-500" />
                      </div>
                      <p className="text-sm font-semibold text-gray-700">올킬보카</p>
                      <div className="mt-1.5 mx-auto flex h-5 w-5 items-center justify-center rounded-full bg-gray-100">
                        <Lock className="h-3 w-3 text-gray-400" />
                      </div>
                    </div>
                  </div>
                  {/* 올인내신 */}
                  <div className="group relative overflow-hidden rounded-xl p-4" style={{ border: '1.5px solid #E5E7EB', background: 'linear-gradient(135deg, #FAFAFA 0%, #ECFEFF 100%)' }}>
                    <div className="absolute inset-0 opacity-30" style={{ background: 'linear-gradient(90deg, transparent 30%, rgba(6,182,212,0.15) 50%, transparent 70%)', backgroundSize: '200% 100%', animation: 'waitingShimmer 3s ease-in-out infinite 0.5s' }} />
                    <div className="relative">
                      <div className="mx-auto mb-2.5 flex h-11 w-11 items-center justify-center rounded-full" style={{ background: 'linear-gradient(135deg, #CFFAFE 0%, #A5F3FC 100%)' }}>
                        <BookMarked className="h-5 w-5 text-cyan-600" />
                      </div>
                      <p className="text-sm font-semibold text-gray-700">올인내신</p>
                      <div className="mt-1.5 mx-auto flex h-5 w-5 items-center justify-center rounded-full bg-gray-100">
                        <Lock className="h-3 w-3 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom hint */}
                <div className="mt-6 flex items-center justify-center gap-1.5">
                  <div className="h-1 w-1 rounded-full bg-gray-300" />
                  <p className="text-xs text-gray-400 font-medium">
                    선생님에게 과목 배정을 요청하세요
                  </p>
                  <div className="h-1 w-1 rounded-full bg-gray-300" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
