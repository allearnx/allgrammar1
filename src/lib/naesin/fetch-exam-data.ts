import { createAdminClient } from '@/lib/supabase/admin';
import type { NaesinExamAssignment, NaesinUnit } from '@/types/database';

export interface NaesinExamData {
  textbookId: string;
  textbookName: string;
  units: Pick<NaesinUnit, 'id' | 'unit_number' | 'title'>[];
  assignments: NaesinExamAssignment[];
}

/** Fetch naesin textbook + units + exam assignments for a student (admin client). */
export async function fetchNaesinExamData(studentId: string): Promise<NaesinExamData | null> {
  const admin = createAdminClient();

  const { data: setting } = await admin
    .from('naesin_student_settings')
    .select('textbook_id, textbook:naesin_textbooks(display_name)')
    .eq('student_id', studentId)
    .single();

  if (!setting?.textbook_id) return null;

  const [unitsRes, assignmentsRes] = await Promise.all([
    admin
      .from('naesin_units')
      .select('id, unit_number, title')
      .eq('textbook_id', setting.textbook_id)
      .eq('is_active', true)
      .order('sort_order'),
    admin
      .from('naesin_exam_assignments')
      .select('*')
      .eq('student_id', studentId)
      .eq('textbook_id', setting.textbook_id)
      .order('exam_round'),
  ]);

  return {
    textbookId: setting.textbook_id as string,
    textbookName: (setting.textbook as unknown as { display_name: string } | null)?.display_name || '',
    units: unitsRes.data || [],
    assignments: assignmentsRes.data || [],
  };
}
