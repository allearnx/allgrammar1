'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { RhythmSpelling } from '@/components/voca/neon/rhythm-spelling';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import { shuffle } from '@/lib/utils';
import { VOCA_VOCABULARY_COLUMNS, type VocaVocabulary } from '@/types/voca';
import { DEFAULT_EXAM_INTENSITY, type ExamIntensity } from '@/lib/voca/exam-intensity';
import { Round2SynAntExam } from '@/components/voca/round2-syn-ant-exam';

type WrongWord = { front_text: string; back_text: string };
interface Assignment {
  id: string;
  bookId: string;
  dayIds: string[];
  title: string | null;
  secondsPerWord: number | null;
  examType: 'headword' | 'syn_ant';
  bestScore: number | null;
  attempts: number;
}

/** 학생 홈 — 선생님이 배정한 묶음 시험 목록 + 응시 */
export function AssignedExams({ intensity = DEFAULT_EXAM_INTENSITY }: { intensity?: ExamIntensity }) {
  const PASS = intensity.passScore;
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [dayTitles, setDayTitles] = useState<Record<string, string>>({});
  const [active, setActive] = useState<Assignment | null>(null);
  const [vocab, setVocab] = useState<VocaVocabulary[]>([]);
  // 배정 시험에 시간 오버라이드가 있으면 그 초로, 없으면 학생 강도의 시간
  const activeSeconds = active?.secondsPerWord ?? intensity.secondsPerWord;

  const load = useCallback(async () => {
    try {
      const data = await fetchWithToast<{ assignments: Assignment[]; dayTitles: Record<string, string> }>(
        '/api/voca/exam-assignments/mine',
        { method: 'GET', silent: true },
      );
      setAssignments(data?.assignments ?? []);
      setDayTitles(data?.dayTitles ?? {});
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { load(); }, [load]);

  const rangeLabel = (a: Assignment) =>
    a.title?.trim() || a.dayIds.map((id) => dayTitles[id] ?? '?').join(' + ');

  async function start(a: Assignment) {
    // 2회독(유의어·반의어)은 Round2SynAntExam이 자체 로드 → 바로 활성화
    if (a.examType === 'syn_ant') { setActive(a); return; }
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const sb = createClient();
      const { data } = await sb
        .from('voca_vocabulary')
        .select(VOCA_VOCABULARY_COLUMNS)
        .in('day_id', a.dayIds)
        .order('sort_order');
      const v = (data as VocaVocabulary[] | null) ?? [];
      if (v.length === 0) { toast.error('시험 단어를 불러오지 못했어요.'); return; }
      setVocab(shuffle([...v]));
      setActive(a);
    } catch { toast.error('시험 단어를 불러오지 못했어요.'); }
  }

  async function handleComplete(score: number, wrongWords?: WrongWord[]) {
    const a = active;
    setActive(null);
    if (!a) return;
    try {
      await fetchWithToast('/api/voca/exam', {
        body: { bookId: a.bookId, dayIds: a.dayIds, score, wrongWords, assignmentId: a.id },
        retry: 2, // 네트워크 순단 자동 재시도
        errorMessage: '⚠️ 시험 결과 저장에 실패했어요 — 점수가 기록되지 않았습니다. 네트워크 확인 후 다시 응시해주세요.',
      });
    } catch { return; } // 저장 실패 시 통과 토스트를 띄우지 않음
    if (score >= PASS) toast.success(`🎉 시험 통과! ${score}점`);
    else toast.info(`${score}점 — ${PASS}점 넘으면 통과예요.`);
    load();
  }

  if (active) {
    if (active.examType === 'syn_ant') {
      return (
        <div className="space-y-3">
          <button onClick={() => setActive(null)} className="text-sm font-medium text-gray-500 hover:text-gray-700">← 그만두기</button>
          <Round2SynAntExam
            days={[]}
            bookId={active.bookId}
            intensity={{ ...intensity, secondsPerWord: activeSeconds }}
            assignment={{ id: active.id, dayIds: active.dayIds, title: rangeLabel(active) }}
            onDone={() => { setActive(null); load(); }}
          />
        </div>
      );
    }
    return (
      <div className="space-y-3">
        <button onClick={() => setActive(null)} className="text-sm font-medium text-gray-500 hover:text-gray-700">← 그만두기</button>
        <div className="rounded-2xl bg-accent px-4 py-3 text-center">
          <p className="voca-display text-lg text-primary" style={{ fontWeight: 700 }}>📋 선생님이 낸 시험</p>
          <p className="mt-0.5 text-xs text-primary">{rangeLabel(active)} · {vocab.length}단어 · {PASS}점 통과{activeSeconds > 0 ? ` · 단어당 ${activeSeconds}초(긴 단어는 자동 연장)` : ''}</p>
        </div>
        <RhythmSpelling
          vocabulary={vocab}
          storageContext={`assigned:${active.id}`}
          onComplete={handleComplete}
          examMode
          passThreshold={PASS}
          secondsPerWord={activeSeconds}
        />
      </div>
    );
  }

  if (assignments.length === 0) return null;

  return (
    <div className="rounded-3xl border-2 border-[#d2e3fc] bg-accent/50 p-4 space-y-2">
      <p className="voca-display text-primary" style={{ fontWeight: 700 }}>📋 선생님이 낸 시험</p>
      {assignments.map((a) => (
        <div key={a.id} className="flex items-center justify-between gap-2 rounded-2xl bg-white px-4 py-3">
          <div className="min-w-0">
            <p className="truncate font-semibold text-gray-800">
              <span className="mr-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold" style={{ background: a.examType === 'syn_ant' ? '#E8F0FE' : '#E6F4EA', color: a.examType === 'syn_ant' ? '#174EA6' : '#188038' }}>
                {a.examType === 'syn_ant' ? '2회독' : '1회독'}
              </span>
              {rangeLabel(a)}
            </p>
            {a.bestScore != null && (
              <p className="text-xs text-gray-400">최고 {a.bestScore}점 · {a.attempts}회 응시</p>
            )}
          </div>
          <button
            onClick={() => start(a)}
            className="shrink-0 rounded-full bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90"
          >
            {a.bestScore != null ? '다시 보기' : '시험 보기 →'}
          </button>
        </div>
      ))}
    </div>
  );
}
