import { requireRole } from '@/lib/auth/helpers';
import { createClient } from '@/lib/supabase/server';
import { Topbar } from '@/components/layout/topbar';
import { notFound } from 'next/navigation';
import { NaesinUnitDetail } from './client';
import { calculateStageStatuses } from '@/lib/naesin/stage-unlock';
import type { NaesinContentAvailability } from '@/types/database';

interface Props {
  params: Promise<{ unitId: string }>;
}

export default async function NaesinUnitPage({ params }: Props) {
  const { unitId } = await params;
  const user = await requireRole(['student']);
  const supabase = await createClient();

  // Fetch unit info
  const { data: unit } = await supabase
    .from('naesin_units')
    .select('*, textbook:naesin_textbooks(display_name)')
    .eq('id', unitId)
    .single();

  if (!unit) notFound();

  // Fetch all content and progress in parallel
  const [vocabRes, passageRes, grammarRes, omrRes, progressRes] = await Promise.all([
    supabase
      .from('naesin_vocabulary')
      .select('*')
      .eq('unit_id', unitId)
      .order('sort_order'),
    supabase
      .from('naesin_passages')
      .select('*')
      .eq('unit_id', unitId)
      .order('sort_order'),
    supabase
      .from('naesin_grammar_lessons')
      .select('*')
      .eq('unit_id', unitId)
      .order('sort_order'),
    supabase
      .from('naesin_omr_sheets')
      .select('*')
      .eq('unit_id', unitId)
      .order('sort_order'),
    supabase
      .from('naesin_student_progress')
      .select('*')
      .eq('student_id', user.id)
      .eq('unit_id', unitId)
      .single(),
  ]);

  const vocabulary = vocabRes.data || [];
  const passages = passageRes.data || [];
  const grammarLessons = grammarRes.data || [];
  const omrSheets = omrRes.data || [];
  const progress = progressRes.data;

  const contentAvailability: NaesinContentAvailability = {
    hasVocab: vocabulary.length > 0,
    hasPassage: passages.length > 0,
    hasGrammar: grammarLessons.length > 0,
    hasOmr: omrSheets.length > 0,
  };

  const stageStatuses = calculateStageStatuses(progress, contentAvailability);

  const textbookName = (unit.textbook as { display_name: string } | null)?.display_name || '';

  return (
    <>
      <Topbar user={user} title={`${textbookName} - ${unit.title}`} />
      <div className="p-4 md:p-6">
        <NaesinUnitDetail
          unit={{ id: unit.id, unit_number: unit.unit_number, title: unit.title }}
          vocabulary={vocabulary}
          passages={passages}
          grammarLessons={grammarLessons}
          omrSheets={omrSheets}
          stageStatuses={stageStatuses}
        />
      </div>
    </>
  );
}
