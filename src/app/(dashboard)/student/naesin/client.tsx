'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import {
  ClipboardList,
  Info,
} from 'lucide-react';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import Link from 'next/link';
import { LessonCard } from '@/components/naesin/lesson-card';
import { ExamCountdown } from '@/components/naesin/exam-countdown';
import type { NaesinTextbook } from '@/types/database';
import type { UnitSummary, ExamGroup } from '@/lib/naesin/build-unit-summary';
import { TextbookSelector } from './textbook-selector';

interface NaesinHomeProps {
  textbooks: NaesinTextbook[];
  selectedTextbook: NaesinTextbook | null;
  units: UnitSummary[];
  examDate?: string | null;
  examGroups?: ExamGroup[];
}

export function NaesinHome({
  textbooks,
  selectedTextbook,
  units,
  examDate: initialExamDate,
  examGroups = [],
}: NaesinHomeProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function selectTextbook(tbId: string) {
    setSaving(true);
    try {
      await fetchWithToast('/api/naesin/settings', {
        body: { textbookId: tbId },
        successMessage: '교과서가 선택되었습니다',
        errorMessage: '교과서 선택 중 오류가 발생했습니다',
      });
      router.refresh();
    } catch {
      // error toast already shown by fetchWithToast
    } finally {
      setSaving(false);
    }
  }

  if (!selectedTextbook) {
    return (
      <TextbookSelector
        textbooks={textbooks}
        onSelect={selectTextbook}
        saving={saving}
      />
    );
  }

  const hasExamGroups = examGroups.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">{selectedTextbook.display_name}</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {selectedTextbook.publisher} · 중{selectedTextbook.grade}
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Info className="h-3.5 w-3.5" />
          <span>변경 시 선생님 문의</span>
        </div>
      </div>

      {/* 교재 OMR 진입 */}
      <Link href="/student/naesin/workbook-omr">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="py-4 flex items-center gap-3">
            <ClipboardList className="h-8 w-8 text-blue-500 shrink-0" />
            <div>
              <p className="font-medium">교재 OMR</p>
              <p className="text-sm text-muted-foreground">내신 문제집 OMR 채점</p>
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* Show exam-grouped view if assignments exist */}
      {hasExamGroups ? (
        <div className="space-y-6">
          {examGroups.map((group) => (
            <div key={group.round} className="space-y-3">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold">{group.label}</h3>
                {group.examDate && (
                  <ExamCountdown examDate={group.examDate} className="flex-1" />
                )}
                {!group.examDate && (
                  <span className="text-sm text-muted-foreground">(시험일 미배정)</span>
                )}
              </div>
              {group.units.length === 0 ? (
                <div className="flex flex-col items-center py-12">
                <ClipboardList className="h-10 w-10 text-muted-foreground/30 mb-2" />
                <p className="text-center text-muted-foreground text-sm">
                  배정된 단원이 없습니다.
                </p>
              </div>
              ) : (
                <div className="space-y-3">
                  {group.units.map((unit) => (
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
          ))}
        </div>
      ) : (
        <>
          {/* Legacy: flat display when no exam assignments */}
          {initialExamDate && <ExamCountdown examDate={initialExamDate} />}

          {units.length === 0 ? (
            <div className="flex flex-col items-center py-12">
              <ClipboardList className="h-10 w-10 text-muted-foreground/30 mb-2" />
              <p className="text-center text-muted-foreground">
                등록된 단원이 없습니다.
              </p>
            </div>
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
        </>
      )}
    </div>
  );
}
