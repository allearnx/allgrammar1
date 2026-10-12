'use client';

/**
 * 어휘 레벨 진단 — 학년 선택 → 스테어케이스 라운드(10문항) → 결과.
 * 문항별 정오는 진행 중 보여주지 않는다 (레벨테스트 관행 + 다음 라운드 힌트 방지).
 * 진행 상태는 _components/use-diagnostic-flow.ts, 각 화면은 _components/*.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { VOCA_COLORS, VOCA_STEP_THEMES } from '@/lib/voca/brand-tokens';
import { ROUND_SIZE, getBand, type BandKey } from '@/lib/voca/diagnostic-bands';
import { ContactGateScreen } from './_components/contact-gate-screen';
import { EmptyState } from './_components/empty-state';
import { IntroScreen } from './_components/intro-screen';
import { ResultScreen } from './_components/result-screen';
import { useDiagnosticFlow } from './_components/use-diagnostic-flow';
import type { LatestDiagnostic } from './_components/types';

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

export function DiagnosticClient({ activeBands, lineupBookIds, latest, tookToday, prevVocabIds, isFree, mode = 'student' }: Props) {
  const { phase, completedRounds, typedInput, setTypedInput, startDiagnostic, handleAnswer, submitContact } =
    useDiagnosticFlow({ mode, prevVocabIds, tookToday });

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
    return <ContactGateScreen onSubmitContact={submitContact} />;
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
