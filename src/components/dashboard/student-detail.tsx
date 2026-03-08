import { createAdminClient } from '@/lib/supabase/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import { CheckCircle, Circle, BookOpen, FileText, GraduationCap, ClipboardList } from 'lucide-react';
import type { AuthUser } from '@/types/auth';
import type { NaesinExamAssignment, NaesinUnit } from '@/types/database';
import { ExamAssignmentManager } from './exam-assignment-manager';
import { PassageStageManager } from './passage-stage-manager';

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
      .select('passage_required_stages, translation_sentences_per_page')
      .eq('student_id', studentId)
      .single(),
    admin
      .from('naesin_student_progress')
      .select('unit_id, vocab_completed, vocab_quiz_score, vocab_spelling_score, passage_completed, passage_fill_blanks_best, passage_ordering_best, passage_translation_best, passage_grammar_vocab_best, grammar_completed, grammar_videos_completed, grammar_total_videos, problem_completed, updated_at')
      .eq('student_id', studentId),
  ]);

  const passageStages = (passageStagesRes.data?.passage_required_stages as string[] | null) ?? ['fill_blanks', 'translation'];
  const translationSentencesPerPage = (passageStagesRes.data?.translation_sentences_per_page as number | null) ?? 10;

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
                <h2 className="text-xl font-bold">{student.full_name}</h2>
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
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">내신 단계 완료</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{naesinStagesCompleted}/{naesinTotalStages}</div>
                  <p className="text-xs text-muted-foreground">전체 단계 중</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">완료 단원</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {naesinProgress.filter((p) => p.vocab_completed && p.passage_completed && p.grammar_completed && p.problem_completed).length}/{naesinUnits.length}
                  </div>
                  <p className="text-xs text-muted-foreground">모든 단계 완료된 단원</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">총 학습 시간</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{hours > 0 ? `${hours}h ` : ''}{minutes}m</div>
                  <p className="text-xs text-muted-foreground">영상 시청 시간 기준</p>
                </CardContent>
              </Card>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">단원별 내신 진행률 — {naesinData.textbookName}</h3>
              <div className="space-y-2">
                {naesinUnits.map((unit) => {
                  const progress = naesinProgressMap.get(unit.id);
                  const stages = [
                    { key: 'vocab', label: '단어', icon: BookOpen, completed: progress?.vocab_completed ?? false },
                    { key: 'passage', label: '교과서', icon: FileText, completed: progress?.passage_completed ?? false },
                    { key: 'grammar', label: '문법', icon: GraduationCap, completed: progress?.grammar_completed ?? false },
                    { key: 'problem', label: '문제', icon: ClipboardList, completed: progress?.problem_completed ?? false },
                  ];
                  const completedCount = stages.filter((s) => s.completed).length;

                  return (
                    <Card key={unit.id}>
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
                          {stages.map((stage) => {
                            const Icon = stage.icon;
                            return (
                              <div key={stage.key} className="flex items-center gap-1">
                                {stage.completed ? (
                                  <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                                ) : (
                                  <Circle className="h-3.5 w-3.5 text-muted-foreground/40" />
                                )}
                                <span className={`text-xs ${stage.completed ? 'text-foreground' : 'text-muted-foreground'}`}>
                                  {stage.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                        {progress && (progress.vocab_quiz_score !== null || progress.passage_translation_best !== null) && (
                          <div className="flex gap-2 mt-2 flex-wrap">
                            {progress.vocab_quiz_score !== null && (
                              <span className="text-xs text-muted-foreground">퀴즈 {progress.vocab_quiz_score}점</span>
                            )}
                            {progress.vocab_spelling_score !== null && (
                              <span className="text-xs text-muted-foreground">스펠링 {progress.vocab_spelling_score}점</span>
                            )}
                            {progress.passage_fill_blanks_best !== null && (
                              <span className="text-xs text-muted-foreground">빈칸 {progress.passage_fill_blanks_best}점</span>
                            )}
                            {progress.passage_translation_best !== null && (
                              <span className="text-xs text-muted-foreground">영작 {progress.passage_translation_best}점</span>
                            )}
                            {progress.grammar_total_videos > 0 && (
                              <span className="text-xs text-muted-foreground">영상 {progress.grammar_videos_completed}/{progress.grammar_total_videos}</span>
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
            <h3 className="text-lg font-semibold mb-3">문법 학습 현황</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">완료 강의</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{completedVideos}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">암기 마스터</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{masteredMemory}/{memoryProgress.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">교과서 진행</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{textbookProgress.length}</div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Passage Stage Manager */}
        {naesinData && (
          <div>
            <h3 className="text-lg font-semibold mb-3">교과서 암기 단계 설정</h3>
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
            <h3 className="text-lg font-semibold mb-3">
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
