'use client';

/**
 * 어휘 레벨 진단 — 학년 선택 → 스테어케이스 라운드(10문항) → 결과.
 * 문항별 정오는 진행 중 보여주지 않는다 (레벨테스트 관행 + 다음 라운드 힌트 방지).
 */

import { useCallback, useEffect, useState } from 'react';
import { track } from '@vercel/analytics';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import { VOCA_COLORS, VOCA_STEP_THEMES } from '@/lib/voca/brand-tokens';
import {
  BAND_KEYS,
  ROUND_SIZE,
  getBand,
  type BandKey,
  type DiagnosticGrade,
  type FinalLevel,
} from '@/lib/voca/diagnostic-bands';
import type { DiagnosticQuestion } from '@/lib/voca/diagnostic-sampling';
import { ContactGateScreen } from './_components/contact-gate-screen';
import { EmptyState } from './_components/empty-state';
import { IntroScreen } from './_components/intro-screen';
import { ResultScreen } from './_components/result-screen';
import type { LatestDiagnostic, MissedWord, SubmitResponse } from './_components/types';

export type { LatestDiagnostic } from './_components/types';

interface Props {
  activeBands: BandKey[];
  /** 라인업 교재 title → book id (활성 교재만) — "지금 시작할 교재" 렌더용 */
  lineupBookIds: Record<string, string>;
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

/** 정오는 클라이언트가 모른다 — 봉인 토큰과 답(타이핑 or 보기 인덱스)만 보관·전송 (null = 모르겠어요) */
interface AnsweredItem {
  token: string;
  typed?: string | null;
  chosenIndex?: number | null;
}

interface CompletedRound {
  band: BandKey;
  items: AnsweredItem[];
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

export function DiagnosticClient({ activeBands, lineupBookIds, latest, tookToday, prevVocabIds, isFree, mode = 'student' }: Props) {
  const [phase, setPhase] = useState<Phase>({ step: 'intro' });
  const [grade, setGrade] = useState<DiagnosticGrade | null>(null);
  const [completedRounds, setCompletedRounds] = useState<CompletedRound[]>([]);
  const [currentItems, setCurrentItems] = useState<AnsweredItem[]>([]);
  const [typedInput, setTypedInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [leadId, setLeadId] = useState<string | null>(null);

  /**
   * 다음 문항 배치 요청 — 완료 라운드(봉인 토큰+답)를 서버에 보내면
   * 서버가 스테어케이스를 판단해 다음 문항 또는 종료(done)를 돌려준다.
   * currentRound(진행 중 라운드의 앞 배치 답)를 보내면 중간 채점 후 뒤 배치가 온다 —
   * 앞 배치를 잘 풀면(≥80%) 뒤 배치가 타이핑 위주로 바뀐다 (라운드 내 적응).
   */
  const requestNext = useCallback(
    async (
      rounds: CompletedRound[],
      selectedGrade: DiagnosticGrade,
      message: string,
      currentRound?: AnsweredItem[],
    ): Promise<NextRoundResponse | null> => {
      const prevBand = rounds.length ? rounds[rounds.length - 1].band : null;
      setPhase({ step: 'loading', band: prevBand, message });
      try {
        return await fetchWithToast<NextRoundResponse>(
          mode === 'public' ? '/api/public/diagnostic/questions' : '/api/voca/diagnostic/questions',
          {
            body: {
              grade: selectedGrade,
              rounds: rounds.map((r) => r.items),
              ...(currentRound?.length ? { currentRound } : {}),
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
    async (answer: { typed?: string | null; chosenIndex?: number | null }) => {
      if (phase.step !== 'quiz' || busy) return;
      // 더블 제출 등으로 같은 문항이 두 번 기록되는 것 방지
      if (currentItems.length > phase.index) return;
      const q = phase.questions[phase.index];
      const items = [...currentItems, { token: q.token, ...answer }];
      setCurrentItems(items);
      setTypedInput('');

      if (phase.index + 1 < phase.questions.length) {
        setPhase({ ...phase, index: phase.index + 1 });
        return;
      }

      const prevBand = phase.band;

      // 라운드 앞 배치(5문항) 완료 → 중간 채점 후 뒤 배치 (잘 풀었으면 타이핑 위주로 바뀐다)
      if (items.length < ROUND_SIZE) {
        setBusy(true);
        const tail = await requestNext(completedRounds, grade!, '이어질 문제를 고르고 있어요…', items);
        setBusy(false);
        if (!tail) return; // 에러 — requestNext가 intro로 되돌림
        if (!tail.done && tail.questions?.length) {
          setPhase({ step: 'quiz', band: prevBand, questions: [...phase.questions, ...tail.questions], index: items.length });
          return;
        }
        // 뒤 배치를 못 받은 비정상 케이스 — 앞 배치만으로 라운드를 마감(폴백)하고 아래로 진행
      }

      // 라운드 종료 → 서버가 스테어케이스 판단 (다음 밴드 또는 종료)
      setBusy(true);
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
          const data = await fetchWithToast<{ level: FinalLevel; coverageScore: number; finalBandScore?: number; startBand?: BandKey; missed?: MissedWord[]; missedCount?: number }>(
            '/api/public/diagnostic/lead',
            { body, retry: 1, errorMessage: '저장에 실패했습니다. 잠시 후 다시 시도해주세요.' },
          );
          track('diagnostic_lead_submit', { grade: grade! });
          setPhase({
            step: 'result',
            res: {
              id: '',
              attemptNumber: 1,
              level: data.level,
              coverageScore: data.coverageScore,
              finalBandScore: data.finalBandScore,
              startBand: data.startBand,
              missed: data.missed,
              missedCount: data.missedCount,
            },
          });
        }}
      />
    );
  }

  if (phase.step === 'quiz') {
    const q = phase.questions[phase.index];
    // 한글 자모·완성형이 섞이면 영어 답이 될 수 없다 (한글 자판 상태 그대로 친 경우)
    const hangulTyped = /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(typedInput);
    return (
      <div className="mx-auto max-w-md">
        <div className="mb-6 flex items-center justify-between text-sm text-gray-400">
          <span>{phase.index + 1} / {ROUND_SIZE} 문항</span>
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
            {q.format === 'typing' ? (
              <>
                <p className="text-center text-xs font-bold" style={{ color: VOCA_COLORS.blueDark }}>
                  뜻에 맞는 영어 단어를 입력하세요
                </p>
                <p
                  className="text-center text-2xl font-bold leading-relaxed"
                  style={{ color: VOCA_COLORS.blue, wordBreak: 'keep-all' }}
                >
                  {q.prompt}
                </p>
                {/* 첫 글자 + 글자 수 힌트 — 정답 자체는 토큰에 봉인되어 클라이언트에 없다 */}
                <p
                  className="text-center font-mono text-3xl font-bold tracking-[0.2em]"
                  style={{ color: VOCA_COLORS.ink }}
                >
                  {q.hint}
                </p>
                {/* 첫 글자만 보여주는 힌트를 "이미 채워진 것"으로 읽고 나머지만 치는 학생이 있었다 */}
                <p className="-mt-4 text-center text-xs" style={{ color: VOCA_COLORS.gray }}>
                  첫 글자를 포함해 <b style={{ color: VOCA_COLORS.ink }}>단어 전체</b>를 입력하세요
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (typedInput.trim() && !hangulTyped) handleAnswer({ typed: typedInput.trim() });
                  }}
                  className="space-y-3"
                >
                  <input
                    key={`${phase.band}-${phase.index}`}
                    value={typedInput}
                    onChange={(e) => setTypedInput(e.target.value)}
                    autoFocus
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    lang="en"
                    placeholder="단어 전체 입력"
                    className={cn(
                      'w-full rounded-2xl border-2 bg-white px-4 py-3.5 text-center font-mono text-xl font-bold text-gray-800 outline-none transition-colors',
                      hangulTyped ? 'border-[#D93025]' : 'border-gray-200 focus:border-gray-400',
                    )}
                  />
                  {/* 한글 자판 상태로 치면 무조건 오답이 된다 — 제출을 막고 바로 알려준다 */}
                  {hangulTyped && (
                    <p className="text-center text-sm font-bold" style={{ color: VOCA_COLORS.red }}>
                      한글로 입력됐어요. 키보드를 영어로 바꿔주세요
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={!typedInput.trim() || hangulTyped}
                    className="w-full rounded-2xl px-4 py-3.5 text-lg font-bold text-white transition-all active:scale-[0.99] disabled:opacity-40"
                    style={{ background: VOCA_COLORS.blue }}
                  >
                    제출
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAnswer({ typed: null })}
                    className="w-full rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-center text-base font-medium text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-500"
                  >
                    모르겠어요
                  </button>
                </form>
              </>
            ) : (
              <>
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
                        onClick={() => handleAnswer({ chosenIndex: i })}
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
                    onClick={() => handleAnswer({ chosenIndex: null })}
                    className="w-full rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-center text-base font-medium text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-500"
                  >
                    모르겠어요
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  return (
    <ResultScreen
      res={phase.res}
      previous={latest}
      isFree={isFree}
      activeBands={activeBands}
      lineupBookIds={lineupBookIds}
      publicMode={mode === 'public'}
    />
  );
}
