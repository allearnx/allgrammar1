'use client';

import { useEffect, useState } from 'react';
import { fetchWithToast } from '@/lib/fetch-with-toast';

interface Coverage {
  coverage: number | null;
  knownInBook: number;
  totalWords: number;
}

/**
 * 시험 커버리지 게이지 — "이 시험 단어가 지금 몇 % 읽히는가".
 * 다른 교재에서 외운 단어까지 합산 (교재 진도율과 다른 지표).
 */
export function CoverageGauge({ bookId }: { bookId: string }) {
  // bookId 키를 함께 저장 — 교재 전환 시 이전 교재 수치가 잠깐 보이는 것 방지
  const [state, setState] = useState<{ bookId: string; data: Coverage } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchWithToast<Coverage>(`/api/voca/coverage?bookId=${bookId}`, {
      method: 'GET',
      silent: true,
    })
      .then((d) => { if (!cancelled) setState({ bookId, data: d }); })
      .catch(() => { /* 조용히 숨김 — 게이지는 부가 정보 */ });
    return () => { cancelled = true; };
  }, [bookId]);

  const data = state?.bookId === bookId ? state.data : null;
  if (!data || data.coverage === null) return null;

  return (
    <div className="mt-3 rounded-xl bg-accent/60 px-4 py-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-bold text-gray-700">🎯 시험 커버리지</span>
        <span className="text-sm font-extrabold tabular-nums text-primary">{data.coverage}%</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white">
        <div
          className="h-full rounded-full bg-primary transition-all duration-700"
          style={{ width: `${data.coverage}%` }}
        />
      </div>
      <p className="mt-1.5 text-[11px] text-gray-500">
        이 시험 단어 {data.totalWords.toLocaleString()}개 중 <b className="text-gray-700">{data.knownInBook.toLocaleString()}개</b>를 알아요
        — 다른 교재에서 외운 단어도 포함돼요
      </p>
    </div>
  );
}
