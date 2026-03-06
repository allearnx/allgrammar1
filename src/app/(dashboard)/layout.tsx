import { requireUser } from '@/lib/auth/helpers';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/layout/sidebar';
import { calculateStageStatuses } from '@/lib/naesin/stage-unlock';
import type { NaesinStageStatuses } from '@/types/database';

export interface NaesinSidebarExam {
  round: number;
  label: string;
  examDate: string | null;
  units: {
    id: string;
    unitNumber: number;
    title: string;
    stageStatuses: NaesinStageStatuses;
  }[];
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  // Fetch assigned services for students
  let services: string[] | undefined;
  let naesinTree: NaesinSidebarExam[] | undefined;

  if (user.role === 'student') {
    const supabase = await createClient();
    const { data } = await supabase
      .from('service_assignments')
      .select('service')
      .eq('student_id', user.id);
    services = data?.map((d) => d.service) || [];

    // Fetch naesin sidebar tree if student has naesin service
    if (services.includes('naesin')) {
      naesinTree = await fetchNaesinTree(supabase, user.id);
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={user} services={services} naesinTree={naesinTree} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

async function fetchNaesinTree(
  supabase: SupabaseClient,
  studentId: string
): Promise<NaesinSidebarExam[] | undefined> {
  // Get student textbook setting
  const { data: setting } = await supabase
    .from('naesin_student_settings')
    .select('textbook_id')
    .eq('student_id', studentId)
    .single();

  if (!setting?.textbook_id) return undefined;

  // Fetch assignments, units, and progress in parallel
  const [assignmentsRes, unitsRes, progressRes, vocabRes, passageRes, grammarRes, problemRes, lastReviewSheetRes, similarRes, reviewContentRes, quizSetsRes] = await Promise.all([
    supabase
      .from('naesin_exam_assignments')
      .select('*')
      .eq('student_id', studentId)
      .eq('textbook_id', setting.textbook_id)
      .order('exam_round'),
    supabase
      .from('naesin_units')
      .select('id, unit_number, title, sort_order')
      .eq('textbook_id', setting.textbook_id)
      .eq('is_active', true)
      .order('sort_order'),
    supabase
      .from('naesin_student_progress')
      .select('*')
      .eq('student_id', studentId),
    supabase
      .from('naesin_vocabulary')
      .select('unit_id'),
    supabase
      .from('naesin_passages')
      .select('unit_id'),
    supabase
      .from('naesin_grammar_lessons')
      .select('id, unit_id, content_type'),
    supabase
      .from('naesin_problem_sheets')
      .select('unit_id')
      .eq('category', 'problem'),
    supabase
      .from('naesin_problem_sheets')
      .select('unit_id')
      .eq('category', 'last_review'),
    supabase
      .from('naesin_similar_problems')
      .select('unit_id')
      .eq('status', 'approved'),
    supabase
      .from('naesin_last_review_content')
      .select('unit_id'),
    supabase
      .from('naesin_vocab_quiz_sets')
      .select('id, unit_id'),
  ]);

  const assignments = assignmentsRes.data || [];
  const units = unitsRes.data || [];

  if (assignments.length === 0 || units.length === 0) return undefined;

  // Build lookup maps
  const progressMap = new Map((progressRes.data || []).map((p) => [p.unit_id, p]));
  const vocabUnitIds = new Set((vocabRes.data || []).map((r) => r.unit_id));
  const passageUnitIds = new Set((passageRes.data || []).map((r) => r.unit_id));
  const grammarByUnit = groupBy(grammarRes.data || [], 'unit_id');
  const problemUnitIds = new Set((problemRes.data || []).map((r) => r.unit_id));
  const lastReviewSheetUnitIds = new Set((lastReviewSheetRes.data || []).map((r) => r.unit_id));
  const similarUnitIds = new Set((similarRes.data || []).map((r) => r.unit_id));
  const reviewContentUnitIds = new Set((reviewContentRes.data || []).map((r) => r.unit_id));
  const quizSetsByUnit = groupBy(quizSetsRes.data || [], 'unit_id');
  const unitMap = new Map(units.map((u) => [u.id, u]));

  return assignments.map((a) => ({
    round: a.exam_round,
    label: a.exam_label || `${a.exam_round}차 시험`,
    examDate: a.exam_date,
    units: (a.unit_ids as string[])
      .map((uid) => unitMap.get(uid))
      .filter(Boolean)
      .map((u) => {
        const unitGrammar = grammarByUnit[u!.id] || [];
        const videoLessons = unitGrammar.filter((l: { content_type: string }) => l.content_type === 'video');
        const unitQuizSets = quizSetsByUnit[u!.id] || [];
        const hasLastReview = lastReviewSheetUnitIds.has(u!.id) || similarUnitIds.has(u!.id) || reviewContentUnitIds.has(u!.id);

        const stageStatuses = calculateStageStatuses({
          progress: progressMap.get(u!.id) || null,
          content: {
            hasVocab: vocabUnitIds.has(u!.id),
            hasPassage: passageUnitIds.has(u!.id),
            hasGrammar: unitGrammar.length > 0,
            hasProblem: problemUnitIds.has(u!.id),
            hasLastReview: hasLastReview || !!a.exam_date,
          },
          vocabQuizSetCount: unitQuizSets.length,
          grammarVideoCount: videoLessons.length,
          examDate: a.exam_date,
        });

        return {
          id: u!.id,
          unitNumber: u!.unit_number,
          title: u!.title,
          stageStatuses,
        };
      }),
  }));
}

function groupBy<T extends Record<string, unknown>>(items: T[], key: string): Record<string, T[]> {
  const result: Record<string, T[]> = {};
  for (const item of items) {
    const k = item[key] as string;
    if (!result[k]) result[k] = [];
    result[k].push(item);
  }
  return result;
}
