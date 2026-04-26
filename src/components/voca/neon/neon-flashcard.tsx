'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Volume2, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAudioPlayer } from './audio-player-hook';
import { NeonSentenceDisplay } from './neon-sentence-display';
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
    play(vocab.example_sentence || vocab.front_text);
  };

  const goTo = (index: number) => {
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
        <span className="text-sm text-slate-500">
          {currentIndex + 1} / {vocabulary.length}
        </span>
        <div className="flex gap-1">
          {vocabulary.map((_, i) => (
            <div
              key={i}
              className={cn(
                'w-2 h-2 rounded-full transition-colors',
                i === currentIndex ? 'bg-cyan-400 shadow-[0_0_6px_rgba(0,240,255,0.5)]' :
                visited.has(i) ? 'bg-slate-500' : 'bg-slate-700',
              )}
            />
          ))}
        </div>
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
            {/* 예문 */}
            {vocab.example_sentence ? (
              <NeonSentenceDisplay
                sentence={vocab.example_sentence}
                targetWord={vocab.front_text}
                currentWordIndex={currentWordIndex}
              />
            ) : (
              <p className={cn(
                'text-3xl font-bold text-center transition-all',
                currentWordIndex >= 0 ? 'neon-text-gold' : 'text-slate-300',
              )}>
                {vocab.front_text}
              </p>
            )}

            {/* 단어 + 품사 */}
            <div className="text-center space-y-1">
              <p className="text-2xl font-bold neon-text-gold">
                {vocab.front_text}
              </p>
              {vocab.part_of_speech && (
                <p className="text-xs text-slate-500">{vocab.part_of_speech}</p>
              )}
            </div>

            {/* TTS 재생 버튼 */}
            <div className="flex justify-center">
              <Button
                variant="ghost"
                size="lg"
                className={cn(
                  'rounded-full w-14 h-14 border transition-all',
                  isPlaying
                    ? 'border-cyan-400/50 text-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.3)]'
                    : 'border-slate-600 text-slate-400 hover:border-cyan-400/30 hover:text-cyan-400',
                )}
                onClick={handlePlay}
                disabled={isPlaying}
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
                  <p className="text-xl text-slate-200 font-medium">
                    {vocab.back_text}
                  </p>
                  {vocab.exam_source && (
                    <p className="text-xs text-slate-600 mt-1">{vocab.exam_source}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* TTS 없으면 탭하여 뜻 보기 */}
            {!showMeaning && !isPlaying && (
              <button
                className="block mx-auto text-sm text-slate-600 hover:text-slate-400 transition-colors"
                onClick={() => setShowMeaning(true)}
              >
                {hasTts ? '재생 후 자동 표시' : '탭하여 뜻 보기'}
              </button>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-800">
        <Button
          variant="ghost"
          size="sm"
          className="text-slate-400"
          onClick={goPrev}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          이전
        </Button>

        {allVisited && currentIndex === vocabulary.length - 1 ? (
          <Button
            size="sm"
            className="bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 hover:bg-cyan-500/30"
            onClick={onComplete}
          >
            완료
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-400"
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
