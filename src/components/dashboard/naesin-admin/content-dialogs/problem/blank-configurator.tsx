'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Wand2, Upload, Loader2, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import type { BlankItem } from '@/types/textbook';

type DifficultyKey = 'easy' | 'medium' | 'hard';

const AUTO_INTERVAL: Record<DifficultyKey, number> = { easy: 5, medium: 3, hard: 2 };
const DIFFICULTY_LABEL: Record<DifficultyKey, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };

function generateAutoBlanks(originalText: string, difficulty: DifficultyKey): BlankItem[] {
  const words = originalText.trim().split(/\s+/);
  const interval = AUTO_INTERVAL[difficulty];
  return words
    .map((w, i) => ({ index: i, answer: w }))
    .filter((_, i) => i % interval === interval - 1);
}

export function BlankConfigurator({
  difficulty,
  originalText,
  blanks,
  onUpdate,
}: {
  difficulty: DifficultyKey;
  originalText: string;
  blanks: BlankItem[] | null;
  onUpdate: (blanks: BlankItem[] | null) => void;
}) {
  const [extracting, setExtracting] = useState(false);
  const label = DIFFICULTY_LABEL[difficulty];

  async function handlePdfUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!originalText.trim()) {
      toast.error('영어 원문을 먼저 입력해주세요.');
      return;
    }

    setExtracting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('original_text', originalText);
      const data = await fetchWithToast<{ blanks: BlankItem[] }>('/api/naesin/passages/extract-blanks', {
        body: formData,
        errorMessage: 'PDF 추출 실패',
      });
      onUpdate(data.blanks);
      toast.success(`${label}: ${data.blanks.length}개 빈칸 추출됨`);
    } catch { /* fetchWithToast handles error toast */ } finally {
      setExtracting(false);
    }
  }

  function handleAutoGenerate() {
    if (!originalText.trim()) {
      toast.error('영어 원문을 먼저 입력해주세요.');
      return;
    }
    const generated = generateAutoBlanks(originalText, difficulty);
    onUpdate(generated);
    toast.success(`${label}: ${generated.length}개 빈칸 자동 생성됨`);
  }

  const hasOriginal = originalText.trim().length > 0;

  return (
    <div className="flex items-center gap-1.5">
      <span className="min-w-[52px] text-xs font-medium">{label}</span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-7 text-xs"
        disabled={!hasOriginal}
        onClick={handleAutoGenerate}
      >
        <Wand2 className="h-3 w-3 mr-1" />자동
      </Button>
      <input
        type="file"
        accept=".pdf"
        className="hidden"
        id={`pdf-${difficulty}`}
        onChange={handlePdfUpload}
        disabled={extracting || !hasOriginal}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-7 text-xs"
        disabled={extracting || !hasOriginal}
        onClick={() => document.getElementById(`pdf-${difficulty}`)?.click()}
      >
        {extracting ? (
          <><Loader2 className="h-3 w-3 mr-1 animate-spin" />추출 중...</>
        ) : (
          <><Upload className="h-3 w-3 mr-1" />PDF</>
        )}
      </Button>
      {blanks ? (
        <span className="text-xs text-green-600 flex items-center gap-0.5 whitespace-nowrap">
          <Check className="h-3 w-3" />{blanks.length}개
          <button type="button" className="ml-0.5 text-muted-foreground hover:text-destructive" onClick={() => onUpdate(null)}>
            <X className="h-3 w-3" />
          </button>
        </span>
      ) : (
        <span className="text-xs text-muted-foreground">미설정</span>
      )}
    </div>
  );
}
