'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BookOpen,
  ClipboardList,
  ChevronRight,
  Sparkles,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { LessonCard } from '@/components/naesin/lesson-card';
import { ExamCountdown } from '@/components/naesin/exam-countdown';
import type { NaesinTextbook } from '@/types/database';
import type { UnitSummary, ExamGroup } from '@/lib/naesin/build-unit-summary';

const GRADE_COLORS = [
  { accent: '#06B6D4', light: '#ECFEFF', mid: '#CFFAFE', text: '#0891B2' },
  { accent: '#8B5CF6', light: '#F5F3FF', mid: '#EDE9FE', text: '#7C3AED' },
  { accent: '#F59E0B', light: '#FFFBEB', mid: '#FEF3C7', text: '#D97706' },
];

const PUBLISHER_PALETTES = [
  { bg: 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)', spine: '#3B82F6', text: '#1E40AF' },
  { bg: 'linear-gradient(135deg, #FCE7F3 0%, #FBCFE8 100%)', spine: '#EC4899', text: '#BE185D' },
  { bg: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)', spine: '#10B981', text: '#065F46' },
  { bg: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)', spine: '#F59E0B', text: '#92400E' },
  { bg: 'linear-gradient(135deg, #E0E7FF 0%, #C7D2FE 100%)', spine: '#6366F1', text: '#3730A3' },
  { bg: 'linear-gradient(135deg, #FFE4E6 0%, #FECDD3 100%)', spine: '#F43F5E', text: '#9F1239' },
  { bg: 'linear-gradient(135deg, #CCFBF1 0%, #99F6E4 100%)', spine: '#14B8A6', text: '#115E59' },
  { bg: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)', spine: '#EF4444', text: '#991B1B' },
];

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
  const [confirmId, setConfirmId] = useState<string | null>(null);

  async function selectTextbook(tbId: string) {
    setSaving(true);
    try {
      const res = await fetch('/api/naesin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ textbookId: tbId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || '요청에 실패했습니다');
      }
      toast.success('교과서가 선택되었습니다');
      setConfirmId(null);
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error('교과서 선택 중 오류가 발생했습니다');
    } finally {
      setSaving(false);
    }
  }

  // Textbook selection view (only when no textbook selected)
  if (!selectedTextbook) {
    const gradeTextbooks: Record<number, NaesinTextbook[]> = {};
    textbooks.forEach((tb) => {
      if (!gradeTextbooks[tb.grade]) gradeTextbooks[tb.grade] = [];
      gradeTextbooks[tb.grade].push(tb);
    });

    const publisherColorMap = new Map<string, typeof PUBLISHER_PALETTES[0]>();
    let colorIdx = 0;
    textbooks.forEach((tb) => {
      if (!publisherColorMap.has(tb.publisher)) {
        publisherColorMap.set(tb.publisher, PUBLISHER_PALETTES[colorIdx % PUBLISHER_PALETTES.length]);
        colorIdx++;
      }
    });

    return (
      <div className="space-y-5">
        {/* 헤더 */}
        <div
          className="relative overflow-hidden rounded-2xl px-5 py-6"
          style={{ background: 'linear-gradient(135deg, #0891B2 0%, #06B6D4 50%, #22D3EE 100%)' }}
        >
          <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} />
          <div className="absolute -bottom-6 -left-6 h-24 w-24 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-5 w-5 text-white/90" />
              <h2 className="text-lg font-bold text-white">교과서를 선택하세요</h2>
            </div>
            <p className="text-sm text-white/70">학년과 교과서를 선택하면 내신 대비 학습이 시작됩니다</p>
          </div>
        </div>

        {textbooks.length === 0 ? (
          <div className="flex flex-col items-center py-16 rounded-2xl border-2 border-dashed border-gray-200">
            <BookOpen className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-center text-gray-400 font-medium">
              등록된 교과서가 없습니다
            </p>
            <p className="text-center text-gray-300 text-sm mt-1">관리자에게 문의하세요</p>
          </div>
        ) : (
          <>
          {/* 경고 메시지 */}
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">교과서는 한 번 선택하면 변경할 수 없습니다</p>
              <p className="text-xs text-amber-600 mt-0.5">변경이 필요한 경우 학원 선생님에게 문의하세요</p>
            </div>
          </div>

          <Tabs defaultValue="1">
            {/* 학년 탭 — 필 스타일 */}
            <div className="flex gap-2">
              {[1, 2, 3].map((grade, i) => {
                const gc = GRADE_COLORS[i];
                return (
                  <TabsList key={grade} className="bg-transparent p-0">
                    <TabsTrigger
                      value={String(grade)}
                      className="rounded-full px-5 py-2 text-sm font-semibold transition-all data-[state=active]:shadow-sm border"
                      style={{
                        '--tw-border-opacity': '1',
                      } as React.CSSProperties}
                      data-accent={gc.accent}
                      data-light={gc.light}
                    >
                      중{grade}
                    </TabsTrigger>
                  </TabsList>
                );
              })}
            </div>

            {[1, 2, 3].map((grade) => (
              <TabsContent key={grade} value={String(grade)} className="mt-4">
                {gradeTextbooks[grade]?.length ? (
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {gradeTextbooks[grade].map((tb) => {
                      const palette = publisherColorMap.get(tb.publisher)!;
                      return (
                        <button
                          key={tb.id}
                          type="button"
                          disabled={saving}
                          onClick={() => setConfirmId(tb.id)}
                          className="group relative flex items-center gap-0 rounded-xl overflow-hidden border border-gray-100 bg-white text-left transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50"
                        >
                          {/* 책등 (spine) */}
                          <div
                            className="w-2.5 self-stretch shrink-0"
                            style={{ background: palette.spine }}
                          />
                          {/* 표지 영역 */}
                          <div
                            className="flex h-full w-12 shrink-0 items-center justify-center"
                            style={{ background: palette.bg }}
                          >
                            <BookOpen className="h-5 w-5" style={{ color: palette.text }} />
                          </div>
                          {/* 텍스트 */}
                          <div className="min-w-0 flex-1 px-3.5 py-3">
                            <p className="text-sm font-semibold text-gray-800 truncate">{tb.display_name}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5 truncate">{tb.publisher}</p>
                          </div>
                          {/* 화살표 */}
                          <div className="pr-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ChevronRight className="h-4 w-4 text-gray-300" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-14 rounded-2xl border-2 border-dashed border-gray-200">
                    <BookOpen className="h-8 w-8 text-gray-300 mb-2" />
                    <p className="text-center text-gray-400 text-sm">
                      중{grade} 교과서가 아직 등록되지 않았습니다
                    </p>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
          </>
        )}

        {/* 확인 다이얼로그 */}
        {confirmId && (() => {
          const tb = textbooks.find((t) => t.id === confirmId);
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
              <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  <h3 className="text-base font-bold">교과서 선택 확인</h3>
                </div>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold text-gray-800">{tb?.display_name}</span>을(를) 선택하시겠습니까?
                </p>
                <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                  선택 후에는 변경할 수 없습니다. 변경이 필요하면 학원 선생님에게 문의하세요.
                </p>
                <div className="flex gap-2 pt-1">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setConfirmId(null)}
                    disabled={saving}
                  >
                    취소
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => selectTextbook(confirmId)}
                    disabled={saving}
                  >
                    {saving ? '선택 중...' : '선택하기'}
                  </Button>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    );
  }

  const hasExamGroups = examGroups.length > 0;

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
