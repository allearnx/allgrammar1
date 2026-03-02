import { requireRole } from '@/lib/auth/helpers';
import { createClient } from '@/lib/supabase/server';
import { Topbar } from '@/components/layout/topbar';
import { notFound } from 'next/navigation';
import { MemoryClient } from './client';

interface Props {
  params: Promise<{ grammarId: string }>;
}

export default async function MemoryPage({ params }: Props) {
  const { grammarId } = await params;
  const user = await requireRole(['student']);
  const supabase = await createClient();

  const { data: grammar } = await supabase
    .from('grammars')
    .select('*, level:levels(*)')
    .eq('id', grammarId)
    .single();

  if (!grammar) notFound();

  const { data: items } = await supabase
    .from('memory_items')
    .select('*')
    .eq('grammar_id', grammarId)
    .order('sort_order');

  const { data: progress } = await supabase
    .from('student_memory_progress')
    .select('*')
    .eq('student_id', user.id)
    .in('memory_item_id', items?.map((i) => i.id) || []);

  const progressMap = new Map(
    progress?.map((p) => [p.memory_item_id, p]) || []
  );

  const itemsWithProgress = (items || []).map((item) => ({
    ...item,
    progress: progressMap.get(item.id) || null,
  }));

  return (
    <>
      <Topbar user={user} title={`암기 학습: ${grammar.title}`} />
      <div className="p-4 md:p-6 max-w-2xl mx-auto">
        <MemoryClient items={itemsWithProgress} grammarId={grammarId} />
      </div>
    </>
  );
}
