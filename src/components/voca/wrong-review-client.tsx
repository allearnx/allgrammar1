'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Swords, Trophy, PartyPopper } from 'lucide-react';
import { cn, shuffle, blankOutWordExact } from '@/lib/utils';
import { hasMeaningOverlap } from '@/lib/voca/meaning-overlap';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { VocaBrandStyle, VocaHeroLetters, VOCA_COLORS } from '@/components/voca/voca-brand';
import '@/components/voca/neon/neon-styles.css';

interface WordItem {
  front_text: string;
  back_text: string;
}

interface ReviewData {
  words: WordItem[];
  progress: Record<string, number>;
  completedAt: string | null;
  weekLabel: string;
  weekStart: string;
  distractorPool: string[];
  wordDistractorPool: string[];
  /** 뜻 겹침 필터용 단어→뜻 쌍 (Day 단어 풀) */
  poolWords?: WordItem[];
  exampleMap: Record<string, string>;
  examSourceMap: Record<string, string>;
  coverageDelta: { bookTitle: string; now: number; after: number } | null;
}

const GRADUATE_THRESHOLD = 3;
const AUTO_SAVE_INTERVAL = 5;

export function WrongReviewClient() {
  const [data, setData] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'list' | 'quiz'>('list');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchWithToast<ReviewData>('/api/voca/wrong-review', {
        method: 'GET',
        silent: true,
      });
      setData(res);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (data.words.length === 0) {
    return <EmptyState weekLabel={data.weekLabel} />;
  }

  if (mode === 'quiz') {
    return (
      <ConquestMode
        data={data}
        onBack={() => {
          fetchData();
          setMode('list');
        }}
      />
    );
  }

  return (
    <ListView
      data={data}
      onStart={() => setMode('quiz')}
    />
  );
}

// ──────────── Empty State ────────────

function EmptyState({ weekLabel }: { weekLabel: string }) {
  return (
    <div className="relative overflow-hidden rounded-3xl p-10 md:p-14 text-center" style={{ background: VOCA_COLORS.sky }}>
      <VocaBrandStyle />
      <VocaHeroLetters />
      <div className="relative z-10 flex flex-col items-center">
        <Trophy className="mb-4 h-12 w-12" style={{ color: VOCA_COLORS.yellowDark }} />
        <p className="voca-display text-2xl" style={{ color: VOCA_COLORS.ink, fontWeight: 700 }}>
          최근 3주 오답이 없어요<span style={{ color: VOCA_COLORS.blue }}>!</span>
        </p>
        <p className="mt-2 text-sm" style={{ color: VOCA_COLORS.gray }}>{weekLabel}</p>
      </div>
    </div>
  );
}

// ──────────── List View ────────────

