'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, X, Save, Loader2, FileText, Shuffle, PenLine, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type StageType = 'fill_blanks' | 'ordering' | 'translation' | 'grammar_vocab';

const STAGE_OPTIONS: { value: StageType; label: string; icon: typeof FileText }[] = [
  { value: 'fill_blanks', label: '빈칸 채우기', icon: FileText },
  { value: 'ordering', label: '순서 배열', icon: Shuffle },
  { value: 'translation', label: '영작', icon: PenLine },
  { value: 'grammar_vocab', label: '어법/어휘', icon: BookOpen },
];

interface Props {
  studentId: string;
  initialStages: StageType[];
  initialTranslationSentencesPerPage?: number;
}

export function PassageStageManager({ studentId, initialStages, initialTranslationSentencesPerPage = 10 }: Props) {
  const [stages, setStages] = useState<StageType[]>(initialStages);
  const [sentencesPerPage, setSentencesPerPage] = useState(initialTranslationSentencesPerPage);
  const [saving, setSaving] = useState(false);

  const hasChanges =
    JSON.stringify(stages) !== JSON.stringify(initialStages) ||
    sentencesPerPage !== initialTranslationSentencesPerPage;

  function addStage(stage: StageType) {
    if (stages.length >= 6) return;
    setStages([...stages, stage]);
  }

  function removeStage(index: number) {
    if (stages.length <= 1) return;
    setStages(stages.filter((_, i) => i !== index));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch('/api/naesin/passage-stages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          stages,
          translationSentencesPerPage: sentencesPerPage,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || '저장 실패');
      }
      toast.success('교과서 암기 단계가 저장되었습니다');
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : '저장 중 오류가 발생했습니다');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardContent className="py-4 space-y-3">
        {/* Current stages */}
        <div className="flex flex-wrap gap-2">
          {stages.map((stage, idx) => {
            const config = STAGE_OPTIONS.find((o) => o.value === stage)!;
            const Icon = config.icon;
            return (
              <Badge
                key={idx}
                variant="secondary"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm"
              >
                <Icon className="h-3.5 w-3.5" />
                {config.label}
                {stages.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeStage(idx)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </Badge>
            );
          })}
        </div>

        {/* Add buttons */}
        <div className="flex flex-wrap gap-2">
          {STAGE_OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <Button
                key={option.value}
                variant="outline"
                size="sm"
                onClick={() => addStage(option.value)}
                disabled={stages.length >= 6}
                className="text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                <Icon className="h-3 w-3 mr-1" />
                {option.label}
              </Button>
            );
          })}
        </div>

        {/* Translation sentences per page */}
        <div className="flex items-center gap-3">
          <Label htmlFor="sentences-per-page" className="text-sm whitespace-nowrap">
            영작 한 번에 풀 문장 수
          </Label>
          <Input
            id="sentences-per-page"
            type="number"
            min={1}
            max={50}
            value={sentencesPerPage}
            onChange={(e) => setSentencesPerPage(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
            className="w-20 h-8 text-sm"
          />
        </div>

        {/* Save */}
        {hasChanges && (
          <Button onClick={handleSave} disabled={saving} size="sm" className={cn('w-full')}>
            {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            저장
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
