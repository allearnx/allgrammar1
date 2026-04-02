import { createAdminClient } from '@/lib/supabase/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { notFound } from 'next/navigation';
import { BookOpen, FileText, GraduationCap } from 'lucide-react';
import type { AuthUser } from '@/types/auth';
import type { NaesinExamAssignment, NaesinUnit } from '@/types/database';
import { NaesinProgressCard } from './naesin-progress-card';
import { VocaProgressCard } from './voca-progress-card';
import { StudentReportPanel } from './student-report-panel';
import { ParentShareButton } from './parent-share-button';
import { ImpersonateButton } from './impersonate-button';
import { TextbookAssigner } from './textbook-assigner';
import { getPlanContext } from '@/lib/billing/get-plan-context';

interface NaesinData {
  textbookId: string;
  textbookName: string;
  units: Pick<NaesinUnit, 'id' | 'unit_number' | 'title'>[];
  assignments: NaesinExamAssignment[];
}

interface VocaProgressRow {
  day_id: string;
  flashcard_completed: boolean;
  quiz_score: number | null;
  spelling_score: number | null;
  matching_score: number | null;
  matching_completed: boolean;
  round2_flashcard_completed: boolean;
  round2_quiz_score: number | null;
  round2_matching_score: number | null;
  round2_matching_completed: boolean;
  updated_at: string;
  day: {
    id: string;
    day_number: number;
    title: string;
    book: { id: string; title: string; sort_order: number } | null;
  } | null;
}

interface Props {
  user: AuthUser;
  studentId: string;
  naesinData?: NaesinData | null;
}

