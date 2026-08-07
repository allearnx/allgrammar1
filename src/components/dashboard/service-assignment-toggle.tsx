'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Check, X } from 'lucide-react';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import { EXAM_PRESETS, resolveExamIntensity, matchPreset, type ExamIntensity } from '@/lib/voca/exam-intensity';

interface ServiceAssignmentToggleProps {
  studentId: string;
  assignedServices: string[];
  allowedServices?: string[];
  vocaBooks?: { id: string; title: string }[];
  assignedBookId?: string | null;
  round2Unlocked?: boolean;
  showRound2Toggle?: boolean;
  vocaRoundMode?: 'book' | 'day';
  showRoundModeToggle?: boolean;
  naesinMemorizeOnly?: boolean;
  showMemorizeToggle?: boolean;
  /** 표제어 시험 강도 초기값 (service_assignments 행) */
  vocaExamIntensity?: ExamIntensity;
  showExamIntensity?: boolean;
  onUpdate?: () => void;
}

const SERVICES = [
  { key: 'naesin', label: '내신' },
  { key: 'voca', label: '올킬보카' },
] as const;

export function ServiceAssignmentToggle({
  studentId,
  assignedServices: initial,
  allowedServices,
  vocaBooks,
  assignedBookId: initialBookId,
  round2Unlocked: initialRound2 = false,
  showRound2Toggle = false,
  vocaRoundMode: initialRoundMode = 'book',
  showRoundModeToggle = false,
  naesinMemorizeOnly: initialMemorize = false,
  showMemorizeToggle = false,
  vocaExamIntensity: initialExam = resolveExamIntensity(null),
  showExamIntensity = false,
  onUpdate,
}: ServiceAssignmentToggleProps) {
  const router = useRouter();
  const [assigned, setAssigned] = useState<Set<string>>(new Set(initial));
  const [loading, setLoading] = useState<string | null>(null);
  const [bookId, setBookId] = useState<string | null>(initialBookId ?? null);
  const [bookLoading, setBookLoading] = useState(false);
  const [round2, setRound2] = useState(initialRound2);
  const [round2Loading, setRound2Loading] = useState(false);
  const [roundMode, setRoundMode] = useState<'book' | 'day'>(initialRoundMode);
  const [roundModeLoading, setRoundModeLoading] = useState(false);
  const [memorize, setMemorize] = useState(initialMemorize);
  const [memorizeLoading, setMemorizeLoading] = useState(false);
  const [exam, setExam] = useState<ExamIntensity>(initialExam);
  const [examLoading, setExamLoading] = useState<string | null>(null);

  async function applyExamPreset(key: string, intensity: ExamIntensity) {
    setExamLoading(key);
    try {
      await fetchWithToast('/api/service-assignments', {
        method: 'PATCH',
        body: {
          studentId,
          vocaExamPassScore: intensity.passScore,
          vocaExamSecondsPerWord: intensity.secondsPerWord,
          vocaExamRetryWrong: intensity.retryWrong,
        },
        successMessage: `표제어 시험 강도: ${EXAM_PRESETS.find((p) => p.key === key)?.label ?? key}`,
        errorMessage: '시험 강도 변경에 실패했습니다',
      });
      setExam(intensity);
      onUpdate?.();
    } catch {
      // fetchWithToast already toasted
    } finally {
      setExamLoading(null);
    }
  }

  async function toggle(service: string) {
    const isAssigned = assigned.has(service);
    setLoading(service);

    try {
      const label = SERVICES.find((s) => s.key === service)?.label || service;

      await fetchWithToast('/api/service-assignments', {
        method: isAssigned ? 'DELETE' : 'POST',
        body: { studentId, service },
        successMessage: isAssigned ? `${label} 해제됨` : `${label} 배정됨`,
        errorMessage: '서비스 배정 변경에 실패했습니다',
        logContext: 'admin.service_assignment',
      });

      // 보카 OFF → 교재 배정도 해제
      if (isAssigned && service === 'voca' && bookId) {
        await fetchWithToast('/api/voca/book-assignments', {
          method: 'DELETE',
          body: { studentId },
          silent: true,
        });
        setBookId(null);
      }

      setAssigned((prev) => {
        const next = new Set(prev);
        if (isAssigned) next.delete(service);
        else next.add(service);
        return next;
      });

      onUpdate?.();
    } catch {
      // fetchWithToast already showed toast and logged
    } finally {
      setLoading(null);
    }
  }

  async function handleBookChange(newBookId: string) {
    if (!newBookId) return;
    setBookLoading(true);
    try {
      const bookTitle = vocaBooks?.find((b) => b.id === newBookId)?.title || '교재';
      await fetchWithToast('/api/voca/book-assignments', {
        body: { studentId, bookId: newBookId },
        successMessage: `${bookTitle} 배정됨`,
        errorMessage: '교재 배정에 실패했습니다',
        logContext: 'admin.service_assignment',
      });
      setBookId(newBookId);
      onUpdate?.();
    } catch {
      // fetchWithToast already showed toast and logged
    } finally {
      setBookLoading(false);
    }
  }

  async function toggleRound2() {
    setRound2Loading(true);
    try {
      await fetchWithToast('/api/service-assignments', {
        method: 'PATCH',
        body: { studentId, round2Unlocked: !round2 },
        successMessage: round2 ? '2회독 잠금' : '2회독 해제',
        errorMessage: '2회독 변경에 실패했습니다',
      });
      setRound2(!round2);
      onUpdate?.();
    } catch {
      // fetchWithToast already showed toast
    } finally {
      setRound2Loading(false);
    }
  }

  async function toggleRoundMode() {
    const next = roundMode === 'book' ? 'day' : 'book';
    setRoundModeLoading(true);
    try {
      await fetchWithToast('/api/service-assignments', {
        method: 'PATCH',
        body: { studentId, vocaRoundMode: next },
        successMessage: next === 'book' ? '책 전체 모드' : 'Day별 완벽 모드',
        errorMessage: '학습 모드 변경에 실패했습니다',
      });
      setRoundMode(next);
      onUpdate?.();
    } catch {
      // fetchWithToast already showed toast
    } finally {
      setRoundModeLoading(false);
    }
  }

  async function toggleMemorize() {
    setMemorizeLoading(true);
    try {
      await fetchWithToast('/api/service-assignments', {
        method: 'PATCH',
        body: { studentId, naesinMemorizeOnly: !memorize },
        successMessage: memorize ? '내신 암기 해제' : '내신 암기 할당',
        errorMessage: '내신 암기 변경에 실패했습니다',
      });
      setMemorize(!memorize);
      onUpdate?.();
      router.refresh();
    } catch {
      // fetchWithToast already showed toast
    } finally {
      setMemorizeLoading(false);
    }
  }

  const vocaOn = assigned.has('voca');
  const showBookSelect = vocaOn && vocaBooks && vocaBooks.length > 0;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {SERVICES.map((s) => {
        const active = assigned.has(s.key);
        const blocked = allowedServices && !allowedServices.includes(s.key);
        return (
          <button
            key={s.key}
            type="button"
            disabled={loading === s.key || !!blocked}
            onClick={() => toggle(s.key)}
            title={blocked ? '현재 플랜에서 사용할 수 없는 서비스입니다' : undefined}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all select-none',
              loading === s.key && 'opacity-50 cursor-wait',
              blocked && 'opacity-40 cursor-not-allowed',
              active
                ? s.key === 'voca'
                  ? 'bg-[#E8F0FE] text-[#1A73E8] font-bold'
                  : 'bg-[#E6F4EA] text-[#188038] font-bold'
                : 'bg-muted text-muted-foreground hover:bg-muted/80 border border-border'
            )}
          >
            {active ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
            {s.label}
          </button>
        );
      })}
      {showBookSelect && (
        <select
          value={bookId || ''}
          onChange={(e) => handleBookChange(e.target.value)}
          disabled={bookLoading}
          className={cn(
            'h-8 rounded-md border border-border bg-background px-2 text-sm',
            bookLoading && 'opacity-50 cursor-wait'
          )}
        >
          <option value="" disabled>교재 선택</option>
          {vocaBooks.map((b) => (
            <option key={b.id} value={b.id}>{b.title}</option>
          ))}
        </select>
      )}
      {vocaOn && showRound2Toggle && (
        <button
          type="button"
          disabled={round2Loading}
          onClick={toggleRound2}
          title="켜면 1회독 없이 바로 2회독부터 시작합니다 (다른 곳에서 이미 1회독을 마친 학생용)"
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all select-none',
            round2Loading && 'opacity-50 cursor-wait',
            round2
              ? 'bg-[#FEF7E0] text-[#B06000] font-bold'
              : 'bg-muted text-muted-foreground hover:bg-muted/80 border border-border'
          )}
        >
          {round2 ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
          2회독
        </button>
      )}
      {vocaOn && showRoundModeToggle && (
        <button
          type="button"
          disabled={roundModeLoading}
          onClick={toggleRoundMode}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all select-none',
            roundModeLoading && 'opacity-50 cursor-wait',
            roundMode === 'day'
              ? 'bg-[#E8F0FE] text-[#1A73E8] font-bold'
              : 'bg-muted text-muted-foreground hover:bg-muted/80 border border-border'
          )}
        >
          {roundMode === 'day' ? 'Day별 완벽' : '책 전체'}
        </button>
      )}
      {showMemorizeToggle && (
        <button
          type="button"
          disabled={memorizeLoading}
          onClick={toggleMemorize}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all select-none',
            memorizeLoading && 'opacity-50 cursor-wait',
            memorize
              ? 'bg-[#E6F4EA] text-[#188038] font-bold'
              : 'bg-muted text-muted-foreground hover:bg-muted/80 border border-border'
          )}
        >
          {memorize ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
          내신 암기
        </button>
      )}
      {vocaOn && showExamIntensity && (
        <div className="flex w-full items-center gap-1.5 pt-1">
          <span className="text-xs text-muted-foreground shrink-0">표제어 시험 강도</span>
          {EXAM_PRESETS.map((p) => {
            const active = matchPreset(exam) === p.key;
            return (
              <button
                key={p.key}
                type="button"
                disabled={examLoading !== null}
                onClick={() => applyExamPreset(p.key, p.intensity)}
                title={p.hint}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-all select-none',
                  examLoading === p.key && 'opacity-50 cursor-wait',
                  active
                    ? 'bg-[#FEF7E0] text-[#B06000] font-bold'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80 border border-border',
                )}
              >
                {p.label}
              </button>
            );
          })}
          <span className="text-[11px] text-muted-foreground/70 shrink-0">
            합격 {exam.passScore}{exam.secondsPerWord > 0 ? ` · 단어당 ${exam.secondsPerWord}초(긴 단어 연장)` : ''}
          </span>
        </div>
      )}
    </div>
  );
}
