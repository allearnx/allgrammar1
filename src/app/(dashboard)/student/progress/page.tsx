import { requireRole } from '@/lib/auth/helpers';
import { createClient } from '@/lib/supabase/server';
import { Topbar } from '@/components/layout/topbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

export default async function ProgressPage() {
  const user = await requireRole(['student']);
  const supabase = await createClient();

  // Fetch all levels with grammars
  const { data: levels } = await supabase
    .from('levels')
    .select('*, grammars(id)')
    .order('level_number');

  // Fetch all progress
  const { data: videoProgress } = await supabase
    .from('student_progress')
    .select('grammar_id, video_completed, video_watched_seconds')
    .eq('student_id', user.id);

  const { data: memoryProgress } = await supabase
    .from('student_memory_progress')
    .select('memory_item_id, is_mastered, quiz_correct_count, quiz_wrong_count, spelling_correct_count, spelling_wrong_count')
    .eq('student_id', user.id);

  const completedSet = new Set(
    videoProgress?.filter((p) => p.video_completed).map((p) => p.grammar_id) || []
  );

  const totalWatchedSeconds = videoProgress?.reduce((acc, p) => acc + p.video_watched_seconds, 0) || 0;
  const totalMastered = memoryProgress?.filter((p) => p.is_mastered).length || 0;
  const totalMemory = memoryProgress?.length || 0;
  const totalQuizCorrect = memoryProgress?.reduce((acc, p) => acc + p.quiz_correct_count, 0) || 0;
  const totalQuizWrong = memoryProgress?.reduce((acc, p) => acc + p.quiz_wrong_count, 0) || 0;

  const hours = Math.floor(totalWatchedSeconds / 3600);
  const minutes = Math.floor((totalWatchedSeconds % 3600) / 60);

  return (
    <>
      <Topbar user={user} title="내 진도" />
      <div className="p-4 md:p-6 space-y-6">
        {/* Summary Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">총 학습 시간</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {hours > 0 ? `${hours}시간 ` : ''}{minutes}분
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">암기 마스터</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalMastered}/{totalMemory}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">퀴즈 정답률</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalQuizCorrect + totalQuizWrong > 0
                  ? Math.round((totalQuizCorrect / (totalQuizCorrect + totalQuizWrong)) * 100)
                  : 0}%
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">완료 레벨</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {levels?.filter((l) =>
                  l.grammars.length > 0 && l.grammars.every((g: { id: string }) => completedSet.has(g.id))
                ).length || 0}/{levels?.length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Per-Level Progress */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">레벨별 진도</h3>
          {(levels || []).map((level) => {
            const total = level.grammars.length;
            const completed = level.grammars.filter((g: { id: string }) => completedSet.has(g.id)).length;
            const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

            return (
              <Card key={level.id}>
                <CardContent className="py-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">Lv.{level.level_number}</Badge>
                      <span className="text-sm font-medium">{level.title_ko}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{completed}/{total}</span>
                  </div>
                  <Progress value={percent} className="h-1.5" />
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </>
  );
}