export async function StudentDetail({ user, studentId, naesinData }: Props) {
  const admin = createAdminClient();

  const { data: student } = await admin
    .from('users')
    .select('*')
    .eq('id', studentId)
    .single();

  if (!student) notFound();

  const [videoRes, naesinVideoRes, memoryRes, textbookRes, passageStagesRes, naesinProgressRes, vocaProgressRes, vocaAssignmentRes, naesinAssignmentRes, naesinTextbooksRes] = await Promise.all([
    admin
      .from('student_progress')
      .select('*, grammar:grammars(title, level:levels(level_number, title_ko))')
      .eq('student_id', studentId)
      .order('updated_at', { ascending: false }),
    admin
      .from('naesin_grammar_video_progress')
      .select('cumulative_watch_seconds')
      .eq('student_id', studentId),
    admin
      .from('student_memory_progress')
      .select('*, memory_item:memory_items(front_text, grammar:grammars(title))')
      .eq('student_id', studentId),
    admin
      .from('student_textbook_progress')
      .select('*, passage:textbook_passages(title, grammar:grammars(title))')
      .eq('student_id', studentId),
    admin
      .from('naesin_student_settings')
      .select('passage_required_stages, translation_sentences_per_page, enabled_stages')
      .eq('student_id', studentId)
      .single(),
    admin
      .from('naesin_student_progress')
      .select('unit_id, vocab_completed, vocab_quiz_score, vocab_spelling_score, passage_completed, passage_fill_blanks_best, passage_ordering_best, passage_translation_best, passage_grammar_vocab_best, grammar_completed, grammar_videos_completed, grammar_total_videos, problem_completed, total_learning_seconds, updated_at')
      .eq('student_id', studentId),
    admin
      .from('voca_student_progress')
      .select('day_id, flashcard_completed, quiz_score, spelling_score, matching_score, matching_completed, round2_flashcard_completed, round2_quiz_score, round2_matching_score, round2_matching_completed, updated_at, day:voca_days(id, day_number, title, book:voca_books(id, title, sort_order))')
      .eq('student_id', studentId),
    admin
      .from('service_assignments')
      .select('id')
      .eq('student_id', studentId)
      .eq('service', 'voca')
      .maybeSingle(),
    admin
      .from('service_assignments')
      .select('id')
      .eq('student_id', studentId)
      .eq('service', 'naesin')
      .maybeSingle(),
    admin
      .from('naesin_textbooks')
      .select('id, grade, publisher, display_name')
      .eq('is_active', true)
      .order('grade')
      .order('sort_order'),
  ]);

  const passageStages = (passageStagesRes.data?.passage_required_stages as string[] | null) ?? ['fill_blanks', 'translation'];
  const translationSentencesPerPage = (passageStagesRes.data?.translation_sentences_per_page as number | null) ?? 10;
  const enabledStages = (passageStagesRes.data?.enabled_stages as string[] | null) ?? ['vocab', 'passage', 'dialogue', 'textbookVideo', 'grammar', 'problem', 'mockExam', 'lastReview'];
  const planContext = await getPlanContext(student.academy_id, studentId);

  const videoProgress = videoRes.data || [];
  const memoryProgress = memoryRes.data || [];
  const textbookProgress = textbookRes.data || [];
  const naesinProgress = naesinProgressRes.data || [];

  const completedVideos = videoProgress.filter((p) => p.video_completed).length;
  const masteredMemory = memoryProgress.filter((p) => p.is_mastered).length;
  const legacyWatchedSeconds = videoProgress.reduce((a, p) => a + p.video_watched_seconds, 0);
  const naesinWatchedSeconds = naesinVideoRes.data?.reduce((a, p) => a + (p.cumulative_watch_seconds || 0), 0) || 0;
  const naesinSessionSeconds = naesinProgress.reduce((a, p) => a + (p.total_learning_seconds || 0), 0);
  const totalWatchedSeconds = legacyWatchedSeconds + naesinWatchedSeconds + naesinSessionSeconds;
  const hours = Math.floor(totalWatchedSeconds / 3600);
  const minutes = Math.floor((totalWatchedSeconds % 3600) / 60);

  const vocaProgress = (vocaProgressRes.data || []) as unknown as VocaProgressRow[];
  const hasVocaAssignment = !!vocaAssignmentRes.data;
  const hasNaesinAssignment = !!naesinAssignmentRes.data;
  const naesinTextbooks = naesinTextbooksRes.data || [];
  const naesinUnits = naesinData?.units || [];

  const detailServices: string[] = [];
  if (naesinData) detailServices.push('naesin');
  if (hasVocaAssignment) detailServices.push('voca');

  return (
    <>
      <div className="p-4 md:p-6 space-y-6">
        {/* Student Info */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight">{student.full_name}</h2>
                <p className="text-muted-foreground">{student.email}</p>
              </div>
              <div className="flex items-center gap-2">
                {user.role === 'boss' && <ImpersonateButton studentId={studentId} />}
                <ParentShareButton studentId={studentId} />
                <Badge variant={student.is_active ? 'default' : 'secondary'}>
                  {student.is_active ? '활성' : '비활성'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 상세 리포트 패널 */}
        <StudentReportPanel studentId={studentId} services={detailServices} />

        {/* 올킬보카 서비스 카드 */}
        {hasVocaAssignment && (
          <VocaProgressCard vocaProgress={vocaProgress} />
        )}

        {/* 교과서 배정 */}
        {hasNaesinAssignment && (
          <TextbookAssigner
            studentId={studentId}
            textbooks={naesinTextbooks}
            currentTextbookName={naesinData?.textbookName}
          />
        )}

        {/* 내신 대비 서비스 카드 */}
        {naesinData && naesinUnits.length > 0 && (
          <NaesinProgressCard
            studentId={studentId}
            naesinData={naesinData}
            naesinProgress={naesinProgress}
            hours={hours}
            minutes={minutes}
            enabledStages={enabledStages as ('vocab' | 'passage' | 'grammar' | 'problem' | 'lastReview')[]}
            passageStages={passageStages as ('fill_blanks' | 'ordering' | 'translation' | 'grammar_vocab')[]}
            translationSentencesPerPage={translationSentencesPerPage}
            tier={planContext.tier}
          />
        )}

        {/* 문법 학습 서비스 카드 */}
        {completedVideos > 0 && (
          <Card className="border-l-4 border-l-sky-500">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-sky-100 p-2 dark:bg-sky-950">
                  <FileText className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                </div>
                <CardTitle className="text-lg">문법 학습 현황</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-lg border p-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">완료 강의</p>
                    <GraduationCap className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="text-2xl font-bold tracking-tight">{completedVideos}</div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">암기 마스터</p>
                    <BookOpen className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="text-2xl font-bold tracking-tight">{masteredMemory}/{memoryProgress.length}</div>
                </div>
                <div className="rounded-lg border p-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">교과서 진행</p>
                    <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="text-2xl font-bold tracking-tight">{textbookProgress.length}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
