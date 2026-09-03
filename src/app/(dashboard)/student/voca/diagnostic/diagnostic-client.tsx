'use client';

/**
 * 어휘 레벨 진단 — 학년 선택 → 스테어케이스 라운드(10문항) → 결과.
 * 문항별 정오는 진행 중 보여주지 않는다 (레벨테스트 관행 + 다음 라운드 힌트 방지).
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { track } from '@vercel/analytics';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import { VOCA_COLORS, VOCA_STEP_THEMES } from '@/lib/voca/brand-tokens';
import {
  BAND_KEYS,
  DIAGNOSTIC_GRADES,
  ROUND_SIZE,
  getBand,
  recommendBandKey,
  type BandKey,
  type DiagnosticGrade,
  type FinalLevel,
} from '@/lib/voca/diagnostic-bands';
import {
  DIAGNOSTIC_LINEUP,
  LINEUP_ACCENTS,
  resolveLineupPlacement,
  lineupColumnGap,
  shortBookTitle,
} from '@/lib/voca/diagnostic-lineup';
import { VocaBrandStyle } from '@/components/voca/voca-brand';
import type { DiagnosticQuestion } from '@/lib/voca/diagnostic-sampling';

export interface LatestDiagnostic {
  grade: string;
  finalBand: string;
  finalQualifier: string;
  coverageScore: number;
  /** 확정 밴드 정답률 — 추천 상향 컷 재현용 (저장된 rounds에서 재계산) */
  finalBandScore?: number;
  attemptNumber: number;
  createdAt: string;
}

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

interface MissedWord {
  front_text: string;
  back_text: string;
}

