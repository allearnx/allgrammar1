'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Swords, CheckCircle } from 'lucide-react';
import { fetchWithToast } from '@/lib/fetch-with-toast';

interface MissionData {
  words: { front_text: string }[];
  progress: Record<string, number>;
  completedAt: string | null;
  coverageDelta: { bookTitle: string; now: number; after: number } | null;
}

const GRADUATE_THRESHOLD = 3;

/** KST 요일 (0=일 ... 6=토) */
function kstDow(): number {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).getUTCDay();
}

/**
 * 주간 올킬 미션 카드 — "일요일 아침은 올킬오답 시험 보는 날!"
 * 월~목: 숨김 (평소 학습에 집중) / 금·토: 예고 / 일: 미션 데이 / 완료: 축하.
 * 항상 떠 있는 숙제가 아니라 주 1회 이벤트로 리듬을 만든다.
 */
export function WrongMissionCard() {
  const [data, setData] = useState<MissionData | null>(null);
  const dow = kstDow();
  const isMissionWindow = dow === 5 || dow === 6 || dow === 0; // 금·토·일

  useEffect(() => {
    if (!isMissionWindow) return;
    let cancelled = false;
    fetchWithToast<MissionData>('/api/voca/wrong-review', { method: 'GET', silent: true })
      .then((d) => { if (!cancelled) setData(d); })
      .catch(() => { /* 카드 숨김 */ });
    return () => { cancelled = true; };
  }, [isMissionWindow]);

  if (!isMissionWindow || !data) return null;

  const remaining = data.words.filter(
    (w) => (data.progress[w.front_text.toLowerCase()] ?? 0) < GRADUATE_THRESHOLD,
  ).length;

  // 오답이 없으면 조용히
  if (data.words.length === 0) return null;

  // 완료: 축하 카드 (일요일까지 유지)
  if (data.completedAt || remaining === 0) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-[#A8DAB5] bg-[#E6F4EA] p-4">
        <CheckCircle className="h-8 w-8 shrink-0 text-[#188038]" />
        <div>
          <p className="font-bold text-[#188038]">이번 주 올킬 미션 완료!</p>
          <p className="text-xs text-[#1E8E3E]">오답 {data.words.length}개 전부 정복 — 일요일이 편안하겠어요 😎</p>
        </div>
      </div>
    );
  }

  const isSunday = dow === 0;

  return (
    <Link href="/student/voca/wrong-review" className="block group">
      <div className={`rounded-2xl border-2 p-4 transition-all group-hover:shadow-md ${
        isSunday ? 'border-[#F6AEA9] bg-[#FCE8E6]' : 'border-[#FDE293] bg-[#FEF7E0]'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
            isSunday ? 'bg-[#EA4335]' : 'bg-[#F9AB00]'
          }`}>
            <Swords className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            {isSunday ? (
              <>
                <p className="font-extrabold text-[#C5221F]">🗡️ 오늘은 올킬오답 시험 보는 날!</p>
                <p className="mt-0.5 text-xs text-gray-600">
                  일요일 아침, 이번 주 틀린 단어 <b>{remaining}개</b>를 정복하고 한 주를 마무리하자
                  {data.coverageDelta && (
                    <> — 커버리지 <b className="text-[#C5221F]">{data.coverageDelta.now}%→{data.coverageDelta.after}%</b></>
                  )}
                </p>
              </>
            ) : (
              <>
                <p className="font-extrabold text-[#B06000]">📅 일요일 아침은 올킬오답 시험 보는 날!</p>
                <p className="mt-0.5 text-xs text-gray-600">
                  이번 주 오답 <b>{remaining}개</b>가 기다리고 있어요 — 미리 정복하면 일요일이 여유로워요
                </p>
              </>
            )}
          </div>
          <span className={`shrink-0 rounded-xl px-4 py-2 text-sm font-bold text-white ${
            isSunday ? 'bg-[#EA4335]' : 'bg-[#F9AB00]'
          }`}>
            {isSunday ? '시험 보기' : '미리 보기'}
          </span>
        </div>
      </div>
    </Link>
  );
}
