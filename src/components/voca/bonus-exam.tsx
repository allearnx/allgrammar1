'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { RhythmSpelling } from '@/components/voca/neon/rhythm-spelling';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import { shuffle } from '@/lib/utils';
import { VOCA_VOCABULARY_COLUMNS, type VocaDay, type VocaVocabulary } from '@/types/voca';

const MAX_DAYS = 3;
const PASS = 90;

type WrongWord = { front_text: string; back_text: string };

/** 홈(교재) 페이지의 묶음 보너스 시험 — Day 1~3개를 골라 표제어 스펠링 시험 */
export function BonusExam({ days, bookId }: { days: VocaDay[]; bookId: string }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [mode, setMode] = useState<'idle' | 'loading' | 'exam' | 'done'>('idle');
  const [vocab, setVocab] = useState<VocaVocabulary[]>([]);
  const [score, setScore] = useState<number | null>(null);

  if (days.length === 0) return null;

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length >= MAX_DAYS
          ? prev
          : [...prev, id],
    );
  }

  async function start() {
    if (selected.length === 0) return;
    setMode('loading');
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const sb = createClient();
      const { data } = await sb
        .from('voca_vocabulary')
        .select(VOCA_VOCABULARY_COLUMNS)
        .in('day_id', selected)
        .order('sort_order');
      const v = (data as VocaVocabulary[] | null) ?? [];
      if (v.length === 0) {
        toast.error('선택한 Day에 단어가 없어요.');
        setMode('idle');
        return;
      }
      setVocab(shuffle([...v])); // 표제어 항상 셔플
      setMode('exam');
    } catch {
      toast.error('단어를 불러오지 못했어요. 다시 시도해주세요.');
      setMode('idle');
    }
  }

  async function handleComplete(s: number, wrongWords?: WrongWord[]) {
    setScore(s);
    setMode('done');
    try {
      await fetchWithToast('/api/voca/exam', {
        body: { bookId, dayIds: selected, score: s, wrongWords },
        silent: true,
      });
    } catch { /* swallow — 점수 표시는 그대로 */ }
    if (s >= PASS) toast.success(`🎉 보너스 시험 통과! ${s}점`);
  }

  function reset() {
    setMode('idle');
    setVocab([]);
    setScore(null);
  }

  // ── 시험 진행 화면 ──
  if (mode === 'exam') {
    return (
      <div className="space-y-3">
        <button onClick={reset} className="text-sm font-medium text-gray-500 hover:text-gray-700">
          ← 그만두기
        </button>
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-center">
          <p className="text-lg font-extrabold text-rose-600">📝 묶음 표제어 스펠링 시험</p>
          <p className="mt-0.5 text-xs text-rose-500">
            {selected.length}개 Day · {vocab.length}단어 · {PASS}점 통과 · 순서 셔플
          </p>
        </div>
        <RhythmSpelling vocabulary={vocab} onComplete={handleComplete} examMode />
      </div>
    );
  }

  // ── 결과 화면 ──
  if (mode === 'done') {
    const passed = (score ?? 0) >= PASS;
    return (
      <div className="rounded-2xl border-2 border-rose-200 bg-rose-50/60 p-6 text-center space-y-3">
        <p className="text-4xl">{passed ? '🎉' : '💪'}</p>
        <p className="text-2xl font-extrabold text-gray-800">{score}점</p>
        <p className="text-sm text-gray-500">
          {passed ? '보너스 시험 통과!' : `${PASS}점 넘으면 통과예요. 또 도전해보세요!`}
        </p>
        <div className="flex justify-center gap-2 pt-1">
          <button onClick={() => { setMode('idle'); }} className="rounded-xl bg-rose-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-rose-600">
            다시 도전
          </button>
          <button onClick={reset} className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50">
            닫기
          </button>
        </div>
      </div>
    );
  }

  // ── Day 선택 화면 (idle/loading) ──
  return (
    <div className="rounded-2xl border-2 border-dashed border-rose-200 bg-rose-50/50 p-4 space-y-3">
      <div>
        <p className="font-bold text-rose-600">🎁 보너스: 묶음 표제어 스펠링 시험</p>
        <p className="mt-0.5 text-xs text-rose-400">
          Day를 최대 {MAX_DAYS}개까지 골라 한 번에 시험! 선택해도 진도엔 영향 없어요 ({PASS}점 통과)
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {days.map((d) => {
          const on = selected.includes(d.id);
          const disabled = !on && selected.length >= MAX_DAYS;
          return (
            <button
              key={d.id}
              onClick={() => toggle(d.id)}
              disabled={disabled}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                on
                  ? 'bg-rose-500 text-white'
                  : disabled
                    ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                    : 'bg-white text-rose-600 border border-rose-200 hover:bg-rose-50'
              }`}
            >
              {d.title}
            </button>
          );
        })}
      </div>

      <button
        onClick={start}
        disabled={selected.length === 0 || mode === 'loading'}
        className="w-full rounded-xl bg-rose-500 py-3 text-sm font-bold text-white transition-colors hover:bg-rose-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        {mode === 'loading'
          ? '단어 불러오는 중...'
          : selected.length === 0
            ? 'Day를 선택하세요'
            : `${selected.length}개 Day 시험 보기 →`}
      </button>
    </div>
  );
}
