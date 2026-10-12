'use client';

/**
 * 진단 진행 상태 머신 — 학년 선택 → 스테어케이스 라운드(10문항, 앞 5 + 적응 뒤 5) → 종료/게이트/결과.
 * 화면(diagnostic-client.tsx)은 이 훅이 주는 phase만 보고 그린다.
 * 순수 로직(보관함·안내 문구·게이트 본문)은 pending-diagnostic.ts, 서버 판단은 /api/*\/diagnostic/*.
 */
import { useCallback, useEffect, useState } from 'react';
import { track } from '@vercel/analytics';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import { ROUND_SIZE, type BandKey, type DiagnosticGrade, type FinalLevel } from '@/lib/voca/diagnostic-bands';
import type { DiagnosticQuestion } from '@/lib/voca/diagnostic-sampling';
import type { AnsweredItem, CompletedRound, MissedWord, SubmitResponse } from './types';
import {
  attachPendingLeadId, buildGateBody, roundTransitionMessage, savePendingDiagnostic, takePendingDiagnostic,
} from './pending-diagnostic';

type NextRoundResponse =
  | { done: true }
  | { done?: undefined; band: BandKey; questions: DiagnosticQuestion[] };

export type Phase =
  | { step: 'intro' }
  | { step: 'loading'; band: BandKey | null; message: string }
  | { step: 'quiz'; band: BandKey; questions: DiagnosticQuestion[]; index: number }
  | { step: 'gate' } // public 모드: 다 풀었고, 결과는 연락처/가입 후
  | { step: 'result'; res: SubmitResponse };

export type AnswerInput = { typed?: string | null; chosenIndex?: number | null };

interface Options {
  mode: 'student' | 'public';
  prevVocabIds: string[];
  tookToday: boolean;
}

export function useDiagnosticFlow({ mode, prevVocabIds, tookToday }: Options) {
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
      savePendingDiagnostic(selectedGrade, rounds);
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
          attachPendingLeadId(data.leadId);
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
    async (answer: AnswerInput) => {
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
      setPhase({ step: 'loading', band: data.band, message: roundTransitionMessage(prevBand, data.band) });
      await new Promise((r) => setTimeout(r, 900));
      setCurrentItems([]);
      setPhase({ step: 'quiz', band: data.band, questions: data.questions, index: 0 });
    },
    [phase, busy, currentItems, completedRounds, grade, requestNext, finishRounds],
  );

  /** public 게이트: 학부모 연락처를 받고 결과를 연다 (익명 기록이 있으면 연결, 없으면 라운드 재전송) */
  const submitContact = useCallback(
    async (name: string, phone: string) => {
      const body = buildGateBody({ leadId, grade: grade!, rounds: completedRounds, name, phone });
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
    },
    [leadId, grade, completedRounds],
  );

  // 가입 직후 student 모드 진입: /level-test에서 다 푼 진단이 있으면 자동 제출 → 바로 결과
  useEffect(() => {
    if (mode !== 'student') return;
    const pending = takePendingDiagnostic({ tookToday });
    if (!pending) return;
    setGrade(pending.grade);
    setCompletedRounds(pending.rounds);
    track('diagnostic_pending_submit', { grade: pending.grade });
    submit(pending.rounds, pending.grade, pending.leadId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    phase,
    completedRounds,
    typedInput,
    setTypedInput,
    startDiagnostic,
    handleAnswer,
    submitContact,
  };
}
