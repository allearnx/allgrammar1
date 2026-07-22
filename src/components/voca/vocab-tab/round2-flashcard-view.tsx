'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, RotateCcw, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { VocaVocabulary } from '@/types/voca';

/** 표제어 발음 (Web Speech) — speak() 후 resume() 필수: iOS 사파리/일부 모바일 크롬은
 * paused 상태로 시작해 완전 무음이 됨 (browser-compat, e45a493과 동일 대응) */
function speakWord(word: string, onDone: () => void) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = 'en-US';
  utterance.rate = 0.85;
  const enVoice = window.speechSynthesis.getVoices().find((v) => v.lang?.toLowerCase().startsWith('en'));
  if (enVoice) utterance.voice = enVoice;
  utterance.onend = onDone;
  utterance.onerror = onDone;
  window.speechSynthesis.speak(utterance);
  window.speechSynthesis.resume();
}

interface Round2FlashcardViewProps {
  vocabulary: VocaVocabulary[];
  onComplete: () => void;
}

interface CardData {
  word: string;
  front: string;
  back: string[];
  /** 뒷면 발음용 영어 텍스트 — 표제어. 유의어. 반의어. 숙어 순 (마침표가 발화 쉼) */
  backSpeech: string;
}

function buildCards(vocabulary: VocaVocabulary[]): CardData[] {
  const cards: CardData[] = [];

  for (const v of vocabulary) {
    const backLines: string[] = [];
    const speechParts: string[] = [v.front_text];

    if (v.synonyms) {
      backLines.push(`유의어: ${v.synonyms}`);
      speechParts.push(v.synonyms);
    }
    if (v.antonyms) {
      backLines.push(`반의어: ${v.antonyms}`);
      speechParts.push(v.antonyms);
    }
    if (v.idioms && v.idioms.length > 0) {
      for (const idiom of v.idioms) {
        backLines.push(`숙어: ${idiom.en} — ${idiom.ko}`);
        speechParts.push(idiom.en);
        if (idiom.example_en) {
          backLines.push(`  예) ${idiom.example_en}`);
        }
      }
    }

    if (backLines.length > 0) {
      cards.push({
        word: v.front_text,
        front: v.front_text,
        back: backLines,
        backSpeech: speechParts.join('. '),
      });
    }
  }

  return cards;
}

export function Round2FlashcardView({ vocabulary, onComplete }: Round2FlashcardViewProps) {
  const cards = useMemo(() => buildCards(vocabulary), [vocabulary]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  // 카드 이동·뒤집기 시 진행 중인 발화 중단
  useEffect(() => {
    setSpeaking(false);
    if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
    return () => {
      if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
    };
  }, [currentIdx, flipped]);

  if (cards.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        유의어/반의어/숙어가 등록된 단어가 없습니다.
      </p>
    );
  }

  const card = cards[currentIdx];
  const isLast = currentIdx === cards.length - 1;

  function handleNext() {
    if (isLast) {
      setCompleted(true);
      onComplete();
      return;
    }
    setFlipped(false);
    setCurrentIdx((i) => i + 1);
  }

  function handlePrev() {
    if (currentIdx > 0) {
      setFlipped(false);
      setCurrentIdx((i) => i - 1);
    }
  }

  function handleRestart() {
    setCurrentIdx(0);
    setFlipped(false);
    setCompleted(false);
  }

  if (completed) {
    return (
      <div className="text-center space-y-4 py-8">
        <p className="text-lg font-semibold">2회독 플래시카드 완료!</p>
        <p className="text-muted-foreground">{cards.length}개 단어의 유의어/반의어/숙어를 학습했습니다.</p>
        <Button variant="outline" onClick={handleRestart}>
          <RotateCcw className="h-4 w-4 mr-2" />
          다시 학습하기
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{currentIdx + 1} / {cards.length}</span>
        <Badge variant="outline">2회독</Badge>
      </div>

      <div
        className="cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)] transition-all dark:border-slate-800 dark:bg-slate-900 dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)]"
        onClick={() => setFlipped(!flipped)}
        style={{ minHeight: '220px' }}
      >
        <div className={cn(
          'h-1.5',
          flipped
            ? 'bg-gradient-to-r from-rose-400 via-orange-300 to-amber-300'
            : 'bg-gradient-to-r from-teal-400 via-cyan-400 to-sky-400'
        )} />
        <div className="flex flex-col items-center justify-center px-6 py-8" style={{ minHeight: '200px' }}>
          {!flipped ? (
            <div className="text-center">
              <p className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">{card.front}</p>
              <button
                type="button"
                aria-label="발음 듣기"
                className={cn(
                  'mt-3 inline-flex h-10 w-10 items-center justify-center rounded-full shadow-sm transition-colors',
                  speaking ? 'bg-brand-100 text-brand-600' : 'bg-brand-600 text-white hover:bg-brand-700',
                )}
                onClick={(e) => {
                  e.stopPropagation(); // 카드 뒤집기 방지
                  setSpeaking(true);
                  speakWord(card.word, () => setSpeaking(false));
                }}
              >
                <Volume2 className={cn('h-5 w-5', speaking && 'animate-pulse')} />
              </button>
              <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">탭하여 뒤집기</p>
            </div>
          ) : (
            <div className="w-full space-y-2 text-left">
              <div className="mb-3 flex items-center justify-center gap-2">
                <p className="text-lg font-semibold text-slate-900 dark:text-white">{card.word}</p>
                <button
                  type="button"
                  aria-label="유의어·반의어 듣기"
                  className={cn(
                    'inline-flex h-8 w-8 items-center justify-center rounded-full shadow-sm transition-colors',
                    speaking ? 'bg-brand-100 text-brand-600' : 'bg-brand-600 text-white hover:bg-brand-700',
                  )}
                  onClick={(e) => {
                    e.stopPropagation(); // 카드 뒤집기 방지
                    setSpeaking(true);
                    speakWord(card.backSpeech, () => setSpeaking(false));
                  }}
                >
                  <Volume2 className={cn('h-4 w-4', speaking && 'animate-pulse')} />
                </button>
              </div>
              {card.back.map((line, i) => (
                <p
                  key={i}
                  className={cn(
                    'text-sm text-slate-700 dark:text-slate-300',
                    line.startsWith('  예)') && 'ml-4 italic text-slate-500 dark:text-slate-400'
                  )}
                >
                  {line}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" size="sm" onClick={handlePrev} disabled={currentIdx === 0}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          이전
        </Button>
        <Button size="sm" onClick={handleNext}>
          {isLast ? '완료' : '다음'}
          {!isLast && <ChevronRight className="h-4 w-4 ml-1" />}
        </Button>
      </div>
    </div>
  );
}
