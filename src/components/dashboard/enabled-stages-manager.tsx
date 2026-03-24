'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Save, Loader2, BookOpen, FileText, GraduationCap, ClipboardList, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

type StageKey = 'vocab' | 'passage' | 'grammar' | 'problem' | 'lastReview';

const ALL_STAGES: StageKey[] = ['vocab', 'passage', 'grammar', 'problem', 'lastReview'];

const STAGE_OPTIONS: { value: StageKey; label: string; icon: typeof BookOpen }[] = [
  { value: 'vocab', label: '단어 암기', icon: BookOpen },
  { value: 'passage', label: '교과서 암기', icon: FileText },
  { value: 'grammar', label: '문법 설명', icon: GraduationCap },
  { value: 'problem', label: '문제풀이', icon: ClipboardList },
  { value: 'lastReview', label: '직전보강', icon: Brain },
];

const PRESETS: { label: string; stages: StageKey[] }[] = [
  { label: '단어+교과서만', stages: ['vocab', 'passage'] },
  { label: '전체', stages: ALL_STAGES },
];

interface Props {
  studentId: string;
  initialStages: StageKey[];
}

export function EnabledStagesManager({ studentId, initialStages }: Props) {
  const [stages, setStages] = useState<StageKey[]>(initialStages);
  const [saving, setSaving] = useState(false);

  const hasChanges = JSON.stringify([...stages].sort()) !== JSON.stringify([...initialStages].sort());

  function toggleStage(stage: StageKey) {
    setStages((prev) =>
      prev.includes(stage) ? prev.filter((s) => s !== stage) : [...prev, stage]
    );
  }

  function applyPreset(preset: StageKey[]) {
    setStages(preset);
  }

  async function handleSave() {
    if (stages.length === 0) {
      toast.error('최소 1개 단계를 선택해야 합니다');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/naesin/enabled-stages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, stages }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || '저장 실패');
      }
      toast.success('활성 단계가 저장되었습니다');
    } catch (err) {
      logger.error('admin.enabled_stages', { error: err instanceof Error ? err.message : String(err) });
      toast.error(err instanceof Error ? err.message : '저장 중 오류가 발생했습니다');
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
            const checked = stages.includes(option.value);
            return (
              <label
                key={option.value}
                className="flex items-center gap-3 cursor-pointer py-1"
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => toggleStage(option.value)}
                />
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{option.label}</span>
              </label>
            );
          })}
        </div>

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
