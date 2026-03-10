import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Metadata } from 'next';
import type { EnhancedReportData } from '@/types/report';

interface Props {
  params: Promise<{ reportId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { reportId } = await params;
  const supabase = createAdminClient();

  const { data } = await supabase
    .from('weekly_reports')
    .select('week_start, week_end, stats')
    .eq('id', reportId)
    .single();

  if (!data) return { title: '학습 리포트' };

  const stats = data.stats as unknown as EnhancedReportData;
  const studentName = stats.student?.split('(')[0]?.trim() || '학생';
  return {
    title: `${studentName} 학습 리포트 (${data.week_start} ~ ${data.week_end})`,
  };
}

function MetricCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

export default async function PublicReportPage({ params }: Props) {
  const { reportId } = await params;
  const supabase = createAdminClient();

  const { data: row } = await supabase
    .from('weekly_reports')
    .select('*')
    .eq('id', reportId)
    .single();

  if (!row) notFound();

  const report = row.stats as unknown as EnhancedReportData;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="text-center space-y-1">
          <h1 className="text-lg font-semibold">학습 리포트</h1>
          <p className="text-muted-foreground">{report.student}</p>
          <Badge variant="secondary">
            {row.week_start} ~ {row.week_end}
          </Badge>
        </div>

        {/* 요약 */}
        {(!report.reportType || report.reportType === 'all') && (
          <Card>
            <CardContent className="py-4 space-y-3">
              <p className="font-medium">요약</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <MetricCard
                  label="영상 학습"
                  value={`${report.videoProgress.completed}/${report.videoProgress.total}`}
                  sub="완료/전체"
                />
                <MetricCard
                  label="암기 마스터"
                  value={`${report.memoryProgress.mastered}/${report.memoryProgress.total}`}
                  sub={`복습 대기: ${report.memoryProgress.dueReviews}`}
                />
                <MetricCard
                  label="총 학습 시간"
                  value={`${report.totalWatchedMinutes}분`}
                />
                <MetricCard
                  label="퀴즈 정답률"
                  value={`${report.quizAccuracy}%`}
                />
                <MetricCard
                  label="교과서 학습"
                  value={report.textbookProgress.completed}
                  sub="완료 지문"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* 내신 대비 */}
        {report.naesin && (
          <Card>
            <CardContent className="py-4 space-y-3">
              <p className="font-medium">내신 대비</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <MetricCard
                  label="단원 진행"
                  value={`${report.naesin.unitsInProgress}/${report.naesin.totalUnits}`}
                  sub="진행 중/전체"
                />
                <MetricCard
                  label="문제풀이"
                  value={`${report.naesin.problemAvgScore ?? '-'}점`}
                  sub={`${report.naesin.problemAttempts}회 시도`}
                />
                <MetricCard
                  label="미해결 오답"
                  value={report.naesin.unresolvedWrongAnswers}
                />
                <MetricCard
                  label="문법 영상"
                  value={`${report.naesin.videoCompleted}/${report.naesin.videoTotal}`}
                  sub="완료/전체"
                />
                <MetricCard
                  label="총 시청 시간"
                  value={`${Math.round(report.naesin.totalWatchSeconds / 60)}분`}
                />
                <MetricCard
                  label="퀴즈셋 평균"
                  value={`${report.naesin.quizSetAvgScore ?? '-'}점`}
                />
              </div>
              <p className="text-sm font-medium mt-2">단계별 완료</p>
              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
                <MetricCard label="어휘" value={report.naesin.stagesCompleted.vocab} sub="단원 완료" />
                <MetricCard label="지문" value={report.naesin.stagesCompleted.passage} sub="단원 완료" />
                <MetricCard label="문법" value={report.naesin.stagesCompleted.grammar} sub="단원 완료" />
                <MetricCard label="문제풀이" value={report.naesin.stagesCompleted.problem} sub="단원 완료" />
                <MetricCard label="직전보강" value={report.naesin.stagesCompleted.lastReview} sub="단원 완료" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* 올톡보카 */}
        {report.voca && (
          <Card>
            <CardContent className="py-4 space-y-3">
              <p className="font-medium">올톡보카</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <MetricCard
                  label="Day 진행"
                  value={`${report.voca.daysInProgress}/${report.voca.totalDays}`}
                  sub="진행 중/전체"
                />
                <MetricCard
                  label="플래시카드"
                  value={report.voca.flashcardCompleted}
                  sub="완료 Day"
                />
                <MetricCard
                  label="매칭 완료"
                  value={report.voca.matchingCompleted}
                  sub="완료 Day"
                />
                <MetricCard
                  label="퀴즈 평균"
                  value={`${report.voca.quizAvgScore ?? '-'}점`}
                />
                <MetricCard
                  label="스펠링 평균"
                  value={`${report.voca.spellingAvgScore ?? '-'}점`}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* 분석 */}
        <Card>
          <CardContent className="py-4 space-y-3">
            <p className="font-medium">약점</p>
            {report.weaknesses.length === 0 ? (
              <p className="text-sm text-muted-foreground">발견된 약점이 없습니다.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {report.weaknesses.map((w, i) => (
                  <Badge key={i} variant="destructive">{w}</Badge>
                ))}
              </div>
            )}

            <p className="font-medium mt-2">추천</p>
            {report.recommendations.length === 0 ? (
              <p className="text-sm text-muted-foreground">추천 사항이 없습니다.</p>
            ) : (
              <div className="space-y-2">
                {report.recommendations.map((r, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm dark:border-blue-900 dark:bg-blue-950"
                  >
                    {r}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 워터마크 */}
        <p className="text-center text-xs text-muted-foreground">
          올라영 AI 문법 마스터
        </p>
      </div>
    </div>
  );
}
