'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn, shuffle, blankOutWordExact } from '@/lib/utils';
import { Volume2, Delete } from 'lucide-react';
import { useAudioPlayer } from './audio-player-hook';
import { NeonResultScreen } from './neon-result-screen';
import type { VocaVocabulary } from '@/types/voca';
import './neon-styles.css';

const QWERTY_ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
];

/** 알파벳이 아닌 문자(공백, 하이픈 등)인지 */
function isNonLetter(ch: string) {
  return !/[a-zA-Z]/.test(ch);
}

interface SpellingWrongWord {
  front_text: string;
  back_text: string;
}

interface RhythmSpellingProps {
  vocabulary: VocaVocabulary[];
  onComplete: (score: number, wrongWords: SpellingWrongWord[]) => void;
  /** 시험 모드 — 발음 힌트(스피커) 숨김 */
  examMode?: boolean;
  /** 통과 점수(%) — 미지정 시 학습 기본 80. 표제어 시험은 학생 강도에 따라 70~100 */
  passThreshold?: number;
  /** 단어당 제한시간(초). 0/미지정 = 무제한. examMode에서만 동작 */
  secondsPerWord?: number;
  /**
   * 진행 자동 저장 컨텍스트 (예: `day:{dayId}`, `bonus:{bookId}:{dayIds}`).
   * 지정하면 단어를 채점할 때마다 계정별 localStorage에 체크포인트를 남겨,
   * 소리 문제 등으로 새로고침/재로그인해도 보던 단어부터 이어간다 (2026-07-19 고객 컴플레인).
   */
  storageContext?: string;
}

interface SavedProgress {
  v: 1;
  ids: string[]; // 셔플된 출제 순서
  index: number;
  results: WordResult[];
  wrongWords: SpellingWrongWord[];
  savedAt: number;
}

const RESUME_TTL_MS = 24 * 60 * 60 * 1000; // 하루 지난 체크포인트는 무시

interface WordResult {
  firstTryCorrect: number;
  totalLetters: number;
}

type LetterState = 'typed' | 'auto' | 'correct' | 'wrong';

const PASS_THRESHOLD = 80;

