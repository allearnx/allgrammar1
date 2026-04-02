'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Save, Loader2, BookOpen, FileText, PlayCircle, GraduationCap, ClipboardList, FileQuestion, Brain, Lock, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import Link from 'next/link';
import type { Tier } from '@/lib/billing/feature-gate';

type StageKey = 'vocab' | 'passage' | 'dialogue' | 'textbookVideo' | 'grammar' | 'problem' | 'mockExam' | 'lastReview';

const FREE_STAGES: StageKey[] = ['vocab', 'passage', 'dialogue'];
const ALL_STAGES: StageKey[] = ['vocab', 'passage', 'dialogue', 'textbookVideo', 'grammar', 'problem', 'mockExam', 'lastReview'];

const STAGE_OPTIONS: { value: StageKey; label: string; icon: typeof BookOpen }[] = [
  { value: 'vocab', label: '단어 암기', icon: BookOpen },
  { value: 'passage', label: '교과서 암기', icon: FileText },
  { value: 'dialogue', label: '대화문 암기', icon: FileText },
  { value: 'textbookVideo', label: '설명 영상', icon: PlayCircle },
  { value: 'grammar', label: '문법 설명', icon: GraduationCap },
  { value: 'problem', label: '문제풀이', icon: ClipboardList },
  { value: 'mockExam', label: '예상문제', icon: FileQuestion },
  { value: 'lastReview', label: '직전보강', icon: Brain },
];

const PRESETS: { label: string; stages: StageKey[] }[] = [
  { label: '단어+교과서만', stages: ['vocab', 'passage'] },
  { label: '전체', stages: ALL_STAGES },
];

interface Props {
  studentId: string;
  initialStages: StageKey[];
  tier?: Tier;
}

export function EnabledStagesManager({ studentId, initialStages, tier = 'paid' }: Props) {
  const [stages, setStages] = useState<StageKey[]>(initialStages);
  const [saving, setSaving] = useState(false);
  const isFree = tier === 'free';

  const hasChanges = JSON.stringify([...stages].sort()) !== JSON.stringify([...initialStages].sort());

  function isLocked(stage: StageKey) {
    return isFree && !FREE_STAGES.includes(stage);
  }

  function toggleStage(stage: StageKey) {
    if (isLocked(stage)) return;
    setStages((prev) =>
      prev.includes(stage) ? prev.filter((s) => s !== stage) : [...prev, stage]
    );
  }

  function applyPreset(preset: StageKey[]) {
    setStages(isFree ? preset.filter((s) => FREE_STAGES.includes(s)) : preset);
  }

  async function handleSave() {
    if (stages.length === 0) {
      toast.error('최소 1개 단계를 선택해야 합니다');
      return;
    }
    setSaving(true);
    try {
      await fetchWithToast('/api/naesin/enabled-stages', {
        body: { studentId, stages },
        successMessage: '활성 단계가 저장되었습니다',
        errorMessage: '저장 중 오류가 발생했습니다',
        logContext: 'admin.enabled_stages',
      });
    } catch {
      // fetchWithToast already showed toast and logged
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardContent className="py-4 space-y-3">
        {/* Stage checkboxes */}
        <div className="space-y-2">
          {STAGE_OPTIONS.map((option) => {
            const Icon = option.icon;
            const locked = isLocked(option.value);
            const checked = stages.includes(option.value);
            return (
              <label
                key={option.value}
                className={cn(
                  'flex items-center gap-3 py-1',
                  locked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
                )}
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => toggleStage(option.value)}
                  disabled={locked}
                />
                {locked ? (
                  <Lock className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Icon className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-sm">{option.label}</span>
                {locked && (
                  <span className="text-[10px] text-muted-foreground ml-auto">Pro</span>
                )}
              </label>
            );
          })}
        </div>

        {/* Pro upgrade nudge */}
        {isFree && (
          <Link
            href="/boss/billing"
            className="flex items-center gap-2 rounded-lg bg-violet-50 px-3 py-2.5 text-sm text-violet-700 hover:bg-violet-100 transition-colors dark:bg-violet-950/40 dark:text-violet-300 dark:hover:bg-violet-950/60"
          >
            <ArrowUpRight className="h-4 w-4 shrink-0" />
            <span>문법, 문제풀이 등 전체 단계를 <strong>Pro 플랜</strong>으로 이용해 보세요</span>
          </Link>
        )}

        {/* Presets */}
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <Button
              key={preset.label}
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => applyPreset(preset.stages)}
            >
              {preset.label}
            </Button>
          ))}
        </div>

        {/* Save */}
        {hasChanges && (
          <Button
            onClick={handleSave}
            disabled={saving || stages.length === 0}
            size="sm"
            className={cn('w-full')}
          >
            {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            저장
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
