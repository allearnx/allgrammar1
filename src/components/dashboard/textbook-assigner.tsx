'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, MessageCircle } from 'lucide-react';
import { fetchWithToast } from '@/lib/fetch-with-toast';

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

const GRADE_LABELS: Record<number, string> = { 1: '중1', 2: '중2', 3: '중3' };

export function TextbookAssigner({ studentId, textbooks, currentTextbookName }: Props) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string>('');
  const [saving, setSaving] = useState(false);

  if (currentTextbookName) {
    return (
      <div className="rounded-lg border p-4 space-y-2">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">교과서</span>
          <span className="text-sm text-muted-foreground">{currentTextbookName}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          교과서는 한 번 선택하면 변경이 어렵습니다. 변경이 필요하시면 아래 카카오톡 채널로 문의해 주세요.
        </p>
        <a
          href="http://pf.kakao.com/_iLxcLG/chat"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-yellow-600 hover:underline dark:text-yellow-400"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          카카오톡 채널 문의하기
        </a>
      </div>
    );
  }

  async function assign() {
    if (!selectedId) return;
    setSaving(true);
    try {
      await fetchWithToast('/api/naesin/settings', {
        body: { textbookId: selectedId, studentId },
        successMessage: '교과서가 배정되었습니다',
        errorMessage: '교과서 배정 중 오류가 발생했습니다',
        logContext: 'textbook_assigner',
      });
      router.refresh();
    } catch {
      // fetchWithToast already showed toast and logged
    } finally {
      setSaving(false);
    }
  }

  // Group by grade
  const grouped = textbooks.reduce<Record<number, Textbook[]>>((acc, tb) => {
    (acc[tb.grade] ??= []).push(tb);
    return acc;
  }, {});

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center gap-2">
        <BookOpen className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">교과서 배정</span>
      </div>
      <p className="text-xs text-muted-foreground">
        학생에게 사용할 교과서를 배정해 주세요. 한 번 배정하면 변경이 어렵습니다.
      </p>
      <div className="flex items-center gap-2">
        <Select value={selectedId} onValueChange={setSelectedId}>
          <SelectTrigger className="w-full max-w-xs">
            <SelectValue placeholder="교과서를 선택하세요" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(grouped)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([grade, books]) => (
                <div key={grade}>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    {GRADE_LABELS[Number(grade)] || `${grade}학년`}
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
        <Button size="sm" onClick={assign} disabled={!selectedId || saving}>
          {saving ? '배정 중...' : '배정'}
        </Button>
      </div>
    </div>
  );
}
