import { requireRole } from '@/lib/auth/helpers';
import { createClient } from '@/lib/supabase/server';
import { Topbar } from '@/components/layout/topbar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';
import type { Level, Grammar, StudentProgress } from '@/types/database';

export default async function LevelsPage() {
  const user = await requireRole(['student']);
  const supabase = await createClient();

  // Fetch levels with grammars
  const { data: levels } = await supabase
    .from('levels')
    .select('*, grammars(*)')
    .order('level_number');

  // Fetch user progress
  const { data: progress } = await supabase
    .from('student_progress')
    .select('grammar_id, video_completed')
    .eq('student_id', user.id);

  const completedMap = new Set(
    progress?.filter((p) => p.video_completed).map((p) => p.grammar_id) || []
  );

  return (
    <>
      <Topbar user={user} title="문법 학습" />
      <div className="p-4 md:p-6">
        <p className="text-muted-foreground mb-6">
          레벨을 선택하면 해당 문법 주제들을 학습할 수 있습니다.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(levels as (Level & { grammars: Grammar[] })[] || []).map((level) => {
            const totalGrammars = level.grammars?.length || 0;
            const completedGrammars = level.grammars?.filter((g) =>
              completedMap.has(g.id)
            ).length || 0;
            const progressPercent = totalGrammars > 0
              ? Math.round((completedGrammars / totalGrammars) * 100)
              : 0;

            return (
              <Link key={level.id} href={`/student/levels/${level.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <Badge variant="outline" className="text-xs">
                        Level {level.level_number}
                      </Badge>
                      {progressPercent === 100 && (
                        <Badge className="bg-green-500 text-white text-xs">완료</Badge>
                      )}
                    </div>
                    <h3 className="font-semibold mb-1">{level.title_ko}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{level.title}</p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{completedGrammars}/{totalGrammars} 완료</span>
                        <span>{progressPercent}%</span>
                      </div>
                      <Progress value={progressPercent} className="h-1.5" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
