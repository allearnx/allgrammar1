import { requireRole } from '@/lib/auth/helpers';
import { createClient } from '@/lib/supabase/server';
import { Topbar } from '@/components/layout/topbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, BookOpen, Clock, BarChart3 } from 'lucide-react';
import { NaesinUnitProgressCard } from '@/components/progress/naesin-unit-progress-card';

export default async function ProgressPage() {
  const user = await requireRole(['student']);
  const supabase = await createClient();

  // Fetch all progress
  const [videoProgressRes, memoryProgressRes, naesinProgressRes, naesinSettingsRes] = await Promise.all([
    supabase
      .from('student_progress')
      .select('grammar_id, video_completed, video_watched_seconds')
      .eq('student_id', user.id),
    supabase
      .from('student_memory_progress')
      .select('memory_item_id, is_mastered, quiz_correct_count, quiz_wrong_count, spelling_correct_count, spelling_wrong_count')
      .eq('student_id', user.id),
    supabase
      .from('naesin_student_progress')
      .select('unit_id, vocab_completed, vocab_quiz_score, vocab_spelling_score, passage_completed, passage_fill_blanks_best, passage_ordering_best, passage_translation_best, passage_grammar_vocab_best, grammar_completed, grammar_videos_completed, grammar_total_videos, problem_completed, updated_at')
      .eq('student_id', user.id),
    supabase
      .from('naesin_student_settings')
      .select('textbook_id, textbook:naesin_textbooks(display_name)')
      .eq('student_id', user.id)
      .single(),
  ]);

  const videoProgress = videoProgressRes.data;
  const memoryProgress = memoryProgressRes.data;
  const naesinProgress = naesinProgressRes.data || [];

  // Fetch naesin unit names if we have progress
  let naesinUnits: { id: string; unit_number: number; title: string }[] = [];
  if (naesinSettingsRes.data?.textbook_id) {
    const { data } = await supabase
      .from('naesin_units')
      .select('id, unit_number, title')
      .eq('textbook_id', naesinSettingsRes.data.textbook_id)
      .eq('is_active', true)
      .order('sort_order');
    naesinUnits = data || [];
  }

  const naesinProgressMap = new Map(naesinProgress.map((p) => [p.unit_id, p]));
  const textbookName = (naesinSettingsRes.data?.textbook as unknown as { display_name: string } | null)?.display_name || '';

  const totalWatchedSeconds = videoProgress?.reduce((acc, p) => acc + p.video_watched_seconds, 0) || 0;
  const totalMastered = memoryProgress?.filter((p) => p.is_mastered).length || 0;
  const totalMemory = memoryProgress?.length || 0;
  const totalQuizCorrect = memoryProgress?.reduce((acc, p) => acc + p.quiz_correct_count, 0) || 0;
  const totalQuizWrong = memoryProgress?.reduce((acc, p) => acc + p.quiz_wrong_count, 0) || 0;

  const hours = Math.floor(totalWatchedSeconds / 3600);
  const minutes = Math.floor((totalWatchedSeconds % 3600) / 60);

  const naesinStagesCompleted = naesinProgress.reduce((acc, p) => {
    return acc + (p.vocab_completed ? 1 : 0) + (p.passage_completed ? 1 : 0) + (p.grammar_completed ? 1 : 0) + (p.problem_completed ? 1 : 0);
  }, 0);

  // Score chip helpers from shared utility

  return (
    <>
      <Topbar user={user} title="내 진도" />
      <div className="p-4 md:p-6 space-y-6">
        {/* Summary Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {naesinProgress.length > 0 && (
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">내신 단계 완료</CardTitle>
                <div className="rounded-full bg-green-100 p-2 dark:bg-green-950">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tracking-tight">{naesinStagesCompleted}/{naesinProgress.length * 4}</div>
                <p className="text-xs text-muted-foreground">전체 단계 중</p>
              </CardContent>
            </Card>
          )}
          <Card className="border-l-4 border-l-sky-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">총 학습 시간</CardTitle>
              <div className="rounded-full bg-sky-100 p-2 dark:bg-sky-950">
                <Clock className="h-4 w-4 text-sky-600 dark:text-sky-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight">
                {hours > 0 ? `${hours}시간 ` : ''}{minutes}분
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-indigo-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">암기 마스터</CardTitle>
              <div className="rounded-full bg-indigo-100 p-2 dark:bg-indigo-950">
                <BookOpen className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight">{totalMastered}/{totalMemory}</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">퀴즈 정답률</CardTitle>
              <div className="rounded-full bg-purple-100 p-2 dark:bg-purple-950">
                <BarChart3 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight">
                {totalQuizCorrect + totalQuizWrong > 0
                  ? Math.round((totalQuizCorrect / (totalQuizCorrect + totalQuizWrong)) * 100)
                  : 0}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Naesin Per-Unit Progress */}
        {naesinUnits.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold tracking-tight">내신 단원별 진도{textbookName ? ` — ${textbookName}` : ''}</h3>
            {naesinUnits.map((unit) => (
              <NaesinUnitProgressCard
                key={unit.id}
                unit={unit}
                progress={naesinProgressMap.get(unit.id)}
              />
            ))}
          </div>
        )}

        {/* Per-Level Grammar Progress - 임시 숨김 */}
      </div>
    </>
  );
}
