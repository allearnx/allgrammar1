'use client';

import { useState, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, ArrowRightLeft, PenLine } from 'lucide-react';
import { OrderingExercise } from '@/components/shared/ordering-exercise';
import { TranslationExercise, type WrongTranslation } from '@/components/shared/translation-exercise';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import type { NaesinProblemSheet } from '@/types/database';
import type { TextbookPassage, SentenceItem } from '@/types/textbook';
import type { ExternalPassageSentence } from '@/types/naesin';

interface ExternalPassageViewProps {
  sheet: NaesinProblemSheet;
  unitId: string;
  onComplete?: () => void;
}

/** Convert sheet questions (ExternalPassageSentence[]) to a mock TextbookPassage for reuse */
function toTextbookPassage(sheet: NaesinProblemSheet): TextbookPassage {
  const sentences: SentenceItem[] = (sheet.questions as unknown as ExternalPassageSentence[]).map((q) => ({
    original: q.original,
    korean: q.korean,
    words: q.words,
    acceptedAnswers: q.acceptedAnswers,
  }));

  return {
    id: sheet.id,
    grammar_id: '',
    title: sheet.title,
    original_text: sentences.map((s) => s.original).join(' '),
    korean_translation: sentences.map((s) => s.korean).join(' '),
    blanks_easy: null,
    blanks_medium: null,
    blanks_hard: null,
    sentences,
    is_textbook_mode_active: true,
    created_at: sheet.created_at,
  };
}

export function ExternalPassageView({ sheet, unitId, onComplete }: ExternalPassageViewProps) {
  const [orderingScore, setOrderingScore] = useState<number | null>(null);
  const [translationScore, setTranslationScore] = useState<number | null>(null);
  const [translationWrongs, setTranslationWrongs] = useState<WrongTranslation[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const passage = toTextbookPassage(sheet);

  const handleOrderingComplete = useCallback((score: number) => {
    setOrderingScore(score);
  }, []);

  const handleTranslationComplete = useCallback((score: number, wrongs: WrongTranslation[]) => {
    setTranslationScore(score);
    setTranslationWrongs(wrongs);
  }, []);

  const bothDone = orderingScore !== null && translationScore !== null;

  async function handleSubmit() {
    if (!bothDone || submitting) return;
    setSubmitting(true);

    const wrongSentences = [
      ...translationWrongs.map((w, i) => ({
        number: i + 1,
        type: 'translation' as const,
        userAnswer: w.userAnswer,
        correctAnswer: w.correctAnswer || '',
      })),
    ];

    try {
      await fetchWithToast('/api/naesin/problems/submit-passage', {
        body: {
          sheetId: sheet.id,
          unitId,
          orderingScore,
          translationScore,
          wrongSentences,
        },
        silent: true,
      });
      setSubmitted(true);
      onComplete?.();
    } catch {
      // handled by fetchWithToast
    } finally {
      setSubmitting(false);
    }
  }

  // Auto-submit when both exercises are done
  if (bothDone && !submitted && !submitting) {
    handleSubmit();
  }

  const avgScore = bothDone ? Math.round((orderingScore + translationScore) / 2) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="font-semibold">{sheet.title}</h3>
        <Badge variant="secondary">외부지문</Badge>
      </div>

      {submitted && avgScore !== null && (
        <div className="text-center py-4 space-y-2">
          <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto" />
          <p className="text-3xl font-bold">{avgScore}점</p>
          <div className="flex justify-center gap-4 text-sm text-muted-foreground">
            <span>순서배열 {orderingScore}점</span>
            <span>영작 {translationScore}점</span>
          </div>
        </div>
      )}

      {!submitted && (
        <Tabs defaultValue="ordering" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ordering" className="gap-1.5">
              <ArrowRightLeft className="h-3.5 w-3.5" />
              순서 배열
              {orderingScore !== null && (
                <Badge variant="outline" className="ml-1 text-xs">{orderingScore}점</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="translation" className="gap-1.5">
              <PenLine className="h-3.5 w-3.5" />
              영작
              {translationScore !== null && (
                <Badge variant="outline" className="ml-1 text-xs">{translationScore}점</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ordering" className="mt-4">
            {orderingScore !== null ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p>순서 배열 완료! ({orderingScore}점)</p>
              </div>
            ) : (
              <OrderingExercise
                passage={passage}
                onComplete={handleOrderingComplete}
              />
            )}
          </TabsContent>

          <TabsContent value="translation" className="mt-4">
            {translationScore !== null ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p>영작 완료! ({translationScore}점)</p>
              </div>
            ) : (
              <TranslationExercise
                passage={passage}
                onComplete={handleTranslationComplete}
              />
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
