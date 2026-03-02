'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FillBlanksView } from '@/components/textbook/fill-blanks';
import { OrderingView } from '@/components/textbook/ordering';
import { TranslationView } from '@/components/textbook/translation';
import type { TextbookPassage, StudentTextbookProgress } from '@/types/database';

interface TextbookClientProps {
  passages: TextbookPassage[];
  progressMap: Record<string, StudentTextbookProgress>;
}

export function TextbookClient({ passages, progressMap }: TextbookClientProps) {
  const [selectedPassage, setSelectedPassage] = useState<TextbookPassage | null>(
    passages[0] || null
  );

  if (passages.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        아직 교과서 모드가 활성화되지 않았습니다.
      </div>
    );
  }

  const passage = selectedPassage!;
  const progress = progressMap[passage.id];

  return (
    <div className="space-y-6">
      {passages.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {passages.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPassage(p)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedPassage?.id === p.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {p.title}
            </button>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{passage.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap">{passage.original_text}</p>
          <p className="text-sm text-muted-foreground mt-3 whitespace-pre-wrap">
            {passage.korean_translation}
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="fill-blanks">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="fill-blanks">빈칸 채우기</TabsTrigger>
          <TabsTrigger value="ordering" disabled={!passage.sentences?.length}>
            순서 배열
          </TabsTrigger>
          <TabsTrigger value="translation">영작 연습</TabsTrigger>
        </TabsList>
        <TabsContent value="fill-blanks" className="mt-6">
          <FillBlanksView passage={passage} progress={progress} />
        </TabsContent>
        <TabsContent value="ordering" className="mt-6">
          <OrderingView passage={passage} progress={progress} />
        </TabsContent>
        <TabsContent value="translation" className="mt-6">
          <TranslationView passage={passage} progress={progress} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
