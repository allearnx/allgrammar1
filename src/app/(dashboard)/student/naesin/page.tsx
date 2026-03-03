import { requireRole } from '@/lib/auth/helpers';
import { createClient } from '@/lib/supabase/server';
import { Topbar } from '@/components/layout/topbar';
import { NaesinHome } from './client';

export default async function NaesinPage() {
  const user = await requireRole(['student']);
  const supabase = await createClient();

  // Get student's textbook setting
  const { data: setting } = await supabase
    .from('naesin_student_settings')
    .select('*, textbook:naesin_textbooks(*)')
    .eq('student_id', user.id)
    .single();

  // Get all active textbooks
  const { data: textbooks } = await supabase
    .from('naesin_textbooks')
    .select('*')
    .eq('is_active', true)
    .order('grade')
    .order('sort_order');

  // If student has a textbook selected, get the units with progress
  let units: Array<{
    id: string;
    unit_number: number;
    title: string;
    sort_order: number;
    hasVocab: boolean;
    hasPassage: boolean;
    hasGrammar: boolean;
    hasOmr: boolean;
    progress: {
      vocab_completed: boolean;
      passage_completed: boolean;
      grammar_completed: boolean;
      omr_completed: boolean;
    } | null;
  }> = [];

  if (setting?.textbook_id) {
    const { data: rawUnits } = await supabase
      .from('naesin_units')
      .select('id, unit_number, title, sort_order')
      .eq('textbook_id', setting.textbook_id)
      .eq('is_active', true)
      .order('sort_order');

    if (rawUnits && rawUnits.length > 0) {
      const unitIds = rawUnits.map((u) => u.id);

      // Check content availability for each unit
      const [vocabRes, passageRes, grammarRes, omrRes, progressRes] = await Promise.all([
        supabase.from('naesin_vocabulary').select('unit_id').in('unit_id', unitIds),
        supabase.from('naesin_passages').select('unit_id').in('unit_id', unitIds),
        supabase.from('naesin_grammar_lessons').select('unit_id').in('unit_id', unitIds),
        supabase.from('naesin_omr_sheets').select('unit_id').in('unit_id', unitIds),
        supabase
          .from('naesin_student_progress')
          .select('unit_id, vocab_completed, passage_completed, grammar_completed, omr_completed')
          .eq('student_id', user.id)
          .in('unit_id', unitIds),
      ]);

      const vocabSet = new Set(vocabRes.data?.map((v) => v.unit_id) || []);
      const passageSet = new Set(passageRes.data?.map((p) => p.unit_id) || []);
      const grammarSet = new Set(grammarRes.data?.map((g) => g.unit_id) || []);
      const omrSet = new Set(omrRes.data?.map((o) => o.unit_id) || []);
      const progressMap = new Map(
        progressRes.data?.map((p) => [p.unit_id, p]) || []
      );

      units = rawUnits.map((u) => ({
        id: u.id,
        unit_number: u.unit_number,
        title: u.title,
        sort_order: u.sort_order,
        hasVocab: vocabSet.has(u.id),
        hasPassage: passageSet.has(u.id),
        hasGrammar: grammarSet.has(u.id),
        hasOmr: omrSet.has(u.id),
        progress: progressMap.get(u.id) || null,
      }));
    }
  }

  return (
    <>
      <Topbar user={user} title="내신 대비" />
      <div className="p-4 md:p-6">
        <NaesinHome
          textbooks={textbooks || []}
          selectedTextbook={setting?.textbook ? setting.textbook : null}
          units={units}
        />
      </div>
    </>
  );
}
