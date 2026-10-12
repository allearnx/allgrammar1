'use client';

/**
 * 어휘 레벨 진단 — 학년 선택 → 스테어케이스 라운드(10문항) → 결과.
 * 문항별 정오는 진행 중 보여주지 않는다 (레벨테스트 관행 + 다음 라운드 힌트 방지).
 * 진행 상태는 _components/use-diagnostic-flow.ts, 각 화면은 _components/*.
 */

import { VOCA_COLORS } from '@/lib/voca/brand-tokens';
import type { BandKey } from '@/lib/voca/diagnostic-bands';
import { ContactGateScreen } from './_components/contact-gate-screen';
import { EmptyState } from './_components/empty-state';
import { IntroScreen } from './_components/intro-screen';
import { QuizScreen } from './_components/quiz-screen';
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
    return (
      <QuizScreen
        band={phase.band}
        questions={phase.questions}
        index={phase.index}
        roundNumber={completedRounds.length + 1}
        typedInput={typedInput}
        onTypedInputChange={setTypedInput}
        onAnswer={handleAnswer}
      />
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
