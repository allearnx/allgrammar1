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
  BAND_KEYS,
  DIAGNOSTIC_GRADES,
  getBand,
  formatLevel,
  levelGapFromGrade,
  recommendBandKey,
  type BandKey,
  type DiagnosticGrade,
  type FinalLevel,
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

/** 비로그인 진단 완료분 — 가입 후 자동 제출용 (24시간 유효). v2 = 봉인 토큰 형식 */
const PENDING_KEY = 'allkill:pending-diagnostic:v2';

interface PendingDiagnostic {
  grade: DiagnosticGrade;
  rounds: CompletedRound[];
  at: number;
  /** 완주 시점의 익명 서버 기록 id — 연락처/계정 연결용 */
  leadId?: string;
}

/** 정오는 클라이언트가 모른다 — 봉인 토큰과 고른 보기 인덱스만 보관·전송 */
interface AnsweredItem {
  token: string;
  chosenIndex: number | null;
}

interface CompletedRound {
  band: BandKey;
  items: AnsweredItem[];
}

interface MissedWord {
  front_text: string;
  back_text: string;
}

interface SubmitResponse {
  id: string;
  attemptNumber: number;
  level: FinalLevel;
  coverageScore: number;
  startBand?: BandKey;
  missed?: MissedWord[];
}

type NextRoundResponse =
  | { done: true }
  | { done?: undefined; band: BandKey; questions: DiagnosticQuestion[] };

type Phase =
  | { step: 'intro' }
  | { step: 'loading'; band: BandKey | null; message: string }
  | { step: 'quiz'; band: BandKey; questions: DiagnosticQuestion[]; index: number }
  | { step: 'gate' } // public 모드: 다 풀었고, 결과는 연락처/가입 후
  | { step: 'result'; res: SubmitResponse };

