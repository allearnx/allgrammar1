'use client';

import { useState, useCallback } from 'react';
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
  const [visited, setVisited] = useState<Set<number>>(new Set([0]));
  const [direction, setDirection] = useState(0); // -1 = left, 1 = right
  const [isSpeakingWord, setIsSpeakingWord] = useState(false);

  const vocab = vocabulary[currentIndex];

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

    // 1) 단어 먼저 읽기 (Web Speech API)
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      setIsSpeakingWord(true);
      window.speechSynthesis.cancel(); // 이전 발화 정리
      const utterance = new SpeechSynthesisUtterance(vocab.front_text);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;
      utterance.onend = () => {
        setIsSpeakingWord(false);
        // 2) 약간의 간격 후 예문 재생
        setTimeout(() => play(vocab.example_sentence || vocab.front_text), 400);
      };
      utterance.onerror = () => {
        setIsSpeakingWord(false);
        play(vocab.example_sentence || vocab.front_text);
      };
      window.speechSynthesis.speak(utterance);
    } else {
      play(vocab.example_sentence || vocab.front_text);
    }
  };

  const goTo = (index: number) => {
    // 카드 전환 시 진행 중인 단어 발화 중단
    if (isSpeakingWord && typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeakingWord(false);
    }
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
    setShowMeaning(false);
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
            {/* 예문 or 단어 */}
            {vocab.example_sentence ? (
              <div className="space-y-2">
                <NeonSentenceDisplay
                  sentence={vocab.example_sentence}
                  targetWord={vocab.front_text}
                  currentWordIndex={currentWordIndex}
                />
                {vocab.example_sentence_ko && (
                  <p className="text-center text-xs text-gray-300">{vocab.example_sentence_ko}</p>
                )}
              </div>
            ) : (
              <p className={cn(
                'text-4xl font-bold text-center transition-all duration-200',
                isSpeakingWord && 'scale-110',
                currentWordIndex >= 0 ? 'neon-text-gold' : 'text-gray-800',
              )}>
                {vocab.front_text}
              </p>
            )}

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
                    ? 'border-indigo-400 text-indigo-500 bg-indigo-50'
                    : 'border-gray-200 text-gray-400 hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50/50',
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
                  <p className="text-2xl text-gray-700 font-semibold">
                    {vocab.back_text}
                  </p>
                  {vocab.exam_source && (
                    <p className="text-xs text-gray-400 mt-1">{vocab.exam_source}</p>
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
            className="bg-indigo-600 text-white hover:bg-indigo-700"
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
