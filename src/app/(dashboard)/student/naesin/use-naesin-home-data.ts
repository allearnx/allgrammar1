import { useMemo } from 'react';
import type { NaesinTextbook } from '@/types/database';

const PUBLISHER_PALETTES = [
  { bg: 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)', spine: '#3B82F6', text: '#1E40AF' },
  { bg: 'linear-gradient(135deg, #FCE7F3 0%, #FBCFE8 100%)', spine: '#EC4899', text: '#BE185D' },
  { bg: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)', spine: '#10B981', text: '#065F46' },
  { bg: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)', spine: '#F59E0B', text: '#92400E' },
  { bg: 'linear-gradient(135deg, #E0E7FF 0%, #C7D2FE 100%)', spine: '#6366F1', text: '#3730A3' },
  { bg: 'linear-gradient(135deg, #FFE4E6 0%, #FECDD3 100%)', spine: '#F43F5E', text: '#9F1239' },
  { bg: 'linear-gradient(135deg, #CCFBF1 0%, #99F6E4 100%)', spine: '#14B8A6', text: '#115E59' },
  { bg: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)', spine: '#EF4444', text: '#991B1B' },
];

export type PublisherPalette = typeof PUBLISHER_PALETTES[0];

export function useNaesinHomeData(textbooks: NaesinTextbook[]) {
  const gradeTextbooks = useMemo(() => {
    const map: Record<number, NaesinTextbook[]> = {};
    textbooks.forEach((tb) => {
      if (!map[tb.grade]) map[tb.grade] = [];
      map[tb.grade].push(tb);
    });
    return map;
  }, [textbooks]);

  const publisherColorMap = useMemo(() => {
    const map = new Map<string, PublisherPalette>();
    let colorIdx = 0;
    textbooks.forEach((tb) => {
      if (!map.has(tb.publisher)) {
        map.set(tb.publisher, PUBLISHER_PALETTES[colorIdx % PUBLISHER_PALETTES.length]);
        colorIdx++;
      }
    });
    return map;
  }, [textbooks]);

  return { gradeTextbooks, publisherColorMap };
}
