'use client';

import { useEffect, useState } from 'react';
import { fetchWithToast } from '@/lib/fetch-with-toast';

export function useStreak() {
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    fetchWithToast<{ streak: number }>('/api/student/streak', {
      method: 'GET',
      silent: true,
    })
      .then((d) => setStreak(d.streak))
      .catch(() => {});
  }, []);

  return streak;
}
