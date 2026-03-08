import { requireRole } from '@/lib/auth/helpers';
import { createClient } from '@/lib/supabase/server';
import { Topbar } from '@/components/layout/topbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, BookMarked, GraduationCap, BarChart3, Clock, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default async function StudentDashboard() {
  const user = await requireRole(['student']);
  const supabase = await createClient();

  // Fetch progress stats
  const [videoProgressRes, memoryProgressRes, dueReviewsRes, naesinProgressRes] = await Promise.all([
    supabase
      .from('student_progress')
      .select('video_completed')
      .eq('student_id', user.id),
    supabase
      .from('student_memory_progress')
      .select('is_mastered')
      .eq('student_id', user.id),
    supabase
      .from('student_memory_progress')
      .select('id')
      .eq('student_id', user.id)
      .eq('is_mastered', false)
      .lte('next_review_date', new Date().toISOString().split('T')[0]),
    supabase
      .from('naesin_student_progress')
      .select('vocab_completed, passage_completed, grammar_completed, problem_completed')
      .eq('student_id', user.id),
  ]);

  const completedVideos = videoProgressRes.data?.filter((p) => p.video_completed).length || 0;
  const totalProgress = videoProgressRes.data?.length || 0;
  const masteredItems = memoryProgressRes.data?.filter((p) => p.is_mastered).length || 0;
  const totalMemory = memoryProgressRes.data?.length || 0;
  const dueReviews = dueReviewsRes.data?.length || 0;

  // Naesin stats
  const naesinProgress = naesinProgressRes.data || [];
  const naesinStagesCompleted = naesinProgress.reduce((acc, p) => {
    return acc + (p.vocab_completed ? 1 : 0) + (p.passage_completed ? 1 : 0) + (p.grammar_completed ? 1 : 0) + (p.problem_completed ? 1 : 0);
  }, 0);
  const naesinUnitsFullyCompleted = naesinProgress.filter(
    (p) => p.vocab_completed && p.passage_completed && p.grammar_completed && p.problem_completed
  ).length;

  return (
    <>
      <Topbar user={user} title="대시보드" />
      <div className="p-4 md:p-6 space-y-6">
        {/* Welcome */}
        <div>
          <h2 className="text-2xl font-bold">안녕하세요, {user.full_name}님! 👋</h2>
          <p className="text-muted-foreground mt-1">오늘도 영어 문법 공부를 시작해볼까요?</p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {naesinProgress.length > 0 && (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">내신 단계 완료</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{naesinStagesCompleted}</div>
                  <p className="text-xs text-muted-foreground">
                    전체 {naesinProgress.length * 4}단계 중
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">완료 단원</CardTitle>
                  <BookMarked className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{naesinUnitsFullyCompleted}</div>
                  <p className="text-xs text-muted-foreground">
                    전체 {naesinProgress.length}단원 중
                  </p>
                </CardContent>
              </Card>
            </>
          )}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">완료한 강의</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedVideos}</div>
              <p className="text-xs text-muted-foreground">
                전체 {totalProgress}개 중
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">암기 완료</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{masteredItems}</div>
              <p className="text-xs text-muted-foreground">
                전체 {totalMemory}개 중
              </p>
            </CardContent>
          </Card>
          {naesinProgress.length === 0 && (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">복습 대기</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dueReviews}</div>
                  <p className="text-xs text-muted-foreground">오늘 복습할 항목</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">학습 진도</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {totalProgress > 0 ? Math.round((completedVideos / totalProgress) * 100) : 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">전체 진도율</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center gap-3">
                <GraduationCap className="h-10 w-10 text-primary" />
                <h3 className="font-semibold">문법 학습</h3>
                <p className="text-sm text-muted-foreground">레벨별 영어 문법을 학습하세요</p>
                <Button asChild className="mt-2">
                  <Link href="/student/levels">학습 시작</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
          {dueReviews > 0 && (
            <Card className="hover:shadow-md transition-shadow border-orange-200 bg-orange-50/50">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center gap-3">
                  <Clock className="h-10 w-10 text-orange-500" />
                  <h3 className="font-semibold">복습하기</h3>
                  <p className="text-sm text-muted-foreground">
                    {dueReviews}개 항목이 복습을 기다리고 있어요
                  </p>
                  <Button asChild variant="outline" className="mt-2">
                    <Link href="/student/review">복습 시작</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center gap-3">
                <BookMarked className="h-10 w-10 text-primary" />
                <h3 className="font-semibold">내신 대비</h3>
                <p className="text-sm text-muted-foreground">교과서별 내신 시험을 준비하세요</p>
                <Button asChild variant="outline" className="mt-2">
                  <Link href="/student/naesin">내신 학습</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center gap-3">
                <BarChart3 className="h-10 w-10 text-primary" />
                <h3 className="font-semibold">내 진도</h3>
                <p className="text-sm text-muted-foreground">학습 현황을 확인하세요</p>
                <Button asChild variant="outline" className="mt-2">
                  <Link href="/student/progress">진도 확인</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
