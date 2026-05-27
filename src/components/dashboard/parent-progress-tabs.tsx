'use client';

import { type ReactNode } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Props {
  hasNaesin: boolean;
  hasVoca: boolean;
  naesinCard: ReactNode;
  vocaCard: ReactNode;
  defaultTab?: 'naesin' | 'voca';
}

export function ParentProgressTabs({ hasNaesin, hasVoca, naesinCard, vocaCard, defaultTab }: Props) {
  // Single service — no tabs
  if (hasNaesin && !hasVoca) return <>{naesinCard}</>;
  if (!hasNaesin && hasVoca) return <>{vocaCard}</>;
  if (!hasNaesin && !hasVoca) return null;

  return (
    <Tabs defaultValue={defaultTab ?? 'naesin'}>
      <TabsList className="w-full">
        <TabsTrigger value="naesin" className="flex-1">올인내신</TabsTrigger>
        <TabsTrigger value="voca" className="flex-1">올킬보카</TabsTrigger>
      </TabsList>
      <TabsContent value="naesin" className="mt-4">
        {naesinCard}
      </TabsContent>
      <TabsContent value="voca" className="mt-4">
        {vocaCard}
      </TabsContent>
    </Tabs>
  );
}
