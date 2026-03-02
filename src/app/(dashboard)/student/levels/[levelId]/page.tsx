import { requireRole } from '@/lib/auth/helpers';
import { createClient } from '@/lib/supabase/server';
import { Topbar } from '@/components/layout/topbar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Circle, PlayCircle, BookOpen, NotebookPen } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{ levelId: string }>;
}

export default async function LevelDetailPage({ params }: Props) {
  const { levelId } = await params;
  const user = await requireRole(['student']);
  const supabase = await createClient();

  const { data: level } = await supabase
    .from('levels')
    .select('*')
    .eq('id', levelId)
    .single();

  if (!level) notFound();

  const { data: grammars } = await supabase
    .from('grammars')
    .select('*')
    .eq('level_id', levelId)
    .order('sort_order');

  const { data: progress } = await supabase
    .from('student_progress')
    .select('grammar_id, video_completed')
    .eq('student_id', user.id);

  const completedMap = new Set(
    progress?.filter((p) => p.video_completed).map((p) => p.grammar_id) || []
  );

  // Check which grammars have memory items
  const grammarIds = grammars?.map((g) => g.id) || [];
  const { data: memoryItems } = grammarIds.length > 0
    ? await supabase
        .from('memory_items')
        .select('grammar_id')
        .in('grammar_id', grammarIds)
    : { data: [] };

  const hasMemoryMap = new Set(memoryItems?.map((m) => m.grammar_id) || []);

  // Check which grammars have textbook passages
  const { data: passages } = grammarIds.length > 0
    ? await supabase
        .from('textbook_passages')
        .select('grammar_id, is_textbook_mode_active')
        .in('grammar_id', grammarIds)
        .eq('is_textbook_mode_active', true)
    : { data: [] };

  const hasTextbookMap = new Set(passages?.map((p) => p.grammar_id) || []);

  return (
    <>
      <Topbar user={user} title={`Level ${level.level_number}: ${level.title_ko}`} />
      <div className="p-4 md:p-6 space-y-4">
        <div>
          <h2 className="text-xl font-bold">{level.title}</h2>
          {level.description && (
            <p className="text-muted-foreground mt-1">{level.description}</p>
          )}
        </div>

        <div className="space-y-3">
          {(grammars || []).map((grammar, index) => {
            const isCompleted = completedMap.has(grammar.id);
            const hasMemory = hasMemoryMap.has(grammar.id);
            const hasTextbook = hasTextbookMap.has(grammar.id);

            return (
              <Card key={grammar.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="py-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {isCompleted ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium">{grammar.title}</h3>
                      {grammar.description && (
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {grammar.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {grammar.youtube_video_id && (
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/student/grammar/${grammar.id}/video`}>
                              <PlayCircle className="h-4 w-4 mr-1" />
                              영상 학습
                            </Link>
                          </Button>
                        )}
                        {hasMemory && (
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/student/grammar/${grammar.id}/memory`}>
                              <BookOpen className="h-4 w-4 mr-1" />
                              암기 학습
                            </Link>
                          </Button>
                        )}
                        {hasTextbook && (
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/student/grammar/${grammar.id}/textbook`}>
                              <NotebookPen className="h-4 w-4 mr-1" />
                              교과서 학습
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                    {isCompleted && (
                      <Badge className="bg-green-500 text-white shrink-0">완료</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {(!grammars || grammars.length === 0) && (
            <p className="text-center text-muted-foreground py-8">
              아직 등록된 문법 주제가 없습니다.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
