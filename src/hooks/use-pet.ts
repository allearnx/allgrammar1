'use client';

import { useEffect, useState, useCallback } from 'react';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import type { PetState, PetFeedResult } from '@/lib/voca/pet-constants';

export function usePet() {
  const [pet, setPet] = useState<PetState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWithToast<{ pet: PetState }>('/api/voca/pet', {
      method: 'GET',
      silent: true,
    })
      .then((d) => setPet(d.pet))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const feed = useCallback(
    async (dayId: string, scores: { quiz: number; spelling: number; matching: number }, streak: number) => {
      try {
        const result = await fetchWithToast<PetFeedResult>('/api/voca/pet', {
          body: { dayId, scores, streak },
          silent: true,
        });
        setPet(result.pet);
        return result;
      } catch {
        return null;
      }
    },
    [],
  );

  return { pet, loading, feed };
}