function ListView({ data, onStart }: { data: ReviewData; onStart: () => void }) {
  const { words, progress, completedAt, weekLabel } = data;
  const graduated = words.filter((w) => (progress[w.front_text.toLowerCase()] ?? 0) >= GRADUATE_THRESHOLD).length;
  const remaining = words.length - graduated;

  return (
    <div className="space-y-6 pb-8">
      <VocaBrandStyle />

      {/* Hero — /allkill 톤: 파스텔 하늘 + 알파벳 카펫 + GmarketSans */}
      <div className="relative overflow-hidden rounded-3xl p-6 md:p-8" style={{ background: VOCA_COLORS.sky }}>
        <VocaHeroLetters />
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <p className="voca-display text-xs font-bold tracking-widest uppercase" style={{ color: VOCA_COLORS.blueDark }}>AllKill 오답</p>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/70 text-gray-500">{weekLabel}</span>
          </div>
          <h1 className="voca-display text-2xl md:text-3xl leading-tight" style={{ color: VOCA_COLORS.ink, fontWeight: 700, wordBreak: 'keep-all' }}>
            이번 주 오답, 전부 정복<span style={{ color: VOCA_COLORS.blue }}>.</span>
          </h1>
          {words.length > 0 && (
            <div className="flex items-center gap-3 mt-4">
              <div className="flex-1 h-2 rounded-full bg-white overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${(graduated / words.length) * 100}%` }}
                />
              </div>
              <span className="text-sm font-bold tabular-nums" style={{ color: VOCA_COLORS.blueDark }}>
                {graduated}/{words.length}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Stats — 구글 4색 숫자 밴드 */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="총 오답" value={words.length} color={VOCA_COLORS.blue} />
        <StatCard label="정복" value={graduated} color={VOCA_COLORS.green} />
        <StatCard label="남은" value={remaining} color={VOCA_COLORS.red} />
      </div>

      {/* 오답 = 커버리지 올리는 지름길 (부족함이 아니라 기회로 프레이밍) */}
      {data.coverageDelta && (
        <div className="rounded-3xl border border-white bg-white p-5 shadow-sm">
          <p className="text-sm font-bold text-gray-800">
            🎯 이 단어들을 정복하면 <span style={{ color: VOCA_COLORS.blue }}>{data.coverageDelta.bookTitle}</span> 커버리지가
          </p>
          <p className="voca-display mt-1 text-xl tabular-nums" style={{ color: VOCA_COLORS.blue, fontWeight: 700 }}>
            {data.coverageDelta.now}% → {data.coverageDelta.after}%
          </p>
          <p className="mt-1 text-[11px] text-gray-500">오답 복습이 시험 점수로 가는 가장 빠른 길이에요</p>
        </div>
      )}

      {completedAt ? (
        <div className="flex items-center gap-3 rounded-3xl p-5" style={{ background: VOCA_COLORS.greenLight }}>
          <PartyPopper className="h-8 w-8" style={{ color: VOCA_COLORS.green }} />
          <div>
            <p className="voca-display font-bold" style={{ color: VOCA_COLORS.greenDark }}>올킬 완료!</p>
            <p className="text-sm" style={{ color: VOCA_COLORS.green }}>이번 주 오답을 모두 정복했습니다</p>
          </div>
        </div>
      ) : (
        <button
          onClick={onStart}
          className="voca-cta voca-display flex w-full items-center justify-center gap-2 rounded-full py-4 text-lg"
          style={{ fontWeight: 700 }}
        >
          <Swords className="h-5 w-5" />
          {graduated > 0 ? '이어서 정복하기' : '정복 시작'}
        </button>
      )}

      {/* Word list preview */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">오답 단어 목록</p>
        <div className="flex flex-wrap gap-2">
          {words.map((w) => {
            const count = progress[w.front_text.toLowerCase()] ?? 0;
            const isGraduated = count >= GRADUATE_THRESHOLD;
            return (
              <span
                key={w.front_text}
                className={cn(
                  'rounded-full px-3 py-1 text-sm',
                  isGraduated
                    ? 'bg-green-100 text-green-700 line-through'
                    : 'bg-muted text-foreground',
                )}
              >
                {w.front_text}
                {count > 0 && !isGraduated && (
                  <span className="ml-1 text-xs text-muted-foreground">({count}/3)</span>
                )}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-3xl border border-white bg-white py-4 text-center shadow-sm">
      <p className="voca-display text-2xl tabular-nums" style={{ color, fontWeight: 700 }}>{value}</p>
      <p className="mt-0.5 text-xs font-medium text-gray-400">{label}</p>
    </div>
  );
}

// ──────────── Conquest Mode (MCQ) ────────────

interface QuizQuestion {
  word: string;
  /** meaning: 뜻 고르기 / context: 문장 빈칸에 알맞은 단어 고르기 (마지막 관문) */
  type: 'meaning' | 'context';
  prompt: string; // meaning: 영단어 / context: 빈칸 문장
  options: string[];
  correctIndex: number;
}

function ConquestMode({ data, onBack }: { data: ReviewData; onBack: () => void }) {
  const { words, distractorPool, wordDistractorPool, poolWords, exampleMap, examSourceMap } = data;
  const [progress, setProgress] = useState<Record<string, number>>({ ...data.progress });
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [allDone, setAllDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveCountRef = useRef(0);

  // Build active (non-graduated) word list
  const activeWords = useMemo(
    () => words.filter((w) => (progress[w.front_text.toLowerCase()] ?? 0) < GRADUATE_THRESHOLD),
    // Only recompute when a word graduates (progress keys reaching 3)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [words, Object.values(progress).filter((v) => v >= GRADUATE_THRESHOLD).length],
  );

  // 출제 순서만 셔플로 고정하고, 문제 내용은 (단어 × 현재 스트릭)으로 동적 생성
  const questionOrder = useMemo(() => shuffle([...activeWords]), [activeWords]);
  const currentWord = questionOrder[questionIndex] || questionOrder[0];

  const question: QuizQuestion | undefined = useMemo(() => {
    if (!currentWord) return undefined;
    const key = currentWord.front_text.toLowerCase();
    const streak = progress[key] ?? 0;

    // 마지막 관문(3번째): 문장 빈칸에 알맞은 단어 고르기 — 예문이 있고
    // 표제어가 문장에 실제로 등장할 때만 (활용형/예문 없음 → 뜻 고르기 폴백)
    const example = exampleMap[key];
    const blanked = example ? blankOutWordExact(example, currentWord.front_text) : null;
    const contextReady = !!blanked && blanked !== example;

    if (streak === GRADUATE_THRESHOLD - 1 && contextReady) {
      const seen = new Set([key]);
      const wordChoices: string[] = [];
      // 보기: 같은 오답 풀 단어 우선, 부족하면 해당 Day들의 단어로 채움 (총 5지)
      // 정답과 뜻이 겹치는 유의어(nurture↔bring up 등)는 빈칸에 똑같이 들어맞아
      // 정답이 두 개가 되므로 제외
      for (const w of shuffle(words)) {
        if (wordChoices.length >= 4) break;
        const k = w.front_text.toLowerCase();
        if (seen.has(k) || hasMeaningOverlap(currentWord.back_text, w.back_text)) continue;
        seen.add(k);
        wordChoices.push(w.front_text);
      }
      const dayPool: { front_text: string; back_text: string | null }[] = poolWords?.length
        ? poolWords
        : wordDistractorPool.map((w) => ({ front_text: w, back_text: null }));
      for (const w of shuffle(dayPool)) {
        if (wordChoices.length >= 4) break;
        const k = w.front_text.toLowerCase();
        if (seen.has(k)) continue;
        if (w.back_text && hasMeaningOverlap(currentWord.back_text, w.back_text)) continue;
        seen.add(k);
        wordChoices.push(w.front_text);
      }
      const options = shuffle([currentWord.front_text, ...wordChoices]);
      return {
        word: currentWord.front_text,
        type: 'context',
        prompt: blanked!,
        options,
        correctIndex: options.indexOf(currentWord.front_text),
      };
    }

    // 기본: 뜻 고르기 (4지) — 정답과 뜻이 겹치는 보기(유의어 뜻)는 제외
    const allBackTexts = new Set(distractorPool);
    words.forEach((w) => allBackTexts.add(w.back_text));
    const others = [...allBackTexts].filter(
      (t) => t !== currentWord.back_text && !hasMeaningOverlap(currentWord.back_text, t),
    );
    const distractors = shuffle(others).slice(0, 3);
    const options = shuffle([currentWord.back_text, ...distractors]);
    return {
      word: currentWord.front_text,
      type: 'meaning',
      prompt: currentWord.front_text,
      options,
      correctIndex: options.indexOf(currentWord.back_text),
    };
    // 스트릭이 바뀌면(정답/오답 후) 다음 렌더에서 형식이 갱신되도록 progress 의존
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWord, questionIndex, progress[currentWord?.front_text.toLowerCase() ?? ''] ?? 0]);
  const totalActive = activeWords.length;
  const totalGraduated = words.length - totalActive;

  // Save progress to server
  const saveProgress = useCallback(async (p: Record<string, number>) => {
    await fetchWithToast('/api/voca/wrong-review', {
      method: 'PATCH',
      body: { progress: p },
      silent: true,
    }).catch(() => {});
  }, []);

  // Cleanup timer
  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const handleSelect = useCallback((optionIndex: number) => {
    if (answered || !question) return;
    setSelectedIndex(optionIndex);
    setAnswered(true);

    const key = question.word.toLowerCase();
    const isCorrect = optionIndex === question.correctIndex;

    setProgress((prev) => {
      const current = prev[key] ?? 0;
      const next = isCorrect ? current + 1 : 0;
      const updated = { ...prev, [key]: next };

      // Auto-save every N answers
      saveCountRef.current += 1;
      if (saveCountRef.current % AUTO_SAVE_INTERVAL === 0) {
        saveProgress(updated);
      }

      return updated;
    });

    timerRef.current = setTimeout(() => {
      setSelectedIndex(null);
      setAnswered(false);

      // Check if this word graduated
      setProgress((latest) => {
        const newActiveCount = words.filter(
          (w) => (latest[w.front_text.toLowerCase()] ?? 0) < GRADUATE_THRESHOLD,
        ).length;

        if (newActiveCount === 0) {
          // All done!
          saveProgress(latest);
          setAllDone(true);
          return latest;
        }

        // Move to next question (or wrap)
        setQuestionIndex((prev) => {
          // Questions array may have changed length due to graduation
          const maxIdx = newActiveCount - 1;
          return prev >= maxIdx ? 0 : prev + 1;
        });

        return latest;
      });
    }, 1000);
  }, [answered, question, words, saveProgress]);

  // All done overlay
  if (allDone) {
    return (
      <div className="relative overflow-hidden rounded-3xl min-h-[60dvh] flex flex-col items-center justify-center space-y-4 p-8" style={{ background: VOCA_COLORS.sky }}>
        <VocaBrandStyle />
        <VocaHeroLetters />
        <div className="relative z-10 flex flex-col items-center space-y-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          >
            <PartyPopper className="h-20 w-20" style={{ color: VOCA_COLORS.yellowDark }} />
          </motion.div>
          <h2 className="voca-display text-3xl" style={{ color: VOCA_COLORS.ink, fontWeight: 700 }}>
            올킬 완료<span style={{ color: VOCA_COLORS.blue }}>!</span>
          </h2>
          <p style={{ color: VOCA_COLORS.gray }}>
            {words.length}개 오답을 모두 정복했습니다
          </p>
          <button onClick={onBack} className="voca-cta voca-display rounded-full px-8 py-3 text-base" style={{ fontWeight: 700 }}>
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const currentConsecutive = progress[question.word.toLowerCase()] ?? 0;

  return (
    <div className="min-h-[60dvh] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="sm" onClick={() => { saveProgress(progress); onBack(); }}>
          ← 돌아가기
        </Button>
        <span className="text-sm text-muted-foreground">
          남은 {totalActive}개 · 정복 {totalGraduated}/{words.length}
        </span>
      </div>

      <Progress value={(totalGraduated / words.length) * 100} className="h-2 mb-6" />

      {/* Quiz card */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${question.word}-${questionIndex}-${question.type}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-md space-y-6"
          >
            {/* Streak dots */}
            <div className="flex items-center justify-center gap-1.5">
              {Array.from({ length: GRADUATE_THRESHOLD }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'h-2.5 w-2.5 rounded-full transition-colors',
                    i < currentConsecutive ? 'bg-green-500' : 'bg-gray-200',
                  )}
                />
              ))}
              <span className="ml-2 text-xs text-muted-foreground">
                {currentConsecutive}/{GRADUATE_THRESHOLD}
              </span>
            </div>

            {/* Prompt: 뜻 고르기=단어 / 졸업 문제=빈칸 문장 */}
            {question.type === 'context' ? (
              <div className="space-y-2">
                <p className="text-center text-xs font-bold text-[#1A73E8]">
                  🔥 졸업 문제 — 빈칸에 알맞은 단어는?
                </p>
                <p className="text-xl font-medium text-center leading-relaxed">{question.prompt}</p>
                {examSourceMap[question.word.toLowerCase()] && (
                  <p className="text-center">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#E8F0FE] px-2.5 py-0.5 text-[11px] font-bold text-[#1A73E8]">
                      📄 {examSourceMap[question.word.toLowerCase()]} 기출 문장
                    </span>
                  </p>
                )}
              </div>
            ) : (
              <p className="text-4xl font-bold text-center">{question.word}</p>
            )}

            {/* Options */}
            <div className="space-y-3">
              {question.options.map((option, i) => {
                const isSelected = selectedIndex === i;
                const isCorrectOption = i === question.correctIndex;
                const showCorrect = answered && isCorrectOption;
                const showWrong = answered && isSelected && !isCorrectOption;

                return (
                  <button
                    key={i}
                    onClick={() => handleSelect(i)}
                    disabled={answered}
                    className={cn(
                      'w-full py-4 px-5 rounded-xl border-2 text-left text-lg font-medium transition-all',
                      !answered && 'border-gray-200 text-gray-700 hover:border-brand-300 hover:bg-brand-50/50 active:bg-brand-50',
                      showCorrect && 'border-green-500 bg-green-50 text-green-700',
                      showWrong && 'border-red-500 bg-red-50 text-red-600 wrong-shake',
                      answered && !showCorrect && !showWrong && 'border-gray-100 text-gray-300',
                    )}
                  >
                    <span className="mr-3 text-sm opacity-40">{i + 1}</span>
                    {option}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
