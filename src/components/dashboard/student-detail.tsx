import { createAdminClient } from '@/lib/supabase/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import { CheckCircle, Circle, BookOpen, FileText, GraduationCap, ClipboardList, Clock } from 'lucide-react';
import type { AuthUser } from '@/types/auth';
import type { NaesinExamAssignment, NaesinUnit } from '@/types/database';
import { ExamAssignmentManager } from './exam-assignment-manager';
import { PassageStageManager } from './passage-stage-manager';
import { EnabledStagesManager } from './enabled-stages-manager';

interface GrammarRelation {
  title: string;
  level?: { level_number: number; title_ko: string } | null;
}

interface NaesinProgressRow {
  unit_id: string;
  vocab_completed: boolean;
  vocab_quiz_score: number | null;
  vocab_spelling_score: number | null;
  passage_completed: boolean;
  passage_fill_blanks_best: number | null;
  passage_ordering_best: number | null;
  passage_translation_best: number | null;
  passage_grammar_vocab_best: number | null;
  grammar_completed: boolean;
  grammar_videos_completed: number;
  grammar_total_videos: number;
  problem_completed: boolean;
  updated_at: string;
}

interface NaesinData {
  textbookId: string;
  textbookName: string;
  units: Pick<NaesinUnit, 'id' | 'unit_number' | 'title'>[];
  assignments: NaesinExamAssignment[];
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

  const [videoRes, memoryRes, textbookRes, passageStagesRes, naesinProgressRes] = await Promise.all([
    admin
      .from('student_progress')
      .select('*, grammar:grammars(title, level:levels(level_number, title_ko))')
      .eq('student_id', studentId)
      .order('updated_at', { ascending: false }),
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
      .select('unit_id, vocab_completed, vocab_quiz_score, vocab_spelling_score, passage_completed, passage_fill_blanks_best, passage_ordering_best, passage_translation_best, passage_grammar_vocab_best, grammar_completed, grammar_videos_completed, grammar_total_videos, problem_completed, updated_at')
      .eq('student_id', studentId),
  ]);

  const passageStages = (passageStagesRes.data?.passage_required_stages as string[] | null) ?? ['fill_blanks', 'translation'];
  const translationSentencesPerPage = (passageStagesRes.data?.translation_sentences_per_page as number | null) ?? 10;
  const enabledStages = (passageStagesRes.data?.enabled_stages as string[] | null) ?? ['vocab', 'passage', 'grammar', 'problem', 'lastReview'];

  const videoProgress = videoRes.data || [];
  const memoryProgress = memoryRes.data || [];
  const textbookProgress = textbookRes.data || [];
  const naesinProgress = (naesinProgressRes.data || []) as NaesinProgressRow[];

  const completedVideos = videoProgress.filter((p) => p.video_completed).length;
  const masteredMemory = memoryProgress.filter((p) => p.is_mastered).length;
  const totalWatchedSeconds = videoProgress.reduce((a, p) => a + p.video_watched_seconds, 0);
  const hours = Math.floor(totalWatchedSeconds / 3600);
  const minutes = Math.floor((totalWatchedSeconds % 3600) / 60);

