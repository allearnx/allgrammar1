import { requireRole } from '@/lib/auth/helpers';
import { createClient } from '@/lib/supabase/server';
import { Topbar } from '@/components/layout/topbar';
import { notFound } from 'next/navigation';
import { TextbookClient } from './client';

interface Props {
  params: Promise<{ grammarId: string }>;
}

export default async function TextbookPage({ params }: Props) {
  const { grammarId } = await params;
  const user = await requireRole(['student']);
  const supabase = await createClient();

  const { data: grammar } = await supabase
    .from('grammars')
    .select('*, level:levels(*)')
    .eq('id', grammarId)
    .single();

  if (!grammar) notFound();

  const { data: passages } = await supabase
    .from('textbook_passages')
    .select('*')
    .eq('grammar_id', grammarId)
    .eq('is_textbook_mode_active', true);

  const passageIds = passages?.map((p) => p.id) || [];
  const { data: progress } = passageIds.length > 0
    ? await supabase
        .from('student_textbook_progress')
        .select('*')
        .eq('student_id', user.id)
        .in('passage_id', passageIds)
    : { data: [] };

  const progressMap = new Map(
    progress?.map((p) => [p.passage_id, p]) || []
  );

  return (
    <>
      <Topbar user={user} title={`교과서 학습: ${grammar.title}`} />
      <div className="p-4 md:p-6 max-w-3xl mx-auto">
        <TextbookClient
          passages={passages || []}
          progressMap={Object.fromEntries(progressMap)}
        />
      </div>
    </>
  );
}
