'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScoreTrendChart } from '@/components/charts/score-trend-chart';
import { UnitScoreChart } from '@/components/charts/unit-score-chart';
import { ActivityCalendar } from '@/components/charts/activity-calendar';
import {
  Loader2, AlertCircle, TrendingUp, BarChart3, AlertTriangle,
  CalendarDays, LayoutDashboard, Brain,
} from 'lucide-react';
import { useStudentReport } from '@/hooks/use-student-report';
import { SummaryTab } from './report-tabs/summary-tab';
import { WrongAnalysisTab } from './report-tabs/wrong-analysis-tab';
import { AiAnalysisTab } from './report-tabs/ai-analysis-tab';
import type { Tier } from '@/lib/billing/feature-gate';

interface Props {
  studentId?: string;
  services?: string[];
  token?: string;
  role?: 'teacher' | 'admin' | 'boss' | 'student' | 'parent';
  tier?: Tier;
}

export function StudentReportPanel({ studentId, services: servicesProp, token, role = 'student', tier = 'free' }: Props) {
  const { data, loading, error } = useStudentReport(studentId, token);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
        <span className="ml-2 text-sm text-gray-500">리포트 로딩 중...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-16 text-red-500">
        <AlertCircle className="h-5 w-5 mr-2" />
        <span className="text-sm">{error}</span>
      </div>
    );
  }

  if (!data) return null;

  const services = servicesProp || data.current.services;
  const hasNaesin = services.includes('naesin');
  const hasVoca = services.includes('voca');

  return (
    <div className="rounded-2xl overflow-hidden border bg-white">
      {/* ── Purple Banner Header ── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-violet-400 to-purple-500 p-6 text-white">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-6 w-6" />
          <h2 className="text-lg font-bold">상세 리포트</h2>
          <div className="flex gap-2 ml-auto">
            {hasVoca && (
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-white/20 backdrop-blur">보카</span>
            )}
            {hasNaesin && (
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-white/20 backdrop-blur">내신</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="p-4 md:p-6">
        <Tabs defaultValue="summary">
          <TabsList className="w-full flex overflow-x-auto">
            <TabsTrigger value="summary" className="gap-1">
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">주간 요약</span>
              <span className="sm:hidden">요약</span>
            </TabsTrigger>
            <TabsTrigger value="trends" className="gap-1">
              <TrendingUp className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">성적 추이</span>
              <span className="sm:hidden">추이</span>
            </TabsTrigger>
            <TabsTrigger value="units" className="gap-1">
              <BarChart3 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">단원별</span>
              <span className="sm:hidden">단원</span>
            </TabsTrigger>
            <TabsTrigger value="wrong" className="gap-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">오답 분석</span>
              <span className="sm:hidden">오답</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-1">
              <CalendarDays className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">학습 기록</span>
              <span className="sm:hidden">기록</span>
            </TabsTrigger>
            <TabsTrigger value="ai" className="gap-1">
              <Brain className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">AI 분석</span>
              <span className="sm:hidden">AI</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="mt-4">
            <SummaryTab data={data} hasVoca={hasVoca} hasNaesin={hasNaesin} />
          </TabsContent>

          {/* ── 성적 추이 ── */}
          <TabsContent value="trends" className="mt-4 space-y-6">
            {hasVoca && (
              <ScoreTrendChart
                data={data.trends.vocaQuizScores}
                title="보카 퀴즈 점수 추이"
                color="#7C3AED"
              />
            )}
            {hasNaesin && (
              <>
                <ScoreTrendChart
                  data={data.trends.naesinProblemScores}
                  title="내신 문제풀이 점수 추이"
                  color="#06B6D4"
                />
                <ScoreTrendChart
                  data={data.trends.naesinVocabScores}
                  title="내신 단어 퀴즈 점수 추이"
                  color="#F59E0B"
                />
              </>
            )}
            {!hasVoca && !hasNaesin && (
              <p className="text-sm text-gray-400 py-8 text-center">배정된 서비스가 없습니다.</p>
            )}
          </TabsContent>

          {/* ── 단원별 분석 ── */}
          <TabsContent value="units" className="mt-4 space-y-6">
            {hasVoca && data.unitBreakdown.vocaDays.length > 0 && (
              <UnitScoreChart
                title="보카 Day별 점수"
                data={data.unitBreakdown.vocaDays.map((d) => ({
                  name: `Day ${d.dayNumber}`,
                  퀴즈: d.quizScore ?? 0,
                  스펠링: d.spellingScore ?? 0,
                }))}
                bars={[
                  { dataKey: '퀴즈', name: '퀴즈', color: '#7C3AED' },
                  { dataKey: '스펠링', name: '스펠링', color: '#06B6D4' },
                ]}
              />
            )}
            {hasNaesin && data.unitBreakdown.naesinUnits.length > 0 && (
              <UnitScoreChart
                title="내신 단원별 점수"
                data={data.unitBreakdown.naesinUnits.map((u) => ({
                  name: `U${u.unitNumber}`,
                  어휘: u.vocabScore ?? 0,
                  문제풀이: u.problemScore ?? 0,
                }))}
                bars={[
                  { dataKey: '어휘', name: '어휘', color: '#F59E0B' },
                  { dataKey: '문제풀이', name: '문제풀이', color: '#06B6D4' },
                ]}
              />
            )}
            {data.unitBreakdown.vocaDays.length === 0 && data.unitBreakdown.naesinUnits.length === 0 && (
              <div className="rounded-xl border border-dashed p-8 text-center">
                <BarChart3 className="h-8 w-8 text-gray-300 mb-2" />
                <p className="text-sm text-gray-400">아직 학습 데이터가 없어요</p>
              </div>
            )}
          </TabsContent>

          {/* ── 오답 분석 ── */}
          <TabsContent value="wrong" className="mt-4">
            <WrongAnalysisTab data={data} hasVoca={hasVoca} hasNaesin={hasNaesin} />
          </TabsContent>

          {/* ── 학습 기록 ── */}
          <TabsContent value="activity" className="mt-4">
            <ActivityCalendar activities={data.activityLog} dailySeconds={data.dailyLearningSeconds} />
          </TabsContent>

          {/* ── AI 분석 ── */}
          <TabsContent value="ai" className="mt-4">
            <AiAnalysisTab studentId={studentId} role={role} tier={tier} token={token} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
