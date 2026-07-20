'use client';

/**
 * 어휘 레벨 진단 — 학년 선택 → 스테어케이스 라운드(10문항) → 결과.
 * 문항별 정오는 진행 중 보여주지 않는다 (레벨테스트 관행 + 다음 라운드 힌트 방지).
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { track } from '@vercel/analytics';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import { VOCA_COLORS, VOCA_STEP_THEMES } from '@/lib/voca/brand-tokens';
import {
  DIAGNOSTIC_GRADES,
  getBand,
  getStartBand,
  nextStep,
  formatLevel,
  levelGapFromGrade,
  recommendBandKey,
  type BandKey,
  type DiagnosticGrade,
  type FinalLevel,
  type RoundSummary,
} from '@/lib/voca/diagnostic-bands';
import type { DiagnosticQuestion, BandBook } from '@/lib/voca/diagnostic-sampling';

export interface LatestDiagnostic {
  grade: string;
  finalBand: string;
  finalQualifier: string;
  coverageScore: number;
  attemptNumber: number;
  createdAt: string;
}

interface Props {
  activeBands: BandKey[];
  bandBooks: Record<BandKey, BandBook[]>;
  latest: LatestDiagnostic | null;
  tookToday: boolean;
  prevVocabIds: string[];
  isFree: boolean;
  /**
   * public: 비로그인 /level-test — 진단을 다 풀게 한 뒤 결과 직전에 가입 게이트 (value-first).
   * 완료 라운드는 localStorage에 담아 가입 후 student 모드가 자동 제출·결과 표시.
   */
  mode?: 'student' | 'public';
}

/** 비로그인 진단 완료분 — 가입 후 자동 제출용 (24시간 유효) */
const PENDING_KEY = 'allkill:pending-diagnostic';

interface PendingDiagnostic {
  grade: DiagnosticGrade;
  rounds: CompletedRound[];
  at: number;
}

interface AnsweredItem {
  vocabId: string;
  front_text: string;
  back_text: string;
  chosenVocabId: string | null;
}

interface CompletedRound {
  band: BandKey;
  items: AnsweredItem[];
}

interface SubmitResponse {
  id: string;
  attemptNumber: number;
  level: FinalLevel;
  coverageScore: number;
}

type Phase =
  | { step: 'intro' }
  | { step: 'loading'; band: BandKey; message: string }
  | { step: 'quiz'; band: BandKey; questions: DiagnosticQuestion[]; index: number }
  | { step: 'gate' } // public 모드: 다 풀었고, 결과는 가입 후
  | { step: 'result'; res: SubmitResponse };

function correctCount(items: AnsweredItem[]): number {
  return items.filter((it) => it.chosenVocabId === it.vocabId).length;
}

