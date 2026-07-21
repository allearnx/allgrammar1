'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { shuffle } from '@/lib/utils';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import { VOCA_VOCABULARY_COLUMNS, type VocaDay } from '@/types/voca';
import { VOCA_COLORS } from '@/components/voca/voca-brand';
import { DEFAULT_EXAM_INTENSITY, type ExamIntensity } from '@/lib/voca/exam-intensity';
import {
  buildRound2ExamQuestions,
  isRelatedCorrect,
  type Round2ExamQuestion,
  type Round2Vocab,
} from '@/lib/voca/round2-exam';

const MAX_DAYS = 3;
const RELATION_LABEL = { synonym: '유의어', antonym: '반의어' } as const;

/** 2회독 표제어 시험 — 유의어·반의어 (스펠링 + 4지선다 혼합) */
export function Round2SynAntExam({
  days,
  bookId,
  intensity = DEFAULT_EXAM_INTENSITY,
  assignment,
  onDone,
}: {
  days: VocaDay[];
  bookId: string;
  intensity?: ExamIntensity;
  /** 선생님 배정 시험이면 지정 — Day 선택 스킵하고 바로 응시, 결과에 연결 */
  assignment?: { id: string; dayIds: string[]; title: string };
  onDone?: () => void;
}) {
  const PASS = intensity.passScore;
  const [selected, setSelected] = useState<string[]>(assignment?.dayIds ?? []);
  const [mode, setMode] = useState<'idle' | 'loading' | 'exam' | 'done'>('idle');
  const retryModeRef = useRef(false);
  const [questions, setQuestions] = useState<Round2ExamQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState('');
  const [graded, setGraded] = useState<null | boolean>(null);
  const correctRef = useRef(0);
  const wrongRef = useRef<Round2ExamQuestion[]>([]);
  const [score, setScore] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= MAX_DAYS ? prev : [...prev, id],
    );
  }

  async function start(retryOnly = false) {
    const dayIds = assignment?.dayIds ?? selected;
    if (!retryOnly && dayIds.length === 0) return;
    retryModeRef.current = retryOnly;
    setMode('loading');
    try {
      let qs: Round2ExamQuestion[];
      if (retryOnly) {
        qs = shuffle([...wrongRef.current]);
      } else {
        const { createClient } = await import('@/lib/supabase/client');
        const sb = createClient();
        const { data } = await sb
          .from('voca_vocabulary')
          .select(VOCA_VOCABULARY_COLUMNS)
          .in('day_id', dayIds)
          .order('sort_order');
        const vocab = (data as Round2Vocab[] | null) ?? [];
        // 표제어 수의 1.5배로 문항 — 유의어·반의어를 골라 난이도 조절 (없으면 있는 만큼)
        const total = Math.max(1, Math.round(vocab.length * 1.5));
        qs = buildRound2ExamQuestions(vocab, { totalCount: total, choiceRatio: 0.5 });
      }
      if (qs.length === 0) {
        toast.error('선택한 Day에 유의어·반의어 데이터가 없어요.');
        setMode('idle');
        return;
      }
      correctRef.current = 0;
      wrongRef.current = [];
      setIndex(0);
      setInput('');
      setGraded(null);
      setQuestions(qs);
      setMode('exam');
    } catch {
      toast.error('시험을 불러오지 못했어요. 다시 시도해주세요.');
      setMode('idle');
    }
  }

  // 배정 시험이면 Day 선택 없이 바로 시작
  useEffect(() => {
    if (assignment && mode === 'idle') start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const q = questions[index];

  const grade = useCallback((answer: string | null) => {
    if (graded !== null) return;
    const ok = answer !== null && isRelatedCorrect(answer, q.answers);
    setGraded(ok);
    if (ok) correctRef.current += 1;
    else wrongRef.current.push(q);
  }, [graded, q]);

  function next() {
    if (index + 1 < questions.length) {
      setIndex((i) => i + 1);
      setInput('');
      setGraded(null);
    } else {
      const s = Math.round((correctRef.current / questions.length) * 100);
      setScore(s);
      setMode('done');
      if (s >= PASS) toast.success(`🎉 통과! ${s}점`);
      // 재시험(틀린 것만)은 복습용 — 저장 안 함. 정식 응시만 서버 기록.
      if (!retryModeRef.current) {
        fetchWithToast('/api/voca/exam', {
          body: {
            bookId,
            dayIds: assignment?.dayIds ?? selected,
            score: s,
            wrongWords: wrongRef.current.map((w) => ({ front_text: w.prompt, back_text: w.promptKo })),
            assignmentId: assignment?.id ?? null,
            examType: 'syn_ant',
          },
          retry: 2,
          errorMessage: '⚠️ 시험 결과 저장에 실패했어요 — 점수가 기록되지 않았습니다.',
        }).then(() => onDone?.()).catch(() => { /* toasted */ });
      }
    }
  }

  // 단어당 제한시간 — 만료 시 현재 입력으로 강제 채점
  useEffect(() => {
    if (mode !== 'exam' || intensity.secondsPerWord <= 0 || graded !== null) {
      setTimeLeft(null);
      return;
    }
    setTimeLeft(intensity.secondsPerWord);
    const iv = setInterval(() => {
      setTimeLeft((t) => {
        if (t === null) return null;
        if (t <= 1) { clearInterval(iv); grade(input || null); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, mode, graded, intensity.secondsPerWord]);

  // 자율 모드에서 Day가 없으면 렌더 안 함 (hook 전부 호출 후 — rules-of-hooks)
  if (!assignment && days.length === 0) return null;

  // ── 시험 진행 ──
  if (mode === 'exam' && q) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>{index + 1} / {questions.length}</span>
          {timeLeft !== null && (
            <span className={timeLeft <= 3 ? 'font-bold text-red-500' : 'font-bold text-gray-500'}>⏱ {timeLeft}초</span>
          )}
        </div>

        <div className="rounded-2xl border bg-white p-5 text-center">
          <p className="text-xs font-bold" style={{ color: VOCA_COLORS.blueDark }}>
            {q.prompt} <span className="text-gray-400">({q.promptKo})</span> 의 {RELATION_LABEL[q.relation]}는?
          </p>

          {q.format === 'choice' ? (
            <div className="mt-4 space-y-2">
              {q.options!.map((opt) => {
                const isAns = isRelatedCorrect(opt, q.answers);
                const show = graded !== null;
                return (
                  <button
                    key={opt}
                    disabled={show}
                    onClick={() => grade(opt)}
                    className={`flex w-full items-center rounded-2xl border-2 px-4 py-3 text-left text-lg font-medium transition-all ${
                      show && isAns
                        ? 'border-green-400 bg-green-50 text-green-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          ) : (
            <form
              className="mt-4"
              onSubmit={(e) => { e.preventDefault(); if (graded === null) grade(input.trim() || null); }}
            >
              <input
                autoFocus
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={graded !== null}
                placeholder="영어로 입력"
                className="w-full rounded-2xl border-2 border-gray-200 px-4 py-3 text-center text-lg outline-none focus:border-[#1A73E8]"
              />
            </form>
          )}

          {graded !== null && (
            <div className="mt-3 text-sm">
              {graded ? (
                <p className="font-bold text-green-600">정답! 🎉</p>
              ) : (
                <p className="text-gray-600">정답: <b>{q.answers.join(' / ')}</b></p>
              )}
            </div>
          )}
        </div>

        {graded === null && q.format === 'spelling' ? (
          <button
            onClick={() => grade(input.trim() || null)}
            className="w-full rounded-full py-3 text-sm font-bold text-white hover:opacity-90"
            style={{ background: VOCA_COLORS.blue }}
          >
            제출
          </button>
        ) : graded !== null ? (
          <button onClick={next} className="w-full rounded-full py-3 text-sm font-bold text-white hover:opacity-90" style={{ background: VOCA_COLORS.blue }}>
            {index + 1 < questions.length ? '다음' : '결과 보기'}
          </button>
        ) : null}
      </div>
    );
  }

  // ── 결과 ──
  if (mode === 'done') {
    const passed = (score ?? 0) >= PASS;
    return (
      <div className="rounded-3xl p-6 text-center space-y-3" style={{ background: VOCA_COLORS.blueLight }}>
        <p className="text-4xl">{passed ? '🎉' : '💪'}</p>
        <p className="voca-display text-2xl text-gray-800" style={{ fontWeight: 700 }}>{score}점</p>
        <p className="text-sm text-gray-500">{passed ? '2회독 시험 통과!' : `${PASS}점 넘으면 통과예요.`}</p>
        <div className="flex flex-wrap justify-center gap-2 pt-1">
          {!passed && intensity.retryWrong && wrongRef.current.length > 0 && (
            <button onClick={() => start(true)} className="rounded-full px-5 py-2.5 text-sm font-bold text-white hover:opacity-90" style={{ background: VOCA_COLORS.blue }}>
              🔁 틀린 {wrongRef.current.length}개만 다시
            </button>
          )}
          <button onClick={() => { setScore(null); if (assignment) onDone?.(); else setMode('idle'); }} className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50">
            닫기
          </button>
        </div>
      </div>
    );
  }

  // 배정 시험은 Day 선택 화면 없이 로딩 → 시험 (mount 시 자동 start)
  if (assignment) {
    return <div className="py-8 text-center text-sm text-gray-400">시험을 불러오는 중…</div>;
  }

  // ── Day 선택 ──
  return (
    <div className="rounded-3xl border-2 border-dashed p-4 space-y-3" style={{ borderColor: '#AECBFA', background: `${VOCA_COLORS.blueLight}80` }}>
      <div>
        <p className="voca-display" style={{ color: VOCA_COLORS.blueDark, fontWeight: 700 }}>🧠 2회독: 유의어·반의어 시험</p>
        <p className="mt-0.5 text-xs" style={{ color: VOCA_COLORS.blue }}>
          2회독에서 배운 유의어·반의어를 스펠링·객관식으로! Day 최대 {MAX_DAYS}개 ({PASS}점 통과)
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {days.map((d) => {
          const on = selected.includes(d.id);
          const disabled = !on && selected.length >= MAX_DAYS;
          return (
            <button
              key={d.id}
              onClick={() => toggle(d.id)}
              disabled={disabled}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
                on ? 'bg-[#1A73E8] text-white' : disabled ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'bg-white text-[#174EA6] border border-[#AECBFA] hover:bg-[#E8F0FE]'
              }`}
            >
              {d.title}
            </button>
          );
        })}
      </div>
      <button
        onClick={() => start(false)}
        disabled={selected.length === 0 || mode === 'loading'}
        className="w-full rounded-full py-3 text-sm font-bold text-white transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
        style={{ background: selected.length === 0 || mode === 'loading' ? undefined : VOCA_COLORS.blue }}
      >
        {mode === 'loading' ? '불러오는 중...' : selected.length === 0 ? 'Day를 선택하세요' : `${selected.length}개 Day 시험 보기 →`}
      </button>
    </div>
  );
}
