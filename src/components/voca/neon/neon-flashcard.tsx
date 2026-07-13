'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Volume2, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAudioPlayer } from './audio-player-hook';
import { NeonSentenceDisplay } from './neon-sentence-display';
import { ProgressDots } from './progress-dots';
import type { VocaVocabulary } from '@/types/voca';
import './neon-styles.css';

interface NeonFlashcardProps {
  vocabulary: VocaVocabulary[];
  onComplete: () => void;
}

export function NeonFlashcard({ vocabulary, onComplete }: NeonFlashcardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);
  const [showSentence, setShowSentence] = useState(false);
  const [visited, setVisited] = useState<Set<number>>(new Set([0]));
  const [direction, setDirection] = useState(0); // -1 = left, 1 = right
  const [isSpeakingWord, setIsSpeakingWord] = useState(false);
  const [highlightCharIndex, setHighlightCharIndex] = useState(-1);
  const charTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const vocab = vocabulary[currentIndex];

  const clearCharTimers = useCallback(() => {
    charTimersRef.current.forEach(clearTimeout);
    charTimersRef.current = [];
    setHighlightCharIndex(-1);
  }, []);

  /** 글자별 카라오케 타이머 설정 */
  const startCharHighlight = useCallback((word: string) => {
    clearCharTimers();
    const chars = word.length;
    // 글자당 ~110ms (rate 0.85 기준 추정)
    const perChar = 110;
    for (let i = 0; i < chars; i++) {
      const timer = setTimeout(() => setHighlightCharIndex(i), i * perChar);
      charTimersRef.current.push(timer);
    }
  }, [clearCharTimers]);

  const handleAudioEnd = useCallback(() => {
    // TTS 재생 완료 후 뜻 표시
    setShowMeaning(true);
  }, []);

  const { play, isPlaying, currentWordIndex, hasTts } = useAudioPlayer({
    audioUrl: vocab.audio_url,
    wordTimestamps: vocab.word_timestamps,
    onEnd: handleAudioEnd,
  });

  const handlePlay = () => {
    setShowMeaning(false);

    const hasSentence = !!vocab.example_sentence;
    const hasAudio = !!vocab.audio_url;

    // 1) 단어 먼저 읽기 (Web Speech API)
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      setIsSpeakingWord(true);
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(vocab.front_text);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;
      // 브라우저 음성 엔진은 speak() 호출 후 실제 발화까지 지연이 있음 —
      // 하이라이트를 speak() 직후가 아니라 실제 발화 시작 시점(onstart)에 맞춰야
      // 파란 글자 표시와 음성이 어긋나지 않는다.
      utterance.onstart = () => {
        startCharHighlight(vocab.front_text);
      };
      utterance.onend = () => {
        setIsSpeakingWord(false);
        clearCharTimers();
        // 2) 단어 발음 직후 → 뜻 표시
        setShowMeaning(true);
        if (hasSentence || hasAudio) {
          // 3) 잠시 후 예문 표시 → 예문 재생
          setTimeout(() => {
            if (hasSentence) setShowSentence(true);
            setTimeout(() => play(vocab.example_sentence || vocab.front_text), 300);
          }, 600);
        }
      };
      utterance.onerror = () => {
        setIsSpeakingWord(false);
        clearCharTimers();
        setShowMeaning(true);
        if (hasSentence || hasAudio) {
          if (hasSentence) setShowSentence(true);
          play(vocab.example_sentence || vocab.front_text);
        }
      };
      window.speechSynthesis.speak(utterance);
    } else {
      if (hasSentence) setShowSentence(true);
      play(vocab.example_sentence || vocab.front_text);
    }
  };

  const goTo = (index: number) => {
    // 카드 전환 시 진행 중인 단어 발화 중단
    if (isSpeakingWord && typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeakingWord(false);
    }
    clearCharTimers();
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
    setShowMeaning(false);
    setShowSentence(false);
    setVisited((prev) => new Set(prev).add(index));
  };

  const goNext = () => {
    if (currentIndex < vocabulary.length - 1) {
      goTo(currentIndex + 1);
    } else if (visited.size === vocabulary.length) {
      onComplete();
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) goTo(currentIndex - 1);
  };

  const allVisited = visited.size === vocabulary.length;

  return (
    <div className="neon-container p-4 md:p-8 min-h-[60dvh] flex flex-col">
      {/* Progress */}
      <div className="flex items-center justify-between mb-6">
        <span className="text-sm text-gray-400">
          {currentIndex + 1} / {vocabulary.length}
        </span>
        <ProgressDots total={vocabulary.length} current={currentIndex} visited={visited} />
      </div>

      {/* 사용법 안내 */}
      <p className="text-xs text-center text-gray-400 mb-4">
        단어 발음을 듣고 뜻·예문을 확인한 뒤 <span className="font-medium text-gray-500">다음</span>을 누르세요. 모든 단어를 보면 완료할 수 있어요.
      </p>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            initial={{ opacity: 0, x: direction * 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -direction * 100 }}
            transition={{ duration: 0.25 }}
            className="w-full max-w-lg space-y-6"
          >
            {/* 단어 (항상 표시 — 발음 중 글자별 카라오케) */}
            <p className="voca-display text-4xl text-center" style={{ fontWeight: 700 }}>
              {isSpeakingWord ? (
                vocab.front_text.split('').map((char, i) => (
                  <span
                    key={i}
                    className={
                      i === highlightCharIndex
                        ? 'char-active'
                        : i < highlightCharIndex
                          ? 'char-spoken'
                          : 'char-pending'
                    }
                  >
                    {char}
                  </span>
                ))
              ) : (
                <span className="text-gray-800">{vocab.front_text}</span>
              )}
            </p>

            {/* 예문 (단어 발음 후 등장) */}
            <AnimatePresence>
              {showSentence && vocab.example_sentence && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-2"
                >
                  <NeonSentenceDisplay
                    sentence={vocab.example_sentence}
                    targetWord={vocab.front_text}
                    currentWordIndex={currentWordIndex}
                  />
                  {vocab.example_sentence_ko && (
                    <p className="text-center text-sm text-gray-500">{vocab.example_sentence_ko}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* 품사 */}
            {vocab.part_of_speech && (
              <p className="text-sm text-gray-400 text-center">{vocab.part_of_speech}</p>
            )}

            {/* TTS 재생 버튼 */}
            <div className="flex justify-center">
              <Button
                variant="ghost"
                size="lg"
                className={cn(
                  'rounded-full w-14 h-14 border-2 transition-all',
                  isPlaying
                    ? 'border-brand-400 text-brand-500 bg-brand-50'
                    : 'border-gray-200 text-gray-400 hover:border-brand-300 hover:text-brand-500 hover:bg-brand-50/50',
                )}
                onClick={handlePlay}
                disabled={isPlaying || isSpeakingWord}
              >
                <Volume2 className={cn('h-6 w-6', isPlaying && 'animate-pulse')} />
              </Button>
            </div>

            {/* 한국어 뜻 */}
            <AnimatePresence>
              {showMeaning && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-center"
                >
                  <p className="voca-display text-2xl text-gray-700" style={{ fontWeight: 700 }}>
                    {vocab.back_text}
                  </p>
                  {vocab.exam_source && (
                    <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-[#E8F0FE] px-2.5 py-0.5 text-[11px] font-bold text-[#1A73E8]">
                      📄 {vocab.exam_source} 기출 문장
                    </span>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* TTS 없으면 탭하여 뜻 보기 */}
            {!showMeaning && !isPlaying && !isSpeakingWord && (
              <button
                className="block mx-auto text-sm text-gray-400 hover:text-gray-600 transition-colors"
                onClick={() => setShowMeaning(true)}
              >
                {hasTts ? '재생 후 자동 표시' : '탭하여 뜻 보기'}
              </button>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-500"
          onClick={goPrev}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          이전
        </Button>

        {allVisited && currentIndex === vocabulary.length - 1 ? (
          <Button
            size="sm"
            className="bg-brand-600 text-white hover:bg-brand-700"
            onClick={onComplete}
          >
            완료
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-500"
            onClick={goNext}
          >
            다음
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}