export function DiagnosticClient({ activeBands, bandBooks, latest, tookToday, prevVocabIds, isFree, mode = 'student' }: Props) {
  const [phase, setPhase] = useState<Phase>({ step: 'intro' });
  const [grade, setGrade] = useState<DiagnosticGrade | null>(null);
  const [completedRounds, setCompletedRounds] = useState<CompletedRound[]>([]);
  const [currentItems, setCurrentItems] = useState<AnsweredItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [leadId, setLeadId] = useState<string | null>(null);

  /**
   * 다음 라운드 요청 — 완료 라운드(봉인 토큰+선택)를 서버에 보내면
   * 서버가 스테어케이스를 판단해 다음 문항 또는 종료(done)를 돌려준다.
   */
  const requestNext = useCallback(
    async (rounds: CompletedRound[], selectedGrade: DiagnosticGrade, message: string): Promise<NextRoundResponse | null> => {
      const prevBand = rounds.length ? rounds[rounds.length - 1].band : null;
      setPhase({ step: 'loading', band: prevBand, message });
      try {
        return await fetchWithToast<NextRoundResponse>(
          mode === 'public' ? '/api/public/diagnostic/questions' : '/api/voca/diagnostic/questions',
          {
            body: {
              grade: selectedGrade,
              rounds: rounds.map((r) => r.items),
              excludeIds: prevVocabIds.slice(0, 1000),
            },
            retry: 2,
            errorMessage: '문제를 불러오지 못했습니다.',
          },
        );
      } catch {
        setPhase({ step: 'intro' });
        return null;
      }
    },
    [mode, prevVocabIds],
  );

  const submit = useCallback(
    async (rounds: CompletedRound[], selectedGrade: DiagnosticGrade, linkLeadId?: string) => {
      setPhase({ step: 'loading', band: rounds[rounds.length - 1].band, message: '결과를 분석하고 있어요…' });
      try {
        const res = await fetchWithToast<SubmitResponse>('/api/voca/diagnostic/submit', {
          body: {
            grade: selectedGrade,
            rounds: rounds.map((r) => r.items),
            ...(linkLeadId ? { leadId: linkLeadId } : {}),
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

  /** 모든 라운드 종료 후 처리 — public은 익명 저장 + 게이트, student는 제출 */
  const finishRounds = useCallback(
    (rounds: CompletedRound[], selectedGrade: DiagnosticGrade) => {
      if (mode !== 'public') {
        submit(rounds, selectedGrade);
        return;
      }
      // value-first: 결과는 연락처/가입 후 — 완료분을 담아두고 게이트로
      try {
        const pending: PendingDiagnostic = { grade: selectedGrade, rounds, at: Date.now() };
        localStorage.setItem(PENDING_KEY, JSON.stringify(pending));
      } catch { /* localStorage 불가 시에도 게이트는 보여준다 */ }
      track('diagnostic_public_complete', { grade: selectedGrade, rounds: rounds.length });
      setPhase({ step: 'gate' });
      // 완주 즉시 익명 서버 기록 — 이탈해도 분포는 남고, 연락처·계정 연결의 앵커가 된다
      fetchWithToast<{ leadId: string }>('/api/public/diagnostic/complete', {
        body: { grade: selectedGrade, rounds: rounds.map((r) => r.items) },
        silent: true,
        retry: 1,
      })
        .then((data) => {
          setLeadId(data.leadId);
          try {
            const raw = localStorage.getItem(PENDING_KEY);
            if (raw) {
              const pending = JSON.parse(raw) as PendingDiagnostic;
              pending.leadId = data.leadId;
              localStorage.setItem(PENDING_KEY, JSON.stringify(pending));
            }
          } catch { /* ignore */ }
        })
        .catch(() => { /* 저장 실패해도 게이트는 폴백(rounds 재전송)으로 동작 */ });
    },
    [mode, submit],
  );

  const startDiagnostic = useCallback(
    async (g: DiagnosticGrade) => {
      track('diagnostic_start', { grade: g });
      setGrade(g);
      setCompletedRounds([]);
      const data = await requestNext([], g, '단어를 고르고 있어요…');
      if (!data || data.done) return;
      setCurrentItems([]);
      setPhase({ step: 'quiz', band: data.band, questions: data.questions, index: 0 });
    },
    [requestNext],
  );

  const handleAnswer = useCallback(
    async (chosenIndex: number | null) => {
      if (phase.step !== 'quiz' || busy) return;
      // 더블클릭 등으로 같은 문항이 두 번 기록되는 것 방지
      if (currentItems.length > phase.index) return;
      const q = phase.questions[phase.index];
      const items = [...currentItems, { token: q.token, chosenIndex }];
      setCurrentItems(items);

      if (phase.index + 1 < phase.questions.length) {
        setPhase({ ...phase, index: phase.index + 1 });
        return;
      }

      // 라운드 종료 → 서버가 스테어케이스 판단 (다음 밴드 또는 종료)
      setBusy(true);
      const prevBand = phase.band;
      const rounds = [...completedRounds, { band: prevBand, items }];
      setCompletedRounds(rounds);
      const data = await requestNext(rounds, grade!, '결과를 확인하고 있어요…');
      setBusy(false);
      if (!data) return;
      if (data.done) {
        finishRounds(rounds, grade!);
        return;
      }
      const dir = BAND_KEYS.indexOf(data.band) - BAND_KEYS.indexOf(prevBand);
      const message =
        dir === 0
          ? '정확한 측정을 위해 같은 레벨을 한 번 더 볼게요'
          : dir > 0
            ? '잘하는데요? 조금 더 어려운 단어로 볼게요'
            : '이번엔 조금 쉬운 단어로 볼게요';
      setPhase({ step: 'loading', band: data.band, message });
      await new Promise((r) => setTimeout(r, 900));
      setCurrentItems([]);
      setPhase({ step: 'quiz', band: data.band, questions: data.questions, index: 0 });
    },
    [phase, busy, currentItems, completedRounds, grade, requestNext, finishRounds],
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
      submit(pending.rounds, pending.grade, pending.leadId);
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
        elemActive={activeBands.includes('L0')}
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
    return (
      <ContactGateScreen
        onSubmitContact={async (name, phone) => {
          const body = leadId
            ? { leadId, name, phone }
            : { name, phone, grade: grade!, rounds: completedRounds.map((r) => r.items) };
          const data = await fetchWithToast<{ level: FinalLevel; coverageScore: number; startBand?: BandKey; missed?: MissedWord[] }>(
            '/api/public/diagnostic/lead',
            { body, retry: 1, errorMessage: '저장에 실패했습니다. 잠시 후 다시 시도해주세요.' },
          );
          track('diagnostic_lead_submit', { grade: grade! });
          setPhase({
            step: 'result',
            res: { id: '', attemptNumber: 1, level: data.level, coverageScore: data.coverageScore, startBand: data.startBand, missed: data.missed },
          });
        }}
      />
    );
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
                    key={`${phase.index}-${i}`}
                    onClick={() => handleAnswer(i)}
                    className="flex w-full items-center gap-3 rounded-2xl border-2 border-gray-200 bg-white px-4 py-3.5 text-left text-lg font-medium text-gray-700 transition-all hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md active:scale-[0.99]"
                  >
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                      style={{ background: theme.bg, color: theme.text }}
                    >
                      {i + 1}
                    </span>
                    {option}
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
      publicMode={mode === 'public'}
    />
  );
}

/**
 * public 모드 완료 게이트 — 5분 투자를 끝낸 사람에게 "결과 받을 연락처"를 받는다 (value-first).
 * 주 동선 = 이름+휴대폰 (마찰 최소, 리드 확보). 가입은 결과 화면에서 이어서 유도.
 */
function ContactGateScreen({ onSubmitContact }: { onSubmitContact: (name: string, phone: string) => Promise<void> }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const valid = name.trim().length >= 1 && /^01[016789]-?\d{3,4}-?\d{4}$/.test(phone.trim());

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || submitting) return;
    setSubmitting(true);
    try {
      await onSubmitContact(name.trim(), phone.trim());
    } catch {
      // fetchWithToast already toasted
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-5 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-3xl p-8"
        style={{ background: VOCA_COLORS.blueLight }}
      >
        <p className="text-5xl">🎉</p>
        <h2 className="mt-3 text-2xl font-bold" style={{ color: VOCA_COLORS.ink, wordBreak: 'keep-all' }}>
          우리 아이 진단 결과가 준비됐어요!
        </h2>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: VOCA_COLORS.gray, wordBreak: 'keep-all' }}>
          어휘 레벨과 <b style={{ color: VOCA_COLORS.ink }}>학년 단어를 몇 % 아는지</b> 나왔어요.
          <br />
          리포트 받으실 학부모님 연락처를 남겨주세요.
        </p>
        <form onSubmit={handleSubmit} className="mt-5 space-y-3 text-left">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="학부모님 성함"
            maxLength={30}
            className="w-full rounded-2xl border-2 border-white bg-white px-4 py-3 text-base outline-none focus:border-[#1A73E8]"
          />
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="학부모님 휴대폰 번호 (010-0000-0000)"
            maxLength={13}
            className="w-full rounded-2xl border-2 border-white bg-white px-4 py-3 text-base outline-none focus:border-[#1A73E8]"
          />
          <button
            type="submit"
            disabled={!valid || submitting}
            className="w-full rounded-full py-3.5 text-center text-base font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            style={{ background: VOCA_COLORS.blue }}
          >
            {submitting ? '결과 확인 중…' : '진단 결과 바로 보기'}
          </button>
        </form>
        <p className="mt-3 text-xs" style={{ color: VOCA_COLORS.gray }}>
          연락처는 진단 리포트 안내와 학습 상담 목적으로만 사용해요.
        </p>
      </motion.div>
      <Link
        href="/signup?next=/student/voca/diagnostic"
        onClick={() => track('diagnostic_gate_signup_click')}
        className="inline-block text-sm font-semibold text-gray-400 underline underline-offset-4 hover:text-gray-600"
      >
        또는 10초 가입하고 결과 보기
      </Link>
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
  elemActive,
}: {
  latest: LatestDiagnostic | null;
  tookToday: boolean;
  onStart: (g: DiagnosticGrade) => void;
  elemActive: boolean;
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
            최근 진단({new Date(latest.createdAt).toLocaleDateString('ko-KR')}) — 레벨 <b>{latestLevel}</b> · 학년 단어 정답률 <b>{latest.coverageScore}%</b>
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
          {!elemActive && (
            <p className="mt-2 text-xs text-gray-400">초등 교재 준비 중에는 중1 수준부터 측정돼요.</p>
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
  publicMode = false,
}: {
  res: SubmitResponse;
  grade: DiagnosticGrade;
  rounds: CompletedRound[];
  previous: LatestDiagnostic | null;
  isFree: boolean;
  activeBands: BandKey[];
  bandBooks: Record<BandKey, BandBook[]>;
  publicMode?: boolean;
}) {
  const gradeInfo = DIAGNOSTIC_GRADES.find((g) => g.key === grade)!;
  const gap = levelGapFromGrade(grade, res.level);
  // 정답률 라벨은 시작(학년) 밴드 기준 — 정오는 서버만 알므로 놓친 단어도 서버 응답에서 받는다
  const sourceLabel = getBand(res.startBand ?? rounds[0]?.band ?? res.level.band).sourceLabel;
  const missed = res.missed ?? [];
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
          <p className="text-sm" style={{ color: VOCA_COLORS.gray }}>
            <b style={{ color: VOCA_COLORS.ink }}>{sourceLabel} 단어</b>를 이만큼 알고 있어요
          </p>
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
              <li key={it.front_text} className="flex items-baseline justify-between gap-3 text-sm">
                <span className="font-bold" style={{ color: VOCA_COLORS.ink }}>{it.front_text}</span>
                <span className="text-right text-gray-500">{it.back_text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <RecommendationCard level={res.level} activeBands={activeBands} bandBooks={bandBooks} isFree={isFree} publicMode={publicMode} />
    </div>
  );
}

/** 판정 레벨 밴드의 교재를 추천 — 학년이 아니라 측정된 레벨 기준 */
function RecommendationCard({
  level,
  activeBands,
  bandBooks,
  isFree,
  publicMode = false,
}: {
  level: FinalLevel;
  activeBands: BandKey[];
  bandBooks: Record<BandKey, BandBook[]>;
  isFree: boolean;
  publicMode?: boolean;
}) {
  const band = recommendBandKey(level, activeBands);
  const books = bandBooks[band] ?? [];
  const primary = books[0];
  // 대표 처방이 학년 교과서 단어면 시중 단어 교재를 나란히 함께 추천
  const companion = primary?.title.includes('교과서 단어') ? books[1] : undefined;

  return (
    <div className="rounded-2xl border bg-white p-5 text-center">
      {primary && (
        <>
          <p className="text-xs font-bold" style={{ color: VOCA_COLORS.blueDark }}>내 레벨 추천 교재</p>
          <p className="mt-1 text-lg font-bold" style={{ color: VOCA_COLORS.ink, wordBreak: 'keep-all' }}>
            {primary.title}
            {!companion && books.length > 1 && <span className="text-sm font-medium text-gray-400"> 외 {books.length - 1}권</span>}
          </p>
          <p className="mt-1 text-sm" style={{ color: VOCA_COLORS.gray }}>
            지금 레벨({getBand(band).label})에 딱 맞는 교재예요. 여기서 시작해서 한 단계씩 올라가요.
          </p>
          {/* 초등(L0) 추천 = 천일문 스타트 — 교과서 단어 DB 교차 분석 근거 (2026-07-23, 중1 350단어 중 40% 수록) */}
          {band === 'L0' && (
            <p className="mt-1.5 text-sm font-semibold" style={{ color: VOCA_COLORS.blueDark }}>
              이 교재에는 중1 교과서 단어의 40%가 담겨 있어요 — 중학교 입학 전 미리 만나요 🎒
            </p>
          )}
          {companion && (
            <p className="mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold" style={{ background: '#E8F0FE', color: VOCA_COLORS.blueDark }}>
              함께 추천 · {companion.title}
            </p>
          )}
        </>
      )}
      {publicMode ? (
        <>
          <Link
            href="/signup?next=/student/voca/diagnostic"
            onClick={() => track('diagnostic_result_signup_click')}
            className="mt-3 inline-block rounded-full px-8 py-3 font-bold text-white"
            style={{ background: VOCA_COLORS.blue }}
          >
            가입하고 추천 교재로 시작하기
          </Link>
          <p className="mt-2 text-xs text-gray-400">가입하면 이 결과가 계정에 저장되고, 추천 교재부터 바로 학습해요</p>
        </>
      ) : isFree ? (
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
