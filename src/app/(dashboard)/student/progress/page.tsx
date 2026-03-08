import { requireRole } from '@/lib/auth/helpers';
import { createClient } from '@/lib/supabase/server';
import { Topbar } from '@/components/layout/topbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, BookOpen, FileText, GraduationCap, ClipboardList } from 'lucide-react';

export default async function ProgressPage() {
  const user = await requireRole(['student']);
  const supabase = await createClient();

  // Fetch all levels with grammars
  const { data: levels } = await supabase
    .from('levels')
    .select('*, grammars(id)')
    .order('level_number');

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
      .select('unit_id, vocab_completed, vocab_quiz_score, vocab_spelling_score, passage_completed, passage_fill_blanks_best, passage_translation_best, grammar_completed, grammar_videos_completed, grammar_total_videos, problem_completed, updated_at')
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

  const naesinStagesCompleted = naesinProgress.reduce((acc, p) => {
    return acc + (p.vocab_completed ? 1 : 0) + (p.passage_completed ? 1 : 0) + (p.grammar_completed ? 1 : 0) + (p.problem_completed ? 1 : 0);
  }, 0);

  return (
    <>
      <Topbar user={user} title="내 진도" />
      <div className="p-4 md:p-6 space-y-6">
        {/* Summary Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {naesinProgress.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">내신 단계 완료</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{naesinStagesCompleted}/{naesinProgress.length * 4}</div>
                <p className="text-xs text-muted-foreground">전체 단계 중</p>
              </CardContent>
            </Card>
          )}
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
        </div>

        {/* Naesin Per-Unit Progress */}
        {naesinUnits.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">내신 단원별 진도{textbookName ? ` — ${textbookName}` : ''}</h3>
            {naesinUnits.map((unit) => {
              const progress = naesinProgressMap.get(unit.id);
              const stages = [
                { key: 'vocab', label: '단어', icon: BookOpen, completed: progress?.vocab_completed ?? false },
                { key: 'passage', label: '교과서', icon: FileText, completed: progress?.passage_completed ?? false },
                { key: 'grammar', label: '문법', icon: GraduationCap, completed: progress?.grammar_completed ?? false },
                { key: 'problem', label: '문제', icon: ClipboardList, completed: progress?.problem_completed ?? false },
              ];
              const completedCount = stages.filter((s) => s.completed).length;
              const percent = Math.round((completedCount / 4) * 100);

              return (
                <Card key={unit.id}>
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs shrink-0">L{unit.unit_number}</Badge>
                        <span className="text-sm font-medium truncate">{unit.title}</span>
                      </div>
                      <Badge
                        variant={completedCount === 4 ? 'default' : 'secondary'}
                        className={completedCount === 4 ? 'bg-green-500 text-white shrink-0' : 'shrink-0'}
                      >
                        {completedCount}/4
                      </Badge>
                    </div>
                    <Progress value={percent} className="h-1.5 mb-2" />
                    <div className="flex items-center gap-3">
                      {stages.map((stage) => (
                        <div key={stage.key} className="flex items-center gap-1">
                          {stage.completed ? (
                            <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                          ) : (
                            <Circle className="h-3.5 w-3.5 text-muted-foreground/40" />
                          )}
                          <span className={`text-xs ${stage.completed ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {stage.label}
                          </span>
                        </div>
                      ))}
                    </div>
                    {progress && (progress.vocab_quiz_score !== null || progress.passage_translation_best !== null) && (
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {progress.vocab_quiz_score !== null && (
                          <span className="text-xs text-muted-foreground">퀴즈 {progress.vocab_quiz_score}점</span>
                        )}
                        {progress.vocab_spelling_score !== null && (
                          <span className="text-xs text-muted-foreground">스펠링 {progress.vocab_spelling_score}점</span>
                        )}
                        {progress.passage_fill_blanks_best !== null && (
                          <span className="text-xs text-muted-foreground">빈칸 {progress.passage_fill_blanks_best}점</span>
                        )}
                        {progress.passage_translation_best !== null && (
                          <span className="text-xs text-muted-foreground">영작 {progress.passage_translation_best}점</span>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Per-Level Grammar Progress */}
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