export function RhythmSpelling({ vocabulary, onComplete, examMode = false, passThreshold = PASS_THRESHOLD, secondsPerWord = 0, storageContext }: RhythmSpellingProps) {
  // ⚠️ useMemo([vocabulary])로 만들면 리렌더로 배열 참조가 바뀔 때 시험 도중
  // 출제 순서가 재셔플된다(푼 단어 반복 + 안 푼 단어 누락). 마운트 시 1회만 생성.
  const [shuffledVocab, setShuffledVocab] = useState(() => shuffle([...vocabulary]));
  const [currentIndex, setCurrentIndex] = useState(0);
  // 계정별 체크포인트 키 — 공용 브라우저에서 다른 학생 진행과 섞이지 않게 uid 포함
  const storageKeyRef = useRef<string | null>(null);
  const startedRef = useRef(false);
  const [typedLetters, setTypedLetters] = useState<string[]>([]);
  const [letterStates, setLetterStates] = useState<LetterState[]>([]);
  // 채점 완료 후 정답 노출 중 (입력 잠금) — false면 자유 입력 중
  const [graded, setGraded] = useState(false);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [wrongFlash, setWrongFlash] = useState(false);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resultsRef = useRef<WordResult[]>([]);
  const wrongWordsRef = useRef<SpellingWrongWord[]>([]);

  // 체크포인트 복원 — 마운트 직후, 사용자가 입력을 시작하기 전에만
  useEffect(() => {
    if (!storageContext) return;
    let cancelled = false;
    (async () => {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const { data } = await createClient().auth.getUser();
        if (cancelled || !data.user) return;
        const key = `voca-spell:${data.user.id}:${storageContext}`;
        storageKeyRef.current = key;
        if (startedRef.current) return; // 이미 입력 시작 — 진행을 덮어쓰지 않음
        const raw = window.localStorage.getItem(key);
        if (!raw) return;
        const saved = JSON.parse(raw) as SavedProgress;
        if (saved.v !== 1 || Date.now() - saved.savedAt > RESUME_TTL_MS) return;
        const byId = new Map(vocabulary.map((v) => [v.id, v]));
        if (saved.ids.length !== vocabulary.length || !saved.ids.every((id) => byId.has(id))) return;
        if (saved.index <= 0 || saved.index >= saved.ids.length) return;
        setShuffledVocab(saved.ids.map((id) => byId.get(id)!));
        setCurrentIndex(saved.index);
        resultsRef.current = saved.results;
        wrongWordsRef.current = saved.wrongWords;
        toast.info(`이어서 진행해요 — ${saved.index + 1}번째 단어부터`, { duration: 4000 });
      } catch { /* 복원 실패 시 처음부터 진행 */ }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageContext]);

  const saveCheckpoint = useCallback((nextIndex: number) => {
    const key = storageKeyRef.current;
    if (!key) return;
    try {
      const payload: SavedProgress = {
        v: 1,
        ids: shuffledVocab.map((v) => v.id),
        index: nextIndex,
        results: resultsRef.current,
        wrongWords: wrongWordsRef.current,
        savedAt: Date.now(),
      };
      window.localStorage.setItem(key, JSON.stringify(payload));
    } catch { /* 저장 실패는 조용히 무시 */ }
  }, [shuffledVocab]);

  const clearCheckpoint = useCallback(() => {
    try {
      if (storageKeyRef.current) window.localStorage.removeItem(storageKeyRef.current);
    } catch { /* noop */ }
  }, []);

  const vocab = shuffledVocab[currentIndex];
  const targetWord = vocab.front_text.trim().toLowerCase();
  const currentLetterIdx = typedLetters.length;
  const isFull = currentLetterIdx >= targetWord.length;

  // 알파벳 글자만 카운트 (채점용)
  const letterCount = targetWord.split('').filter((ch) => !isNonLetter(ch)).length;

  const { play, isPlaying } = useAudioPlayer({
    audioUrl: vocab.audio_url,
    wordTimestamps: vocab.word_timestamps,
  });

  // 예문은 그대로 보여준다 (froze↔freeze 같은 불규칙 활용형이 예문에 있어도 OK —
  // 답은 표제어로 쓰면 되므로). 표제어가 예문에 있으면 빈칸 처리된다.
  const sentenceWithBlank = vocab.example_sentence
    ? blankOutWordExact(vocab.example_sentence, vocab.front_text)
    : null;

  /** 현재 위치부터 연속된 비알파벳 문자를 자동 채움 */
  const autoFillNonLetters = useCallback((fromIdx: number, letters: string[], states: LetterState[]) => {
    let idx = fromIdx;
    const newLetters = [...letters];
    const newStates = [...states];
    while (idx < targetWord.length && isNonLetter(targetWord[idx])) {
      newLetters.push(targetWord[idx]);
      newStates.push('auto');
      idx++;
    }
    return { newLetters, newStates };
  }, [targetWord]);

  /** 다 채운 답안을 채점 — 틀린 칸 빨간 표시 후 다음 단어로 */
  const gradeWord = useCallback(() => {
    let wrongCount = 0;
    const gradedStates: LetterState[] = targetWord.split('').map((ch, i) => {
      if (isNonLetter(ch)) return 'auto';
      if (typedLetters[i] === ch) return 'correct';
      wrongCount++;
      return 'wrong';
    });
    setLetterStates(gradedStates);
    setGraded(true);

    const hadWrong = wrongCount > 0;
    resultsRef.current.push({
      firstTryCorrect: letterCount - wrongCount,
      totalLetters: letterCount,
    });
    if (hadWrong) {
      wrongWordsRef.current.push({
        front_text: shuffledVocab[currentIndex].front_text,
        back_text: shuffledVocab[currentIndex].back_text,
      });
      setWrongFlash(true);
      flashTimerRef.current = setTimeout(() => setWrongFlash(false), 400);
    }

    // 채점 직후 체크포인트 저장 — 대기 시간 중 이탈해도 다음 단어부터 이어간다
    if (currentIndex + 1 < shuffledVocab.length) saveCheckpoint(currentIndex + 1);
    else clearCheckpoint();

    // 틀렸으면 정답을 볼 시간을 조금 더 준다
    advanceTimerRef.current = setTimeout(() => {
      if (currentIndex + 1 < shuffledVocab.length) {
        setCurrentIndex((prev) => prev + 1);
        setTypedLetters([]);
        setLetterStates([]);
        setGraded(false);
      } else {
        const all = resultsRef.current;
        const totalCorrect = all.reduce((s, r) => s + r.firstTryCorrect, 0);
        const totalLetters = all.reduce((s, r) => s + r.totalLetters, 0);
        const score = Math.round((totalCorrect / totalLetters) * 100);
        setFinalScore(score);
        // 통과 시엔 "다음 단계로" 클릭을 기다린 뒤 onComplete 호출.
        // 미달이면 기존처럼 즉시 저장 + 부모의 재도전 안내 토스트가 뜨도록 바로 호출.
        if (score < passThreshold) onComplete(score, wrongWordsRef.current);
      }
    }, hadWrong ? 1800 : 600);
  }, [currentIndex, shuffledVocab, onComplete, letterCount, targetWord, typedLetters, saveCheckpoint, clearCheckpoint, passThreshold]);

  // 최신 gradeWord를 타이머에서 호출하기 위한 ref
  const gradeWordRef = useRef(gradeWord);
  gradeWordRef.current = gradeWord;

  // 단어당 제한시간 (examMode + secondsPerWord>0). 만료 시 현재 입력 상태로 강제 채점.
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  useEffect(() => {
    if (!examMode || secondsPerWord <= 0 || graded || finalScore !== null) {
      setTimeLeft(null);
      return;
    }
    setTimeLeft(secondsPerWord);
    const iv = setInterval(() => {
      setTimeLeft((t) => {
        if (t === null) return null;
        if (t <= 1) {
          clearInterval(iv);
          gradeWordRef.current();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [currentIndex, graded, examMode, secondsPerWord, finalScore]);

  /** 자유 입력 — 어떤 글자든 다음 칸에 채운다 (채점은 다 채운 뒤) */
  const handleKeyPress = useCallback((key: string) => {
    if (graded || isFull) return;
    startedRef.current = true;

    // 현재 위치가 비알파벳이면 자동 채움 후 진행
    let currentTyped = typedLetters;
    let currentStates = letterStates;
    if (isNonLetter(targetWord[currentTyped.length])) {
      const { newLetters, newStates } = autoFillNonLetters(currentTyped.length, [...typedLetters], [...letterStates]);
      currentTyped = newLetters;
      currentStates = newStates;
      if (currentTyped.length >= targetWord.length) {
        setTypedLetters(currentTyped);
        setLetterStates(currentStates);
        return;
      }
    }

    let newLetters = [...currentTyped, key.toLowerCase()];
    let newStates: LetterState[] = [...currentStates, 'typed'];

    // 다음 위치가 비알파벳이면 자동 채움
    const filled = autoFillNonLetters(newLetters.length, newLetters, newStates);
    newLetters = filled.newLetters;
    newStates = filled.newStates;

    setTypedLetters(newLetters);
    setLetterStates(newStates);
  }, [graded, isFull, targetWord, typedLetters, letterStates, autoFillNonLetters]);

  /** 백스페이스 — 자동 채움(구분자)은 건너뛰고 마지막 입력 글자를 지운다 */
  const handleBackspace = useCallback(() => {
    if (graded || typedLetters.length === 0) return;
    let end = typedLetters.length;
    while (end > 0 && letterStates[end - 1] === 'auto') end--;
    if (end === 0) return;
    setTypedLetters(typedLetters.slice(0, end - 1));
    setLetterStates(letterStates.slice(0, end - 1));
  }, [graded, typedLetters, letterStates]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (finalScore !== null) return;
      if (e.isComposing || e.key === 'Process') return; // 한글 IME 조합 중 무시
      if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
        return;
      }
      if (e.key === 'Enter') {
        if (isFull && !graded) {
          e.preventDefault();
          gradeWord();
        }
        return;
      }
      // 물리 키(e.code) 기준으로 판정 — 한글 IME가 켜져 있어도 영문 스펠링 입력 가능.
      // (숨은 입력창에 IME 조합이 들어가면 e.key가 자모/'Process'가 되어 안 먹던 문제 해결)
      const codeMatch = /^Key([A-Z])$/.exec(e.code);
      const letter = codeMatch
        ? codeMatch[1].toLowerCase()
        : /^[a-zA-Z]$/.test(e.key)
          ? e.key.toLowerCase()
          : null;
      if (letter) {
        e.preventDefault();
        handleKeyPress(letter);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleKeyPress, handleBackspace, gradeWord, isFull, graded, finalScore]);

  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    };
  }, []);

  function handleRetry() {
    clearCheckpoint();
    setShuffledVocab(shuffle([...vocabulary]));
    setCurrentIndex(0);
    setTypedLetters([]);
    setLetterStates([]);
    setGraded(false);
    setFinalScore(null);
    resultsRef.current = [];
    wrongWordsRef.current = [];
  }

  const hasWrongCell = graded && letterStates.includes('wrong');

  if (finalScore !== null) {
    return (
      <NeonResultScreen
        score={finalScore}
        passThreshold={passThreshold}
        passMessage="통과!"
        failMessage={`${passThreshold}% 이상 필요합니다`}
        onRetry={handleRetry}
        onContinue={finalScore >= passThreshold ? () => onComplete(finalScore, wrongWordsRef.current) : undefined}
      />
    );
  }

  return (
    <div className="neon-container p-4 md:p-6 min-h-[60dvh] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-400">
          {currentIndex + 1} / {shuffledVocab.length}
        </span>
        {timeLeft !== null && (
          <span
            className={cn(
              'text-sm font-bold tabular-nums transition-colors',
              timeLeft <= 3 ? 'text-red-500' : 'text-gray-500',
            )}
            aria-label={`남은 시간 ${timeLeft}초`}
          >
            ⏱ {timeLeft}초
          </span>
        )}
        {/* 시험 모드에선 발음 힌트(스피커) 숨김 — 순수 철자 시험 */}
        {!examMode && (
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400"
            onClick={() => play(vocab.example_sentence || vocab.front_text)}
            disabled={isPlaying}
          >
            <Volume2 className={cn('h-4 w-4', isPlaying && 'animate-pulse text-brand-500')} />
          </Button>
        )}
      </div>

      {/* 답 형태 안내 — 예문이 활용형(과거형/복수형 등)일 수 있으므로 */}
      <p className="text-xs text-center text-gray-400 mb-2">
        💡 답은 단어의 <span className="font-medium text-gray-500">기본형</span>으로 쓰세요
      </p>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="flex-1 flex flex-col items-center justify-center space-y-6"
        >
          {sentenceWithBlank && (
            <div className="space-y-1.5 text-center px-4">
              <p className="text-xl text-gray-500">{sentenceWithBlank}</p>
              {vocab.exam_source && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#E8F0FE] px-2.5 py-0.5 text-[11px] font-bold text-[#1A73E8]">
                  📄 {vocab.exam_source} 기출 문장
                </span>
              )}
            </div>
          )}

          <p className="voca-display text-lg text-gray-700" style={{ fontWeight: 700 }}>{vocab.back_text}</p>

          <div className={cn('flex gap-1.5 justify-center flex-wrap', wrongFlash && 'wrong-shake')}>
            {targetWord.split('').map((ch, i) => {
              const state = letterStates[i];
              const isNext = !graded && i === currentLetterIdx;
              const isSeparator = isNonLetter(ch);

              if (isSeparator) {
                return (
                  <div
                    key={i}
                    className={cn(
                      'w-4 h-13 md:w-5 md:h-15 flex items-center justify-center text-xl text-gray-300',
                      state === 'auto' && 'text-green-400',
                    )}
                  >
                    {ch === ' ' ? '' : ch}
                  </div>
                );
              }

              return (
                <div
                  key={i}
                  className={cn(
                    'w-10 h-13 md:w-12 md:h-15 rounded-lg border-2 flex items-center justify-center text-xl md:text-2xl font-bold transition-all',
                    state === 'typed' && 'border-brand-400 text-gray-800 bg-white',
                    state === 'correct' && 'border-green-500 text-green-600 bg-green-50 correct-flash',
                    state === 'wrong' && 'border-red-400 text-red-500 bg-red-50',
                    !state && isNext && 'border-brand-400 bg-brand-50/50 guide-glow',
                    !state && !isNext && 'border-gray-200 text-gray-300',
                  )}
                >
                  {typedLetters[i] ?? (isNext ? '_' : '')}
                </div>
              );
            })}
          </div>

          {/* 채점 결과: 틀렸으면 정답 노출 / 다 채우면 채점 버튼 */}
          {hasWrongCell && (
            <p className="text-sm text-gray-500">
              정답: <span className="voca-display text-green-600" style={{ fontWeight: 700 }}>{vocab.front_text}</span>
            </p>
          )}
          {isFull && !graded && (
            <button
              onClick={gradeWord}
              className="voca-cta voca-display rounded-full px-8 py-3 text-base active:scale-[0.98]"
              style={{ fontWeight: 700 }}
            >
              채점하기 (Enter)
            </button>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="mt-auto pt-4 space-y-1.5">
        {QWERTY_ROWS.map((row, ri) => (
          <div key={ri} className="flex justify-center gap-1">
            {ri === 2 && <div className="w-6" />}
            {row.map((key) => (
              <button key={key} className="neon-key flex-1 max-w-[2.5rem]" onClick={() => handleKeyPress(key)}>
                {key}
              </button>
            ))}
            {ri === 2 && (
              <button className="neon-key w-12 flex-none" onClick={handleBackspace} aria-label="지우기">
                <Delete className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
