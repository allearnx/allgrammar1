'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import {
  ClipboardList,
  FileQuestion,
  Info,
  CheckCircle2,
  Lock,
  Sparkles,
  GraduationCap,
  Users,
  ArrowRight,
} from 'lucide-react';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import Link from 'next/link';
import { LessonCard } from '@/components/naesin/lesson-card';
import { ExamCountdown } from '@/components/naesin/exam-countdown';
import { ExamDatePicker } from '@/components/naesin/exam-date-picker';
import { LearningOrderGuide } from '@/components/naesin/learning-order-guide';
import { LearningOrderModal } from '@/components/naesin/learning-order-modal';
import type { NaesinTextbook } from '@/types/database';
import type { UnitSummary, ExamGroup } from '@/lib/naesin/build-unit-summary';
import { TextbookSelector } from './textbook-selector';

interface TextbookExam {
  id: string;
  title: string;
  bestScore: number | null;
}

interface NaesinHomeProps {
  textbooks: NaesinTextbook[];
  selectedTextbook: NaesinTextbook | null;
  textbookId?: string | null;
  units: UnitSummary[];
  examDate?: string | null;
  examGroups?: ExamGroup[];
  isPaid?: boolean;
  textbookExams?: TextbookExam[];
  /** 무료 체험 시 단원 제한 수 (0 = 무제한) */
  freeUnitLimit?: number;
}

export function NaesinHome({
  textbooks,
  selectedTextbook,
  textbookId,
  units,
  examDate: initialExamDate,
  examGroups = [],
  isPaid = false,
  textbookExams = [],
  freeUnitLimit = 0,
}: NaesinHomeProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [examDate, setExamDate] = useState(initialExamDate);

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

      {/* 시험일 설정 / D-day */}
      {textbookId && !hasExamGroups && (
        <div className="flex items-center gap-3">
          {examDate ? (
            <ExamCountdown examDate={examDate} className="flex-1" />
          ) : (
            <div className="flex-1 rounded-lg border-2 border-dashed border-muted-foreground/30 p-4 text-center">
              <p className="text-muted-foreground text-sm mb-2">시험 날짜를 설정하면 D-day가 표시됩니다</p>
            </div>
          )}
          <ExamDatePicker
            textbookId={textbookId}
            currentDate={examDate}
            onDateChange={(d) => setExamDate(d)}
          />
        </div>
      )}

      {/* 학습 순서 가이드 (유료만) */}
      {isPaid && <LearningOrderGuide mode="card" />}

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
          {units.length === 0 ? (
            <div className="flex flex-col items-center py-12">
              <ClipboardList className="h-10 w-10 text-muted-foreground/30 mb-2" />
              <p className="text-center text-muted-foreground">
                등록된 단원이 없습니다.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {units.map((unit, index) => {
                const locked = freeUnitLimit > 0 && index >= freeUnitLimit;
                if (locked) {
                  return (
                    <Card key={unit.id} className="opacity-40 pointer-events-none">
                      <CardContent className="py-4 flex items-center gap-3">
                        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-muted text-muted-foreground font-bold shrink-0">
                          {unit.unit_number}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm text-muted-foreground">{unit.title}</h3>
                        </div>
                        <Lock className="h-5 w-5 text-muted-foreground shrink-0" />
                      </CardContent>
                    </Card>
                  );
                }
                return (
                  <LessonCard
                    key={unit.id}
                    unitId={unit.id}
                    unitNumber={unit.unit_number}
                    title={unit.title}
                    stages={unit.stageStatuses}
                    stageProgress={unit.stageProgress}
                  />
                );
              })}

              {/* 무료 체험 종료 안내 + 플랜 소개 */}
              {freeUnitLimit > 0 && units.length > freeUnitLimit && (
                <div className="mt-6 space-y-4">
                  {/* 헤더 카드 */}
                  <div className="rounded-2xl overflow-hidden">
                    <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-6 text-center text-white">
                      <div className="flex justify-center mb-3">
                        <div className="rounded-full bg-white/20 p-3">
                          <Sparkles className="h-6 w-6" />
                        </div>
                      </div>
                      <h3 className="text-lg font-bold mb-1">
                        무료 체험 {freeUnitLimit}단원을 완료했어요!
                      </h3>
                      <p className="text-sm text-violet-100 leading-relaxed">
                        나머지 단원을 학습하려면 아래 방법 중 하나를 선택하세요
                      </p>
                    </div>
                  </div>

                  {/* 플랜 카드 2개 */}
                  <div className="grid grid-cols-1 gap-3">
                    {/* 학원 수업 */}
                    <div className="rounded-xl border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-white p-5">
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-violet-100 p-2 shrink-0">
                          <GraduationCap className="h-5 w-5 text-violet-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-violet-900">학원에서 배정받기</h4>
                            <span className="text-[10px] font-bold bg-violet-600 text-white px-2 py-0.5 rounded-full">추천</span>
                          </div>
                          <p className="text-xs text-violet-700 leading-relaxed mb-3">
                            학원에서 올인내신 서비스를 배정받으면<br />
                            선생님 관리 + 전체 단원 + 시험 대비까지 한 번에!
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {['전체 단원 해금', '선생님 진도 관리', '시험 대비 문제'].map((tag) => (
                              <span key={tag} className="text-[11px] bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium">{tag}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 개인 결제 */}
                    <Link href="/courses/school_exam" className="block group">
                      <div className="rounded-xl border border-gray-200 bg-white p-5 transition-all group-hover:border-indigo-300 group-hover:shadow-md">
                        <div className="flex items-start gap-3">
                          <div className="rounded-lg bg-indigo-50 p-2 shrink-0">
                            <Users className="h-5 w-5 text-indigo-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-900 mb-1">개인 결제하기</h4>
                            <p className="text-xs text-gray-500 leading-relaxed mb-3">
                              학원 없이도 직접 결제해서 전체 단원을 학습할 수 있어요.
                            </p>
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600">
                              플랜 보러가기
                              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>

                  {/* 도움말 */}
                  <p className="text-center text-xs text-gray-400">
                    학원에 소속되어 있다면 선생님께 &ldquo;올인내신 배정&rdquo;을 요청해보세요!
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* 시험 대비 섹션 (교과서 레벨) */}
      {textbookExams.length > 0 && (
        <div className="space-y-3 pt-2 border-t">
          <div className="flex items-center gap-2">
            <FileQuestion className="h-5 w-5 text-pink-500" />
            <h3 className="text-lg font-semibold">시험 대비</h3>
          </div>
          {textbookExams.map((exam) => (
            <Link key={exam.id} href={`/student/naesin/exam/${exam.id}`}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="py-3 flex items-center justify-between">
                  <span className="font-medium text-sm">{exam.title}</span>
                  {exam.bestScore != null ? (
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium text-green-600">{exam.bestScore}점</span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">미응시</span>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* 학습 순서 팝업 (유료만, 세션당 1회) */}
      {isPaid && <LearningOrderModal />}
    </div>
  );
}
