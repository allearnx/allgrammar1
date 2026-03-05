'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BookOpen,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { LessonCard } from '@/components/naesin/lesson-card';
import { ExamCountdown } from '@/components/naesin/exam-countdown';
import { ExamDatePicker } from '@/components/naesin/exam-date-picker';
import type {
  NaesinTextbook,
  NaesinStageStatuses,
} from '@/types/database';

interface UnitSummary {
  id: string;
  unit_number: number;
  title: string;
  sort_order: number;
  stageStatuses: NaesinStageStatuses;
  stageProgress: { vocab: number; passage: number; grammar: number; problem: number };
}

interface NaesinHomeProps {
  textbooks: NaesinTextbook[];
  selectedTextbook: NaesinTextbook | null;
  units: UnitSummary[];
  examDate?: string | null;
  textbookId?: string | null;
}

export function NaesinHome({ textbooks, selectedTextbook, units, examDate: initialExamDate, textbookId }: NaesinHomeProps) {
  const router = useRouter();
  const [selecting, setSelecting] = useState(!selectedTextbook);
  const [saving, setSaving] = useState(false);
  const [examDate, setExamDate] = useState(initialExamDate || null);

  async function selectTextbook(tbId: string) {
    setSaving(true);
    try {
      const res = await fetch('/api/naesin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ textbookId: tbId }),
      });
      if (!res.ok) throw new Error();
      toast.success('교과서가 선택되었습니다');
      router.refresh();
      setSelecting(false);
    } catch {
      toast.error('교과서 선택 중 오류가 발생했습니다');
    } finally {
      setSaving(false);
    }
  }

  // Textbook selection view
  if (selecting || !selectedTextbook) {
    const gradeTextbooks: Record<number, NaesinTextbook[]> = {};
    textbooks.forEach((tb) => {
      if (!gradeTextbooks[tb.grade]) gradeTextbooks[tb.grade] = [];
      gradeTextbooks[tb.grade].push(tb);
    });

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold">교과서 선택</h2>
          <p className="text-muted-foreground mt-1">
            학년과 교과서를 선택하면 내신 대비 학습이 시작됩니다.
          </p>
        </div>

        {textbooks.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            등록된 교과서가 없습니다. 관리자에게 문의하세요.
          </p>
        ) : (
          <Tabs defaultValue="1">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="1">중1</TabsTrigger>
              <TabsTrigger value="2">중2</TabsTrigger>
              <TabsTrigger value="3">중3</TabsTrigger>
            </TabsList>

            {[1, 2, 3].map((grade) => (
              <TabsContent key={grade} value={String(grade)} className="mt-4">
                {gradeTextbooks[grade]?.length ? (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {gradeTextbooks[grade].map((tb) => (
                      <Card
                        key={tb.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => !saving && selectTextbook(tb.id)}
                      >
                        <CardContent className="py-6 text-center">
                          <BookOpen className="h-10 w-10 mx-auto text-primary mb-3" />
                          <p className="font-medium">{tb.display_name}</p>
                          <p className="text-sm text-muted-foreground mt-1">{tb.publisher}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    중{grade} 교과서가 아직 등록되지 않았습니다.
                  </p>
                )}
              </TabsContent>
            ))}
          </Tabs>
        )}

        {selectedTextbook && (
          <Button variant="ghost" onClick={() => setSelecting(false)}>
            취소
          </Button>
        )}
      </div>
    );
  }

  // Units overview with LessonCard per unit
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">{selectedTextbook.display_name}</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {selectedTextbook.publisher} · 중{selectedTextbook.grade}
          </p>
        </div>
        <div className="flex gap-2">
          {textbookId && (
            <ExamDatePicker
              textbookId={textbookId}
              currentDate={examDate}
              onDateChange={(date) => {
                setExamDate(date);
                router.refresh();
              }}
            />
          )}
          <Button variant="outline" size="sm" onClick={() => setSelecting(true)}>
            <RefreshCw className="h-4 w-4 mr-1" />
            교과서 변경
          </Button>
        </div>
      </div>

      {examDate && <ExamCountdown examDate={examDate} />}

      {units.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          등록된 단원이 없습니다.
        </p>
      ) : (
        <div className="space-y-3">
          {units.map((unit) => (
            <LessonCard
              key={unit.id}
              unitId={unit.id}
              unitNumber={unit.unit_number}
              title={unit.title}
              stages={unit.stageStatuses}
              stageProgress={unit.stageProgress}
            />
          ))}
        </div>
      )}
    </div>
  );
}
