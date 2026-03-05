'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { passageToTextbookPassage } from '@/lib/naesin/adapters';
import { NaesinFillBlanksView } from './fill-blanks-view';
import { NaesinOrderingView } from './ordering-view';
import { NaesinTranslationView } from './translation-view';
import type { NaesinPassage } from '@/types/database';

interface PassageTabProps {
  passages: NaesinPassage[];
  unitId: string;
  onStageComplete: () => void;
}

export function PassageTab({ passages, unitId, onStageComplete }: PassageTabProps) {
  const [activeTab, setActiveTab] = useState('fill-blanks');
  const [currentPassageIndex, setCurrentPassageIndex] = useState(0);

  if (passages.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        등록된 교과서 지문이 없습니다.
      </p>
    );
  }

  const passage = passages[currentPassageIndex];
  const textbookPassage = passageToTextbookPassage(passage);
  const hasBlanks =
    (Array.isArray(passage.blanks_easy) && passage.blanks_easy.length > 0) ||
    (Array.isArray(passage.blanks_medium) && passage.blanks_medium.length > 0) ||
    (Array.isArray(passage.blanks_hard) && passage.blanks_hard.length > 0);
  const hasSentences = Array.isArray(passage.sentences) && passage.sentences.length > 0;

  async function savePassageProgress(type: 'fill_blanks' | 'ordering' | 'translation', score: number, wrongAnswers?: unknown[]) {
    try {
      const res = await fetch('/api/naesin/passage/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unitId, type, score, wrongAnswers }),
      });
      const data = await res.json();
      if (data.passageCompleted) {
        toast.success('교과서 암기 단계를 완료했습니다!');
        onStageComplete();
      }
    } catch {
      toast.error('진도 저장 중 오류가 발생했습니다');
    }
  }

  async function saveWrongAnswers(wrongItems: unknown[]) {
    if (wrongItems.length === 0) return;
    try {
      await fetch('/api/naesin/wrong-answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unitId,
          stage: 'passage',
          sourceType: activeTab,
          wrongAnswers: wrongItems,
        }),
      });
    } catch {
      // Silent fail
    }
  }

  return (
    <div className="space-y-4">
      {passages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {passages.map((p, idx) => (
            <button
              type="button"
              key={p.id}
              onClick={() => setCurrentPassageIndex(idx)}
              className={`shrink-0 px-3 py-1.5 text-sm rounded-full border transition-colors ${
                idx === currentPassageIndex
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card hover:bg-muted border-border'
              }`}
            >
              {p.title}
            </button>
          ))}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="fill-blanks" disabled={!hasBlanks}>
            빈칸 채우기
          </TabsTrigger>
          <TabsTrigger value="ordering" disabled={!hasSentences}>
            순서 배열
          </TabsTrigger>
          <TabsTrigger value="translation">
            영작
          </TabsTrigger>
        </TabsList>

        <TabsContent value="fill-blanks" className="mt-4">
          <NaesinFillBlanksView
            key={passage.id}
            passage={textbookPassage}
            onScoreChange={(score, wrongs) => {
              savePassageProgress('fill_blanks', score);
              if (wrongs && wrongs.length > 0) saveWrongAnswers(wrongs);
            }}
          />
        </TabsContent>

        <TabsContent value="ordering" className="mt-4">
          <NaesinOrderingView
            key={passage.id}
            passage={textbookPassage}
            onScoreChange={(score) => savePassageProgress('ordering', score)}
          />
        </TabsContent>

        <TabsContent value="translation" className="mt-4">
          <NaesinTranslationView
            key={passage.id}
            passage={textbookPassage}
            onScoreChange={(score, wrongs) => {
              savePassageProgress('translation', score);
              if (wrongs && wrongs.length > 0) saveWrongAnswers(wrongs);
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