  // Naesin progress stats
  const naesinProgressMap = new Map(naesinProgress.map((p) => [p.unit_id, p]));
  const naesinUnits = naesinData?.units || [];
  const naesinStagesCompleted = naesinProgress.reduce((acc, p) => {
    return acc + (p.vocab_completed ? 1 : 0) + (p.passage_completed ? 1 : 0) + (p.grammar_completed ? 1 : 0) + (p.problem_completed ? 1 : 0);
  }, 0);
  const naesinTotalStages = naesinUnits.length * 4;

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
              <Badge variant={student.is_active ? 'default' : 'secondary'}>
                {student.is_active ? '활성' : '비활성'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Naesin Progress (primary) */}
        {naesinData && naesinUnits.length > 0 && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Card className="border-l-4 border-l-green-500">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">내신 단계 완료</CardTitle>
                  <div className="rounded-full bg-green-100 p-2 dark:bg-green-950">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold tracking-tight">{naesinStagesCompleted}/{naesinTotalStages}</div>
                  <p className="text-xs text-muted-foreground">전체 단계 중</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-indigo-500">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">완료 단원</CardTitle>
                  <div className="rounded-full bg-indigo-100 p-2 dark:bg-indigo-950">
                    <BookOpen className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold tracking-tight">
                    {naesinProgress.filter((p) => p.vocab_completed && p.passage_completed && p.grammar_completed && p.problem_completed).length}/{naesinUnits.length}
                  </div>
                  <p className="text-xs text-muted-foreground">모든 단계 완료된 단원</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-sky-500">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">총 학습 시간</CardTitle>
                  <div className="rounded-full bg-sky-100 p-2 dark:bg-sky-950">
                    <Clock className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold tracking-tight">{hours > 0 ? `${hours}h ` : ''}{minutes}m</div>
                  <p className="text-xs text-muted-foreground">영상 시청 시간 기준</p>
                </CardContent>
              </Card>
            </div>

            <div>
              <h3 className="text-lg font-semibold tracking-tight mb-3">단원별 내신 진행률 — {naesinData.textbookName}</h3>
              <div className="space-y-2">
                {naesinUnits.map((unit) => {
                  const progress = naesinProgressMap.get(unit.id);
                  const hasPassageScore = !!progress && (progress.passage_fill_blanks_best != null || progress.passage_ordering_best != null || progress.passage_translation_best != null || progress.passage_grammar_vocab_best != null);
                  const hasGrammarProgress = !!progress && (progress.grammar_videos_completed ?? 0) > 0;

                  const stages = [
                    { key: 'vocab', label: '단어', icon: BookOpen, completed: progress?.vocab_completed ?? false, inProgress: false },
                    { key: 'passage', label: '교과서 암기', icon: FileText, completed: progress?.passage_completed ?? false, inProgress: !progress?.passage_completed && hasPassageScore },
                    { key: 'grammar', label: '문법', icon: GraduationCap, completed: progress?.grammar_completed ?? false, inProgress: !progress?.grammar_completed && hasGrammarProgress },
                    { key: 'problem', label: '문제', icon: ClipboardList, completed: progress?.problem_completed ?? false, inProgress: false },
                  ];
                  const completedCount = stages.filter((s) => s.completed).length;

                  // Score chip helpers — vocab green, passage blue
                  const getVocabChip = (score: number | null) => {
                    if (score === null) return '';
                    return score >= 80
                      ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
                  };
                  const passageChip = 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300';

                  return (
                    <Card
                      key={unit.id}
                      className={
                        completedCount === 4
                          ? 'border-l-4 border-l-green-500'
                          : completedCount > 0
                            ? 'border-l-4 border-l-amber-400'
                            : 'border-l-4 border-l-slate-200 dark:border-l-slate-700'
                      }
                    >
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
                        <div className="flex items-center gap-3">
                          {stages.map((stage) => (
                            <div key={stage.key} className="flex items-center gap-1">
                              {stage.completed ? (
                                <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                              ) : stage.inProgress ? (
                                <Circle className="h-3.5 w-3.5 text-amber-500 fill-amber-200 dark:fill-amber-900" />
                              ) : (
                                <Circle className="h-3.5 w-3.5 text-muted-foreground/40" />
                              )}
                              <span className={`text-xs ${stage.completed ? 'text-foreground' : stage.inProgress ? 'text-amber-600 font-medium dark:text-amber-400' : 'text-muted-foreground'}`}>
                                {stage.label}
                              </span>
                            </div>
                          ))}
                        </div>
                        {progress && (progress.vocab_quiz_score !== null || progress.vocab_spelling_score !== null || progress.passage_fill_blanks_best !== null || progress.passage_ordering_best !== null || progress.passage_translation_best !== null || progress.passage_grammar_vocab_best !== null || progress.grammar_total_videos > 0) && (
                          <div className="flex gap-2 mt-2 flex-wrap">
                            {progress.vocab_quiz_score !== null && (
                              <span className={`text-xs px-1.5 py-0.5 rounded ${getVocabChip(progress.vocab_quiz_score)}`}>
                                퀴즈 {progress.vocab_quiz_score}점
                              </span>
                            )}
                            {progress.vocab_spelling_score !== null && (
                              <span className={`text-xs px-1.5 py-0.5 rounded ${getVocabChip(progress.vocab_spelling_score)}`}>
                                스펠링 {progress.vocab_spelling_score}점
                              </span>
                            )}
                            {progress.passage_fill_blanks_best !== null && (
                              <span className={`text-xs px-1.5 py-0.5 rounded ${passageChip}`}>
                                빈칸 {progress.passage_fill_blanks_best}점
                              </span>
                            )}
                            {progress.passage_ordering_best !== null && (
                              <span className={`text-xs px-1.5 py-0.5 rounded ${passageChip}`}>
                                순서 {progress.passage_ordering_best}점
                              </span>
                            )}
                            {progress.passage_translation_best !== null && (
                              <span className={`text-xs px-1.5 py-0.5 rounded ${passageChip}`}>
                                영작 {progress.passage_translation_best}점
                              </span>
                            )}
                            {progress.passage_grammar_vocab_best !== null && (
                              <span className={`text-xs px-1.5 py-0.5 rounded ${passageChip}`}>
                                어법/어휘 {progress.passage_grammar_vocab_best}점
                              </span>
                            )}
                            {progress.grammar_total_videos > 0 && (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                영상 {progress.grammar_videos_completed}/{progress.grammar_total_videos}
                              </span>
                            )}
                          </div>
                        )}
                        {progress?.updated_at && (
                          <p className="text-xs text-muted-foreground mt-1">
                            마지막 학습: {format(new Date(progress.updated_at), 'MM/dd HH:mm')}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Grammar Learning Stats (secondary) */}
        {completedVideos > 0 && (
          <div>
            <h3 className="text-lg font-semibold tracking-tight mb-3">문법 학습 현황</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Card className="border-l-4 border-l-green-500">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">완료 강의</CardTitle>
                  <div className="rounded-full bg-green-100 p-2 dark:bg-green-950">
                    <GraduationCap className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold tracking-tight">{completedVideos}</div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-indigo-500">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">암기 마스터</CardTitle>
                  <div className="rounded-full bg-indigo-100 p-2 dark:bg-indigo-950">
                    <BookOpen className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold tracking-tight">{masteredMemory}/{memoryProgress.length}</div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-purple-500">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">교과서 진행</CardTitle>
                  <div className="rounded-full bg-purple-100 p-2 dark:bg-purple-950">
                    <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold tracking-tight">{textbookProgress.length}</div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Enabled Stages Manager */}
        {naesinData && (
          <div>
            <h3 className="text-lg font-semibold tracking-tight mb-3">활성 단계 설정</h3>
            <EnabledStagesManager
              studentId={studentId}
              initialStages={enabledStages as ('vocab' | 'passage' | 'grammar' | 'problem' | 'lastReview')[]}
            />
          </div>
        )}

        {/* Passage Stage Manager */}
        {naesinData && (
          <div>
            <h3 className="text-lg font-semibold tracking-tight mb-3">교과서 암기 단계 설정</h3>
            <PassageStageManager
              studentId={studentId}
              initialStages={passageStages as ('fill_blanks' | 'ordering' | 'translation' | 'grammar_vocab')[]}
              initialTranslationSentencesPerPage={translationSentencesPerPage}
            />
          </div>
        )}

        {/* Exam Assignment Manager */}
        {naesinData && (
          <div>
            <h3 className="text-lg font-semibold tracking-tight mb-3">
              시험 배정 — {naesinData.textbookName}
            </h3>
            <ExamAssignmentManager
              studentId={studentId}
              textbookId={naesinData.textbookId}
              units={naesinData.units}
              assignments={naesinData.assignments}
            />
          </div>
        )}
      </div>
    </>
  );
}