export function DiagnosticClient({ activeBands, bandBooks, latest, tookToday, prevVocabIds, isFree, mode = 'student' }: Props) {
  const [phase, setPhase] = useState<Phase>({ step: 'intro' });
  const [grade, setGrade] = useState<DiagnosticGrade | null>(null);
  const [completedRounds, setCompletedRounds] = useState<CompletedRound[]>([]);
  const [currentItems, setCurrentItems] = useState<AnsweredItem[]>([]);
  const [busy, setBusy] = useState(false);

  const seenIds = useMemo(
    () => [
      ...prevVocabIds,
      ...completedRounds.flatMap((r) => r.items.map((it) => it.vocabId)),
      ...currentItems.map((it) => it.vocabId),
    ],
    [prevVocabIds, completedRounds, currentItems],
  );

  const loadRound = useCallback(
    async (band: BandKey, exclude: string[], message: string) => {
      setPhase({ step: 'loading', band, message });
      try {
        const data = await fetchWithToast<{ questions: DiagnosticQuestion[] }>(
          mode === 'public' ? '/api/public/diagnostic/questions' : '/api/voca/diagnostic/questions',
          { body: { band, excludeIds: exclude.slice(0, 1000) }, retry: 2, errorMessage: '문제를 불러오지 못했습니다.' },
        );
        setCurrentItems([]);
        setPhase({ step: 'quiz', band, questions: data.questions, index: 0 });
      } catch {
        setPhase({ step: 'intro' });
      }
    },
    [mode],
  );

  const submit = useCallback(
    async (rounds: CompletedRound[], selectedGrade: DiagnosticGrade) => {
      setPhase({ step: 'loading', band: rounds[rounds.length - 1].band, message: '결과를 분석하고 있어요…' });
      try {
        const res = await fetchWithToast<SubmitResponse>('/api/voca/diagnostic/submit', {
          body: {
            grade: selectedGrade,
            rounds: rounds.map((r) => ({ band: r.band, items: r.items })),
          },
          retry: 2,
          errorMessage: '결과 저장에 실패했습니다.',
        });
        track('diagnostic_complete', {
          level: `${res.level.band}:${res.level.qualifier}`,
          coverage: res.coverageScore,
        });
        setPhase({ step: 'result', res });
      } catch {
        setPhase({ step: 'intro' });
      }
    },
    [],
  );

  const startDiagnostic = useCallback(
    (g: DiagnosticGrade) => {
      track('diagnostic_start', { grade: g });
      setGrade(g);
      setCompletedRounds([]);
      const band = getStartBand(g, activeBands);
      loadRound(band, prevVocabIds, '단어를 고르고 있어요…');
    },
    [activeBands, prevVocabIds, loadRound],
  );

  const handleAnswer = useCallback(
    (chosenVocabId: string | null) => {
      if (phase.step !== 'quiz' || busy) return;
      const q = phase.questions[phase.index];
      // 더블클릭 등으로 같은 문항이 두 번 기록되는 것 방지
      if (currentItems.some((it) => it.vocabId === q.vocabId)) return;
      const correctOption = q.options.find((o) => o.vocabId === q.vocabId);
      // 오답 표시용 영어/뜻은 유형에 따라 prompt·정답 보기에서 조합
      const item: AnsweredItem = {
        vocabId: q.vocabId,
        front_text: q.type === 'ko-to-en' ? (correctOption?.text ?? '') : q.prompt,
        back_text: q.type === 'ko-to-en' ? q.prompt : (correctOption?.text ?? ''),
        chosenVocabId,
      };
      const items = [...currentItems, item];
      setCurrentItems(items);

      if (phase.index + 1 < phase.questions.length) {
        setPhase({ ...phase, index: phase.index + 1 });
        return;
      }

      // 라운드 종료 → 스테어케이스 판단
      setBusy(true);
      const rounds = [...completedRounds, { band: phase.band, items }];
      setCompletedRounds(rounds);
      const summaries: RoundSummary[] = rounds.map((r) => ({
        band: r.band,
        correct: correctCount(r.items),
        total: r.items.length,
      }));
      const step = nextStep(summaries, activeBands);
      setBusy(false);

      if (step.type === 'continue') {
        const message =
          step.band === phase.band
            ? '정확한 측정을 위해 같은 레벨을 한 번 더 볼게요'
            : step.band > phase.band
              ? '잘하는데요? 조금 더 어려운 단어로 볼게요'
              : '이번엔 조금 쉬운 단어로 볼게요';
        loadRound(step.band, [...seenIds, ...items.map((i) => i.vocabId)], message);
      } else if (mode === 'public') {
        // value-first: 결과는 가입 후 — 완료분을 담아두고 게이트로
        try {
          const pending: PendingDiagnostic = { grade: grade!, rounds, at: Date.now() };
          localStorage.setItem(PENDING_KEY, JSON.stringify(pending));
        } catch { /* localStorage 불가 시에도 게이트는 보여준다 */ }
        track('diagnostic_public_complete', { grade: grade!, rounds: rounds.length });
        setPhase({ step: 'gate' });
      } else {
        submit(rounds, grade!);
      }
    },
    [phase, busy, currentItems, completedRounds, activeBands, seenIds, grade, loadRound, submit, mode],
  );

  // 가입 직후 student 모드 진입: /level-test에서 다 푼 진단이 있으면 자동 제출 → 바로 결과
  useEffect(() => {
    if (mode !== 'student') return;
    try {
      const raw = localStorage.getItem(PENDING_KEY);
      if (!raw) return;
      localStorage.removeItem(PENDING_KEY);
      const pending = JSON.parse(raw) as PendingDiagnostic;
      if (!pending?.rounds?.length || !pending.grade) return;
      if (Date.now() - (pending.at ?? 0) > 24 * 60 * 60 * 1000) return;
      if (tookToday) return; // 오늘 이미 결과가 있으면 하루 1회 제한(409)만 나므로 버린다
      setGrade(pending.grade);
      setCompletedRounds(pending.rounds);
      track('diagnostic_pending_submit', { grade: pending.grade });
      submit(pending.rounds, pending.grade);
    } catch { /* 손상된 payload는 무시 */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (activeBands.length === 0) {
    return <EmptyState />;
  }

  if (phase.step === 'intro') {
    return (
      <IntroScreen
        latest={latest}
        tookToday={tookToday}
        onStart={startDiagnostic}
        l1Active={activeBands.includes('L1')}
      />
    );
  }

  if (phase.step === 'loading') {
    return (
      <div className="mx-auto flex min-h-[50dvh] max-w-md flex-col items-center justify-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200" style={{ borderTopColor: VOCA_COLORS.blue }} />
        <p className="text-center font-medium" style={{ color: VOCA_COLORS.gray }}>{phase.message}</p>
      </div>
    );
  }

  if (phase.step === 'gate') {
    return <SignupGateScreen />;
  }

  if (phase.step === 'quiz') {
    const q = phase.questions[phase.index];
    return (
      <div className="mx-auto max-w-md">
        <div className="mb-6 flex items-center justify-between text-sm text-gray-400">
          <span>{phase.index + 1} / {phase.questions.length} 문항</span>
          <span>{completedRounds.length + 1}라운드 · {getBand(phase.band).label} 수준 측정 중</span>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={`${phase.band}-${phase.index}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.15 }}
            className="space-y-8"
          >
            {q.type === 'ko-to-en' && (
              <p className="text-center text-xs font-bold" style={{ color: VOCA_COLORS.blueDark }}>
                뜻에 맞는 단어는?
              </p>
            )}
            <p
              className={cn('text-center font-bold', q.type === 'ko-to-en' ? 'text-2xl leading-relaxed' : 'text-4xl')}
              style={{ color: VOCA_COLORS.blue, wordBreak: 'keep-all' }}
            >
              {q.prompt}
            </p>
            <div className="space-y-3">
              {q.options.map((option, i) => {
                const theme = VOCA_STEP_THEMES[i % VOCA_STEP_THEMES.length];
                return (
                  <button
                    key={option.vocabId}
                    onClick={() => handleAnswer(option.vocabId)}
                    className="flex w-full items-center gap-3 rounded-2xl border-2 border-gray-200 bg-white px-4 py-3.5 text-left text-lg font-medium text-gray-700 transition-all hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md active:scale-[0.99]"
                  >
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                      style={{ background: theme.bg, color: theme.text }}
                    >
                      {i + 1}
                    </span>
                    {option.text}
                  </button>
                );
              })}
              <button
                onClick={() => handleAnswer(null)}
                className="w-full rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-center text-base font-medium text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-500"
              >
                모르겠어요
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  return (
    <ResultScreen
      res={phase.res}
      grade={grade!}
      rounds={completedRounds}
      previous={latest}
      isFree={isFree}
      activeBands={activeBands}
      bandBooks={bandBooks}
    />
  );
}

/** public 모드 완료 게이트 — 5분 투자를 끝낸 사람에게만 가입을 요구한다 (value-first) */
function SignupGateScreen() {
  return (
    <div className="mx-auto max-w-md space-y-5 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-3xl p-8"
        style={{ background: VOCA_COLORS.blueLight }}
      >
        <p className="text-5xl">🎉</p>
        <h2 className="mt-3 text-2xl font-bold" style={{ color: VOCA_COLORS.ink }}>진단 완료!</h2>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: VOCA_COLORS.gray }}>
          내 어휘 레벨과 <b style={{ color: VOCA_COLORS.ink }}>모의고사 단어 커버리지 %</b>가 준비됐어요.
          <br />
          결과는 가입하면 바로 보여드려요.
        </p>
        <div className="mt-5 rounded-2xl bg-white p-4">
          <p className="text-sm" style={{ color: VOCA_COLORS.gray }}>내 레벨</p>
          <p className="text-3xl font-bold tracking-widest" style={{ color: VOCA_COLORS.blue, filter: 'blur(10px)', userSelect: 'none' }} aria-hidden>
            L?
          </p>
        </div>
      </motion.div>
      <Link
        href="/signup?next=/student/voca/diagnostic"
        onClick={() => track('diagnostic_gate_signup_click')}
        className="inline-block w-full rounded-full py-3.5 text-center text-base font-bold text-white transition-opacity hover:opacity-90"
        style={{ background: VOCA_COLORS.blue }}
      >
        10초 가입하고 결과 보기
      </Link>
      <p className="text-xs text-gray-400">무료 · 카드 등록 없음 · 가입 즉시 결과 화면으로 이동해요</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mx-auto max-w-md rounded-2xl border bg-white p-8 text-center">
      <p className="font-medium text-gray-500">진단 준비 중입니다. 조금만 기다려주세요.</p>
    </div>
  );
}

function IntroScreen({
  latest,
  tookToday,
  onStart,
  l1Active,
}: {
  latest: LatestDiagnostic | null;
  tookToday: boolean;
  onStart: (g: DiagnosticGrade) => void;
  l1Active: boolean;
}) {
  const latestLevel = latest
    ? formatLevel({ band: latest.finalBand as BandKey, qualifier: latest.finalQualifier as FinalLevel['qualifier'] })
    : null;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="rounded-3xl p-6 md:p-8" style={{ background: VOCA_COLORS.sky }}>
        <h1 className="text-2xl font-bold" style={{ color: VOCA_COLORS.ink }}>내 어휘 레벨, 5분이면 알아요</h1>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: VOCA_COLORS.gray }}>
          학년을 고르면 10문항씩 레벨을 오르내리며 정확한 어휘 수준을 찾아드려요.
          중간에 모르는 단어는 찍지 말고 <b>모르겠어요</b>를 눌러야 정확하게 측정돼요.
        </p>
        {latest && (
          <div className="mt-4 rounded-2xl bg-white/80 p-4 text-sm" style={{ color: VOCA_COLORS.gray }}>
            최근 진단({new Date(latest.createdAt).toLocaleDateString('ko-KR')}) — 레벨 <b>{latestLevel}</b> · 커버리지 <b>{latest.coverageScore}%</b>
          </div>
        )}
      </div>

      {tookToday ? (
        <div className="rounded-2xl border bg-white p-6 text-center">
          <p className="font-medium" style={{ color: VOCA_COLORS.gray }}>오늘은 이미 진단을 마쳤어요. 내일 다시 측정할 수 있어요.</p>
          <Link href="/student/voca" className="mt-3 inline-block rounded-full px-6 py-2.5 font-bold text-white" style={{ background: VOCA_COLORS.blue }}>
            단어 학습하러 가기
          </Link>
        </div>
      ) : (
        <div>
          <p className="mb-3 text-sm font-bold" style={{ color: VOCA_COLORS.gray }}>학년을 선택하세요</p>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {DIAGNOSTIC_GRADES.map((g, i) => {
              const theme = VOCA_STEP_THEMES[i % VOCA_STEP_THEMES.length];
              return (
                <button
                  key={g.key}
                  onClick={() => onStart(g.key)}
                  className="rounded-2xl border-2 border-gray-200 bg-white py-4 text-center font-bold transition-all hover:-translate-y-0.5 hover:shadow-md"
                  style={{ color: theme.text }}
                >
                  {g.label}
                </button>
              );
            })}
          </div>
          {!l1Active && (
            <p className="mt-2 text-xs text-gray-400">초등학생은 중1 수준부터 측정돼요.</p>
          )}
        </div>
      )}
    </div>
  );
}

function ResultScreen({
  res,
  grade,
  rounds,
  previous,
  isFree,
  activeBands,
  bandBooks,
}: {
  res: SubmitResponse;
  grade: DiagnosticGrade;
  rounds: CompletedRound[];
  previous: LatestDiagnostic | null;
  isFree: boolean;
  activeBands: BandKey[];
  bandBooks: Record<BandKey, BandBook[]>;
}) {
  const gradeInfo = DIAGNOSTIC_GRADES.find((g) => g.key === grade)!;
  const gap = levelGapFromGrade(grade, res.level);
  // 커버리지는 1라운드(학년 시작 밴드) 정답률이므로 출처 라벨도 1라운드 밴드 기준
  const sourceLabel = getBand(rounds[0].band).sourceLabel;
  const missed = rounds
    .flatMap((r) => r.items)
    .filter((it) => it.chosenVocabId !== it.vocabId)
    .slice(0, 5);
  const delta = previous ? res.coverageScore - previous.coverageScore : null;

  const gapText =
    gap === 0 ? '학년 수준이에요' : gap > 0 ? `학년보다 ${gap}단계 위예요` : `학년보다 ${-gap}단계 아래예요`;
  const gapColor = gap >= 0 ? VOCA_COLORS.green : VOCA_COLORS.red;

  return (
    <div className="mx-auto max-w-lg space-y-5">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-3xl p-6 text-center md:p-8"
        style={{ background: VOCA_COLORS.blueLight }}
      >
        <p className="text-sm font-bold" style={{ color: VOCA_COLORS.blueDark }}>진단 결과</p>
        <p className="mt-2 text-4xl font-bold" style={{ color: VOCA_COLORS.blue }}>{formatLevel(res.level)}</p>
        <p className="mt-2 text-sm font-bold" style={{ color: gapColor }}>
          {gradeInfo.label} 기준 · {gapText}
        </p>
        <div className="mt-5 rounded-2xl bg-white p-4">
          <p className="text-sm" style={{ color: VOCA_COLORS.gray }}>{sourceLabel} 단어 커버리지</p>
          <p className="text-3xl font-bold" style={{ color: VOCA_COLORS.ink }}>{res.coverageScore}%</p>
          {delta !== null && (
            <p className="mt-1 text-sm font-bold" style={{ color: delta >= 0 ? VOCA_COLORS.green : VOCA_COLORS.red }}>
              지난 진단 대비 {delta >= 0 ? '+' : ''}{delta}%p
            </p>
          )}
        </div>
      </motion.div>

      {missed.length > 0 && (
        <div className="rounded-2xl border bg-white p-5">
          <p className="mb-3 text-sm font-bold" style={{ color: VOCA_COLORS.gray }}>이런 단어를 놓쳤어요</p>
          <ul className="space-y-2">
            {missed.map((it) => (
              <li key={it.vocabId} className="flex items-baseline justify-between gap-3 text-sm">
                <span className="font-bold" style={{ color: VOCA_COLORS.ink }}>{it.front_text}</span>
                <span className="text-right text-gray-500">{it.back_text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <RecommendationCard level={res.level} activeBands={activeBands} bandBooks={bandBooks} isFree={isFree} />
    </div>
  );
}

/** 판정 레벨 밴드의 교재를 추천 — 학년이 아니라 측정된 레벨 기준 */
function RecommendationCard({
  level,
  activeBands,
  bandBooks,
  isFree,
}: {
  level: FinalLevel;
  activeBands: BandKey[];
  bandBooks: Record<BandKey, BandBook[]>;
  isFree: boolean;
}) {
  const band = recommendBandKey(level, activeBands);
  const books = bandBooks[band] ?? [];
  const primary = books[0];

  return (
    <div className="rounded-2xl border bg-white p-5 text-center">
      {primary && (
        <>
          <p className="text-xs font-bold" style={{ color: VOCA_COLORS.blueDark }}>내 레벨 추천 교재</p>
          <p className="mt-1 text-lg font-bold" style={{ color: VOCA_COLORS.ink, wordBreak: 'keep-all' }}>
            {primary.title}
            {books.length > 1 && <span className="text-sm font-medium text-gray-400"> 외 {books.length - 1}권</span>}
          </p>
          <p className="mt-1 text-sm" style={{ color: VOCA_COLORS.gray }}>
            지금 레벨({getBand(band).label})에 딱 맞는 교재예요. 여기서 시작해서 한 단계씩 올라가요.
          </p>
        </>
      )}
      {isFree ? (
        <>
          <Link
            href="/allkill#price"
            onClick={() => track('checkout_click', { source: 'diagnostic_result' })}
            className="mt-3 inline-block rounded-full px-8 py-3 font-bold text-white"
            style={{ background: VOCA_COLORS.blue }}
          >
            올킬보카 시작하기
          </Link>
          <p className="mt-2 text-xs text-gray-400">시작하면 추천 교재부터 바로 학습할 수 있어요</p>
        </>
      ) : (
        <Link
          href={primary ? `/student/voca?bookId=${primary.id}` : '/student/voca'}
          className="mt-3 inline-block rounded-full px-8 py-3 font-bold text-white"
          style={{ background: VOCA_COLORS.blue }}
        >
          {primary ? '추천 교재로 시작하기' : '단어 학습 시작하기'}
        </Link>
      )}
    </div>
  );
}