interface SubmitResponse {
  id: string;
  attemptNumber: number;
  level: FinalLevel;
  coverageScore: number;
  /** 확정 밴드 정답률 — 60% 이상이면 추천이 한 칸 위 교재로 (RECOMMEND_UP_PERCENT) */
  finalBandScore?: number;
  startBand?: BandKey;
  missed?: MissedWord[];
  missedCount?: number;
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
      <VocaBrandStyle />
      <div className="rounded-2xl border border-gray-200 bg-white p-8">
        <h2 className="voca-display text-2xl" style={{ color: VOCA_COLORS.ink, fontWeight: 700, wordBreak: 'keep-all' }}>
          우리 아이 진단 결과가 준비됐어요
        </h2>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: VOCA_COLORS.gray, wordBreak: 'keep-all' }}>
          <b style={{ color: VOCA_COLORS.ink }}>지금 시작할 교재</b>와 단어 정답률이 나왔어요.
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
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base outline-none focus:border-gray-500"
          />
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="학부모님 휴대폰 번호 (010-0000-0000)"
            maxLength={13}
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base outline-none focus:border-gray-500"
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
      </div>
      <Link
        href="/signup?next=/student/voca/diagnostic"
        onClick={() => track('diagnostic_gate_signup_click')}
        className="inline-block text-sm font-semibold text-gray-500 underline underline-offset-4 hover:text-gray-700"
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
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="rounded-3xl p-6 md:p-8" style={{ background: VOCA_COLORS.sky }}>
        <h1 className="text-2xl font-bold" style={{ color: VOCA_COLORS.ink, wordBreak: 'keep-all' }}>
          5분이면 나에게 맞는 단어장이 나와요
        </h1>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: VOCA_COLORS.gray }}>
          초등 단어부터 수능 기출까지, 어느 교재에서 시작할지 찾아드려요.
          뜻 고르기와 함께 <b>첫 글자 힌트를 보고 철자를 입력하는 문제</b>도 나와요.
          모르는 단어는 찍지 말고 <b>모르겠어요</b>를 눌러야 정확하게 측정돼요.
        </p>
        {latest && (
          <div className="mt-4 rounded-2xl bg-white/80 p-4 text-sm" style={{ color: VOCA_COLORS.gray }}>
            최근 진단({new Date(latest.createdAt).toLocaleDateString('ko-KR')}) — 단어 정답률 <b>{latest.coverageScore}%</b>
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
            <p className="mt-2 text-xs text-gray-500">초등 교재 준비 중에는 중1 수준부터 측정돼요.</p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * 결과 화면 — "○○ 수준" 학년 주장 없이 "지금 시작할 교재" 라인업 프레임 (2026-07-23 확정).
 * 학년 라벨은 칸 헤더로 교재를 설명할 뿐, 아이는 시작 위치만 받는다.
 */
function ResultScreen({
  res,
  previous,
  isFree,
  activeBands,
  lineupBookIds,
  publicMode = false,
}: {
  res: SubmitResponse;
  previous: LatestDiagnostic | null;
  isFree: boolean;
  activeBands: BandKey[];
  lineupBookIds: Record<string, string>;
  publicMode?: boolean;
}) {
  const recBand = recommendBandKey(res.level, activeBands, res.finalBandScore);
  // 확정 밴드를 60% 이상 알아서 한 칸 위 교재가 추천된 경우 — 근거 문구 표시용
  const bumpedUp = recBand !== recommendBandKey(res.level, activeBands);
  // 활성 교재 인지 폴백 — 추천 교재가 비활성(예: 검수 중)이면 오른쪽 첫 활성 교재로
  const placement = resolveLineupPlacement(recBand, lineupBookIds);
  // 화면 전체를 내 칸 색으로 물들인다 — 히어로·CTA가 라인업의 내 칸과 같은 색 (파랑 일색 탈피)
  const accent = LINEUP_ACCENTS[placement.columnKey];
  const missed = res.missed ?? [];
  const missedCount = res.missedCount ?? missed.length;
  const delta = previous ? res.coverageScore - previous.coverageScore : null;
  // 재진단 칸 비교 — 지난 진단의 추천 칸 대비 몇 칸 이동했는지 (내려간 경우는 언급하지 않는다:
  // 출제 풀 조정으로도 내려갈 수 있어 delta 오해 소지, 정답률 %p가 이미 변화를 말해준다)
  const columnGap = previous
    ? lineupColumnGap(
        recommendBandKey(
          { band: previous.finalBand as BandKey, qualifier: previous.finalQualifier as FinalLevel['qualifier'] },
          activeBands,
          previous.finalBandScore,
        ),
        recBand,
      )
    : 0;

  return (
    // 라인업이 6칸이라 결과 화면만 넓게 — 좁으면 교재명이 잘게 쪼개진다 (2026-08-12 피드백)
    <div className="mx-auto max-w-lg space-y-4 lg:max-w-3xl">
      <VocaBrandStyle />
      {/*
        히어로 — 파스텔 카드 + 이모지 + 튀어오르는 애니메이션은 걷어냈다
        ("AI스러운 요소 싹 빼줘", 2026-08-12). 흰 바탕에 상단 색 바만 두고
        제목은 브랜드 폰트(GmarketSans)로. 색은 내 칸 색을 따라간다.
      */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="h-1.5" style={{ background: accent.vivid }} />
        <div className="px-6 py-7 text-center md:px-8">
          <p className="text-xs font-bold tracking-wide" style={{ color: accent.deep }}>
            진단 완료 · 지금 시작할 교재
          </p>
          <p
            className="voca-display mt-2 text-3xl leading-tight"
            style={{ color: VOCA_COLORS.ink, fontWeight: 700, wordBreak: 'keep-all' }}
          >
            {placement.highlightTitle}
          </p>
          <p className="mt-2.5 text-sm" style={{ color: VOCA_COLORS.gray }}>
            여기서 시작해서 한 칸씩 올라가요
          </p>
          {bumpedUp && (
            <p className="mt-1.5 text-sm font-semibold" style={{ color: accent.deep, wordBreak: 'keep-all' }}>
              아래 단계 단어는 이미 {res.finalBandScore}% 알고 있어서 건너뛰었어요
            </p>
          )}
          {/* 천일문 추천 근거 한 줄 — 교과서 단어 DB 교차 분석 (중1 교과서 단어 40% 수록) */}
          {placement.highlightTitle === '천일문 보카 중등 스타트' && (
            <p className="mt-1.5 text-sm font-semibold" style={{ color: accent.deep, wordBreak: 'keep-all' }}>
              이 교재에는 중1 교과서 단어의 40%가 담겨 있어요
            </p>
          )}

          {/* 정답률 — 카드 안 카드(중첩 상자) 대신 구분선 아래 한 줄로 */}
          <div className="mt-6 border-t border-gray-100 pt-5">
            <p className="text-sm" style={{ color: VOCA_COLORS.gray }}>이 단계 단어 정답률</p>
            <p className="voca-display mt-1 text-4xl tabular-nums" style={{ color: VOCA_COLORS.ink, fontWeight: 700 }}>
              {res.coverageScore}%
            </p>
            <p className="mt-1.5 text-sm" style={{ color: VOCA_COLORS.gray }}>몰랐던 단어 {missedCount}개</p>
            {delta !== null && (
              <p className="mt-1 text-sm font-bold" style={{ color: delta >= 0 ? VOCA_COLORS.greenDark : VOCA_COLORS.red }}>
                지난 진단 대비 정답률 {delta >= 0 ? '+' : ''}{delta}%p
              </p>
            )}
            {columnGap > 0 && (
              <p className="mt-1 text-sm font-bold" style={{ color: VOCA_COLORS.greenDark }}>
                {columnGap === 1 ? '지난 진단보다 한 칸 올라갔어요' : `지난 진단보다 ${columnGap}칸 올라갔어요`}
              </p>
            )}
          </div>
        </div>
      </div>

      <LineupCard placement={placement} lineupBookIds={lineupBookIds} isFree={isFree} publicMode={publicMode} />

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

      <div className="rounded-2xl border bg-white p-5 text-center">
        {publicMode ? (
          <>
            <Link
              href="/signup?next=/student/voca/diagnostic"
              onClick={() => track('diagnostic_result_signup_click')}
              className="voca-cta inline-block rounded-full px-8 py-3 font-bold"
            >
              가입하고 추천 교재로 시작하기
            </Link>
            <p className="mt-2 text-xs text-gray-500">가입하면 이 결과가 계정에 저장되고, 추천 교재부터 바로 학습해요</p>
          </>
        ) : isFree ? (
          <>
            <Link
              href="/allkill#price"
              onClick={() => track('checkout_click', { source: 'diagnostic_result' })}
              className="voca-cta inline-block rounded-full px-8 py-3 font-bold"
            >
              올킬보카 시작하기
            </Link>
            <p className="mt-2 text-xs text-gray-500">시작하면 추천 교재부터 바로 학습할 수 있어요</p>
          </>
        ) : (
          <Link
            href={
              lineupBookIds[placement.highlightTitle]
                ? `/student/voca?bookId=${lineupBookIds[placement.highlightTitle]}`
                : '/student/voca'
            }
            className="voca-cta inline-block rounded-full px-8 py-3 font-bold"
          >
            추천 교재로 시작하기
          </Link>
        )}
      </div>
    </div>
  );
}

/**
 * 교재 라인업 — 6칸(중1~고3) 그리드. 사다리는 시중 교재 실명으로만 세우고,
 * 우리가 만든 초등 800·교과서 단어는 칸 아래 "기준점"으로 병렬 표시한다 (2026-08-12 개편).
 * 기준점도 선택해 시작할 수 있다. 초등 칸만 예외로 우리 교재(초등 800)가 칸 대표다
 * — 시중 초등 교재가 없고, L0를 초등 800으로 출제하므로 처방도 같아야 하기 때문.
 *
 * 2026-08-12 디자인 개편(사장님 피드백 "온통 파란색·카드가 좁다"):
 * 가로 스크롤 → 줄바꿈 그리드(카드가 넉넉해 교재가 여러 권인 칸도 안 잘림) +
 * 칸마다 다른 강조색(LINEUP_ACCENTS) + 단계 번호 칩으로 난이도 순서를 눈에 보이게.
 */
function LineupCard({
  placement,
  lineupBookIds,
  isFree,
  publicMode,
}: {
  placement: ReturnType<typeof resolveLineupPlacement>;
  lineupBookIds: Record<string, string>;
  isFree: boolean;
  publicMode: boolean;
}) {
  /** 교재별 CTA — 유료는 해당 교재로, 비로그인은 가입, 무료는 결제로 (선택한 흐름 그대로 퍼널 연결) */
  const bookHref = (title: string) => {
    if (publicMode) return '/signup?next=/student/voca/diagnostic';
    if (isFree) return '/allkill#price';
    const id = lineupBookIds[title];
    return id ? `/student/voca?bookId=${id}` : '/student/voca';
  };

  // 비활성 교재만 있는 칸은 숨긴다 — 단계 번호는 "보이는 칸" 기준으로 매겨야 1,2,3…이 안 끊긴다
  const columns = DIAGNOSTIC_LINEUP.map((column) => ({
    column,
    books: column.bookTitles.filter((t) => lineupBookIds[t]),
    anchors: column.anchorTitles.filter((t) => lineupBookIds[t]),
  })).filter((c) => c.books.length > 0 || c.anchors.length > 0);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <p className="voca-display text-base" style={{ color: VOCA_COLORS.ink, fontWeight: 700 }}>교재 라인업</p>
      <p className="mt-1 text-xs" style={{ color: VOCA_COLORS.gray }}>
        쉬운 순서대로 1번부터 — 칸 안에서는 원하는 교재를 골라도 돼요
      </p>
      {/* items-start — 교재 수가 다른 칸이 같은 높이로 늘어나 빈칸이 생기는 것 방지 */}
      <div className="mt-4 grid items-start gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {columns.map(({ column, books, anchors }, step) => {
          const isMine = column.key === placement.columnKey;
          const accent = LINEUP_ACCENTS[column.key];
          return (
            <div
              key={column.key}
              className={cn(
                'overflow-hidden rounded-xl border bg-white',
                isMine ? 'border-2' : 'border-gray-200',
              )}
              style={isMine ? { borderColor: accent.vivid } : undefined}
            >
              {/* 칸 색은 상단 바로만 — 파스텔 배경을 채우지 않아 인쇄물처럼 담백하게 */}
              <div className="h-1" style={{ background: accent.vivid }} />
              <div className="flex items-baseline gap-1.5 px-3.5 pb-2 pt-3">
                <span className="voca-display text-sm" style={{ color: accent.deep, fontWeight: 700 }}>
                  {step + 1}
                </span>
                <span
                  className="voca-display whitespace-nowrap text-base"
                  style={{ color: VOCA_COLORS.ink, fontWeight: 700 }}
                >
                  {column.gradeLabel}
                </span>
                {isMine && (
                  <span className="ml-auto whitespace-nowrap text-[11px] font-bold" style={{ color: accent.deep }}>
                    내 시작 칸
                  </span>
                )}
              </div>

              {/* 교재 목록 — 행 전체가 링크다 ("이 교재로 시작 →" 반복 문구 제거) */}
              <div className="border-t border-gray-100">
                {books.map((title, i) => {
                  const isRecommended = isMine && title === placement.highlightTitle;
                  return (
                    <Link
                      key={title}
                      href={bookHref(title)}
                      onClick={() => track('diagnostic_lineup_book_click', { title, recommended: isRecommended })}
                      className="flex items-baseline gap-2 border-b border-gray-100 px-3.5 py-2.5 transition-colors last:border-b-0 hover:bg-gray-50"
                    >
                      <span
                        className={cn('flex-1 text-[13px] leading-snug', i === 0 ? 'font-bold' : 'font-medium')}
                        style={{ color: i === 0 ? VOCA_COLORS.ink : VOCA_COLORS.gray, wordBreak: 'keep-all' }}
                      >
                        {shortBookTitle(title)}
                      </span>
                      {isRecommended && (
                        <span
                          className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold text-white"
                          style={{ background: accent.deep }}
                        >
                          추천
                        </span>
                      )}
                    </Link>
                  );
                })}

                {/*
                  우리 교재(초등 800·교과서 단어) — 칸의 수준을 가늠하는 자리지만 라벨은 붙이지 않는다
                  ("기준점 · 이 칸 수준"이 어색하다는 사장님 지적, 2026-08-12).
                  맨 아래에 "○○ 외우기"라는 행동 문구로만 둔다.
                */}
                {anchors.length > 0 && (
                  <div className="bg-gray-50/60">
                    {anchors.map((title) => (
                      <Link
                        key={title}
                        href={bookHref(title)}
                        onClick={() => track('diagnostic_lineup_book_click', { title, recommended: false, anchor: true })}
                        className="block border-t border-gray-100 px-3.5 py-2 text-[12px] font-medium leading-snug transition-colors hover:bg-gray-100"
                        style={{ color: VOCA_COLORS.gray, wordBreak: 'keep-all' }}
                      >
                        {shortBookTitle(title)} 외우기
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
