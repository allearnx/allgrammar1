'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, RefreshCw } from 'lucide-react';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import { gradeLabel } from '@/lib/naesin/grade-label';

interface Textbook {
  id: string;
  grade: number;
  publisher: string;
  display_name: string;
}

interface Props {
  studentId: string;
  textbooks: Textbook[];
  currentTextbookName?: string | null;
}

function TextbookSelect({ textbooks, value, onChange }: {
  textbooks: Textbook[]; value: string; onChange: (v: string) => void;
}) {
  const grouped = textbooks.reduce<Record<number, Textbook[]>>((acc, tb) => {
    (acc[tb.grade] ??= []).push(tb);
    return acc;
  }, {});

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full max-w-xs">
        <SelectValue placeholder="교과서를 선택하세요" />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(grouped)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([grade, books]) => (
            <div key={grade}>
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                {gradeLabel(Number(grade))}
              </div>
              {books.map((tb) => (
                <SelectItem key={tb.id} value={tb.id}>
                  {tb.display_name}
                </SelectItem>
              ))}
            </div>
          ))}
      </SelectContent>
    </Select>
  );
}

/** 교과서 배정/변경 — 스태프 화면(학생 상세) 전용. 변경 권한은 API 게이트가 검증
 *  (boss 항상 + naesin_enabled 학원의 teacher/admin만). */
export function TextbookAssigner({ studentId, textbooks, currentTextbookName }: Props) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [changing, setChanging] = useState(false);

  const isChange = Boolean(currentTextbookName);

  async function submit() {
    if (!selectedId) return;
    setSaving(true);
    try {
      await fetchWithToast('/api/naesin/settings', {
        body: { textbookId: selectedId, studentId },
        successMessage: isChange ? '교과서가 변경되었습니다' : '교과서가 배정되었습니다',
        errorMessage: isChange ? '교과서 변경 중 오류가 발생했습니다' : '교과서 배정 중 오류가 발생했습니다',
        logContext: 'textbook_assigner',
      });
      setChanging(false);
      setSelectedId('');
      router.refresh();
    } catch {
      // fetchWithToast already showed toast and logged
    } finally {
      setSaving(false);
    }
  }

  if (isChange && !changing) {
    return (
      <div className="rounded-lg border p-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">교과서</span>
            <span className="text-sm text-muted-foreground">{currentTextbookName}</span>
          </div>
          <Button size="sm" variant="outline" onClick={() => setChanging(true)}>
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            교과서 변경
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center gap-2">
        <BookOpen className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">{isChange ? '교과서 변경' : '교과서 배정'}</span>
        {isChange && <span className="text-xs text-muted-foreground">현재: {currentTextbookName}</span>}
      </div>
      <p className="text-xs text-muted-foreground">
        {isChange
          ? '변경하면 학생 화면이 새 교과서 단원으로 바뀝니다. 기존 교과서의 진도·오답 기록은 보존되며, 다시 되돌리면 그대로 복원됩니다. 새 교과서의 시험 배정(날짜·범위)은 변경 후 따로 등록해 주세요.'
          : '학생에게 사용할 교과서를 배정해 주세요.'}
      </p>
      <div className="flex items-center gap-2">
        <TextbookSelect textbooks={textbooks} value={selectedId} onChange={setSelectedId} />
        <Button size="sm" onClick={submit} disabled={!selectedId || saving}>
          {saving ? '저장 중...' : isChange ? '변경하기' : '배정'}
        </Button>
        {isChange && (
          <Button size="sm" variant="ghost" onClick={() => { setChanging(false); setSelectedId(''); }} disabled={saving}>
            취소
          </Button>
        )}
      </div>
    </div>
  );
}
