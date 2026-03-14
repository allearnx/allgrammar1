'use client';

import { useEffect, useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScoreTrendChart } from '@/components/charts/score-trend-chart';
import { UnitScoreChart } from '@/components/charts/unit-score-chart';
import { ActivityCalendar } from '@/components/charts/activity-calendar';
import {
  Loader2, AlertCircle, TrendingUp, BarChart3, AlertTriangle,
  CalendarDays, LayoutDashboard, BookOpen, Target, Sparkles,
} from 'lucide-react';
import type { StudentReportData } from '@/types/student-report';

interface Props {
  studentId?: string;
  services?: string[];
  token?: string;
}

const STAT_COLORS = {
  violet: '#7C3AED',
  cyan: '#06B6D4',
  mint: '#56C9A0',
  amber: '#F59E0B',
};

export function StudentReportPanel({ studentId, services: servicesProp, token }: Props) {
  const [data, setData] = useState<StudentReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReport() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (studentId) params.set('studentId', studentId);
        if (token) params.set('token', token);
        const res = await fetch(`/api/student/my-report?${params.toString()}`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || '리포트를 불러올 수 없습니다.');
        }
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, [studentId, token]);

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
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }} />
        <div className="relative flex items-center gap-3">
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
          </TabsList>

          {/* ── 주간 요약 ── */}
          <TabsContent value="summary" className="mt-4 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {hasVoca && data.current.voca && (
                <>
                  <StatCard
                    label="보카 퀴즈 평균"
                    value={data.current.voca.quizAvgScore !== null ? `${data.current.voca.quizAvgScore}점` : '-'}
                    color={STAT_COLORS.violet}
                    icon={<Target className="h-5 w-5" />}
                  />
                  <StatCard
                    label="보카 진행률"
                    value={`${data.current.voca.daysInProgress}/${data.current.voca.totalDays} Day`}
                    color={STAT_COLORS.mint}
                    icon={<BookOpen className="h-5 w-5" />}
                  />
                </>
              )}
              {hasNaesin && data.current.naesin && (
                <>
                  <StatCard
                    label="내신 문제풀이 평균"
                    value={data.current.naesin.problemAvgScore !== null ? `${data.current.naesin.problemAvgScore}점` : '-'}
                    color={STAT_COLORS.cyan}
                    icon={<BarChart3 className="h-5 w-5" />}
                  />
                  <StatCard
                    label="내신 진행률"
                    value={`${data.current.naesin.unitsInProgress}/${data.current.naesin.totalUnits} 단원`}
                    color={STAT_COLORS.amber}
                    icon={<TrendingUp className="h-5 w-5" />}
                  />
                </>
              )}
            </div>

            {/* Weakness section */}
            {data.current.weaknesses.length > 0 && (
              <div className="rounded-xl bg-amber-50/70 p-4">
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5 text-amber-800">
                  <AlertTriangle className="h-4 w-4" />
                  약점 분석
                </h4>
                <div className="flex flex-wrap gap-2">
                  {data.current.weaknesses.map((w, i) => (
                    <Badge key={i} variant="outline" className="bg-amber-100 border-amber-200 text-amber-800">
                      {w}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations section */}
            {data.current.recommendations.length > 0 && (
              <div className="rounded-xl bg-cyan-50/70 p-4">
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5 text-cyan-800">
                  <Sparkles className="h-4 w-4" />
                  추천 학습
                </h4>
                <ul className="space-y-1.5">
                  {data.current.recommendations.map((r, i) => (
                    <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="mt-1.5 h-2 w-2 rounded-full bg-cyan-400 shrink-0" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {data.current.weaknesses.length === 0 && data.current.recommendations.length === 0 && (
              <div className="rounded-xl border border-dashed p-8 text-center">
                <p className="text-2xl mb-2">🎉</p>
                <p className="text-sm text-gray-500 font-medium">약점이 없습니다! 잘하고 있어요!</p>
              </div>
            )}
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
                <p className="text-2xl mb-2">📊</p>
                <p className="text-sm text-gray-400">아직 학습 데이터가 없어요</p>
              </div>
            )}
          </TabsContent>

          {/* ── 오답 분석 ── */}
          <TabsContent value="wrong" className="mt-4 space-y-6">
            {hasVoca && data.wrongAnalysis.vocaTopWrong.length > 0 && (
              <div className="rounded-xl bg-rose-50/60 p-4">
                <h4 className="text-sm font-semibold mb-3 text-rose-800">자주 틀리는 단어 TOP 10</h4>
                <div className="space-y-2">
                  {data.wrongAnalysis.vocaTopWrong.map((w) => {
                    const borderColor = w.count >= 3 ? '#F43F5E' : w.count === 2 ? '#FB7185' : '#FCA5A5';
                    return (
                      <div key={w.word} className="flex items-center justify-between rounded-lg bg-white px-3 py-2" style={{ borderLeft: `3px solid ${borderColor}` }}>
                        <span className="text-sm font-medium text-gray-800">{w.word}</span>
                        <Badge className="bg-rose-100 text-rose-700 border-0 text-xs hover:bg-rose-100">{w.count}회</Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {hasNaesin && data.wrongAnalysis.naesinWrongByStage.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-3">내신 스테이지별 오답</h4>
                <div className="grid gap-2 sm:grid-cols-2">
                  {data.wrongAnalysis.naesinWrongByStage.map((s) => (
                    <div key={s.stage} className="flex items-center justify-between rounded-lg border px-3 py-2.5" style={{ borderLeft: '3px solid #06B6D4' }}>
                      <span className="text-sm font-medium">{s.stage}</span>
                      <div className="flex gap-3 text-xs">
                        <span className="text-gray-500">전체 {s.total}</span>
                        {s.unresolved > 0 && (
                          <span className="text-red-500 font-semibold">미해결 {s.unresolved}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {hasNaesin && data.wrongAnalysis.naesinWrongByUnit.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-3">내신 단원별 오답</h4>
                <div className="space-y-2">
                  {data.wrongAnalysis.naesinWrongByUnit.map((u) => (
                    <div key={u.unitId} className="flex items-center justify-between rounded-lg border px-3 py-2" style={{ borderLeft: '3px solid #06B6D4' }}>
                      <span className="text-sm font-medium truncate">{u.unitTitle}</span>
                      <div className="flex gap-3 text-xs shrink-0">
                        <span className="text-gray-500">전체 {u.total}</span>
                        {u.unresolved > 0 && (
                          <span className="text-red-500 font-semibold">미해결 {u.unresolved}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.wrongAnalysis.vocaTopWrong.length === 0 && data.wrongAnalysis.naesinWrongByStage.length === 0 && (
              <div className="rounded-xl border border-dashed p-8 text-center">
                <p className="text-2xl mb-2">🎉</p>
                <p className="text-sm text-gray-500 font-medium">오답 없음! 완벽해요!</p>
              </div>
            )}
          </TabsContent>

          {/* ── 학습 기록 ── */}
          <TabsContent value="activity" className="mt-4">
            <ActivityCalendar activities={data.activityLog} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function StatCard({ label, value, color, icon }: {
  label: string; value: string; color: string; icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-white p-3.5" style={{ borderLeftWidth: 4, borderLeftColor: color }}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</span>
        <span style={{ color }}>{icon}</span>
      </div>
      <p className="text-xl font-bold tracking-tight">{value}</p>
    </div>
  );
}
