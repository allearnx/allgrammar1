import { useMemo } from 'react';
import type { NaesinTextbook } from '@/types/database';
import { buildPublisherColorMap, type PublisherPalette } from '@/lib/naesin/publisher-palette';

export type { PublisherPalette };

export function useNaesinHomeData(textbooks: NaesinTextbook[]) {
  const gradeTextbooks = useMemo(() => {
    const map: Record<number, NaesinTextbook[]> = {};
    textbooks.forEach((tb) => {
      if (!map[tb.grade]) map[tb.grade] = [];
      map[tb.grade].push(tb);
    });
    return map;
  }, [textbooks]);

  const publisherColorMap = useMemo(() => buildPublisherColorMap(textbooks), [textbooks]);

  return { gradeTextbooks, publisherColorMap };
}
