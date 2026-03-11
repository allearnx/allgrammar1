import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'lucide-react';
import type { EnhancedReportData } from '@/types/report';

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

export interface ReportDisplayProps {
  report: EnhancedReportData;
  currentReportId: string | null;
  onCopyShareLink: () => void;
}

export function ReportDisplay({ report, currentReportId, onCopyShareLink }: ReportDisplayProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>학습 리포트</CardTitle>
          <div className="flex items-center gap-2">
            {currentReportId && (
              <Button variant="outline" size="sm" onClick={onCopyShareLink}>
                <Link className="h-4 w-4 mr-1" />
                공유 링크 복사
              </Button>
            )}
            <Badge variant="secondary">{report.generatedAt}</Badge>
          </div>
        </div>
        <p className="text-muted-foreground">{report.student}</p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={report.reportType === 'naesin' ? 'naesin' : report.reportType === 'voca' ? 'voca' : 'summary'}>
          <TabsList>
            {(!report.reportType || report.reportType === 'all') && (
              <TabsTrigger value="summary">요약</TabsTrigger>
            )}
            {report.naesin && (
              <TabsTrigger value="naesin">내신 대비</TabsTrigger>
            )}
            {report.voca && (
              <TabsTrigger value="voca">올킬보카</TabsTrigger>
            )}
            <TabsTrigger value="analysis">분석</TabsTrigger>
          </TabsList>

          {/* 요약 탭 */}
          <TabsContent value="summary" className="mt-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
              {report.naesin && (
                <MetricCard
                  label="내신 진행"
                  value={`${report.naesin.unitsInProgress}/${report.naesin.totalUnits}`}
                  sub={`문제 평균 ${report.naesin.problemAvgScore ?? '-'}점`}
                />
              )}
              {report.voca && (
                <MetricCard
                  label="올킬보카"
                  value={`${report.voca.daysInProgress}/${report.voca.totalDays} Day`}
                  sub={`퀴즈 평균 ${report.voca.quizAvgScore ?? '-'}점`}
                />
              )}
            </div>
          </TabsContent>

          {/* 내신 대비 탭 */}
          {report.naesin && (
            <TabsContent value="naesin" className="mt-4 space-y-4">
              <h3 className="font-semibold">단원 진행 현황</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
              </div>

              <h3 className="font-semibold">단계별 완료</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <MetricCard label="어휘" value={report.naesin.stagesCompleted.vocab} sub="단원 완료" />
                <MetricCard label="지문" value={report.naesin.stagesCompleted.passage} sub="단원 완료" />
                <MetricCard label="문법" value={report.naesin.stagesCompleted.grammar} sub="단원 완료" />
                <MetricCard label="문제풀이" value={report.naesin.stagesCompleted.problem} sub="단원 완료" />
                <MetricCard label="직전보강" value={report.naesin.stagesCompleted.lastReview} sub="단원 완료" />
              </div>

              <h3 className="font-semibold">영상 시청</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
            </TabsContent>
          )}

          {/* 올킬보카 탭 */}
          {report.voca && (
            <TabsContent value="voca" className="mt-4 space-y-4">
              <h3 className="font-semibold">Day 진행 현황</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
              </div>

              <h3 className="font-semibold">퀴즈 / 스펠링</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <MetricCard
                  label="퀴즈 평균"
                  value={`${report.voca.quizAvgScore ?? '-'}점`}
                />
                <MetricCard
                  label="스펠링 평균"
                  value={`${report.voca.spellingAvgScore ?? '-'}점`}
                />
              </div>
            </TabsContent>
          )}

          {/* 분석 탭 */}
          <TabsContent value="analysis" className="mt-4 space-y-4">
            <div>
              <h3 className="font-semibold mb-2">약점</h3>
              {report.weaknesses.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  발견된 약점이 없습니다.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {report.weaknesses.map((w, i) => (
                    <Badge key={i} variant="destructive">
                      {w}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div>
              <h3 className="font-semibold mb-2">추천</h3>
              {report.recommendations.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  추천 사항이 없습니다.
                </p>
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
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
