'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FlashcardView } from '@/components/memory/flashcard';
import { QuizView } from '@/components/memory/quiz';
import { SpellingView } from '@/components/memory/spelling';
import type { MemoryItem, StudentMemoryProgress } from '@/types/database';

interface MemoryItemWithProgress extends MemoryItem {
  progress: StudentMemoryProgress | null;
}

interface MemoryClientProps {
  items: MemoryItemWithProgress[];
  grammarId: string;
}

export function MemoryClient({ items, grammarId }: MemoryClientProps) {
  const [activeTab, setActiveTab] = useState('flashcard');

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        아직 등록된 암기 항목이 없습니다.
      </div>
    );
  }

  const quizItems = items.filter((i) => i.quiz_options && i.quiz_correct_index !== null);
  const spellingItems = items.filter((i) => i.spelling_answer);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="flashcard">플래시카드</TabsTrigger>
        <TabsTrigger value="quiz" disabled={quizItems.length === 0}>
          퀴즈
        </TabsTrigger>
        <TabsTrigger value="spelling" disabled={spellingItems.length === 0}>
          스펠링
        </TabsTrigger>
      </TabsList>
      <TabsContent value="flashcard" className="mt-6">
        <FlashcardView items={items} />
      </TabsContent>
      <TabsContent value="quiz" className="mt-6">
        <QuizView items={quizItems} />
      </TabsContent>
      <TabsContent value="spelling" className="mt-6">
        <SpellingView items={spellingItems} />
      </TabsContent>
    </Tabs>
  );
}
