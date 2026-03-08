import { createAdminClient } from '@/lib/supabase/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import type { AuthUser } from '@/types/auth';
import type { NaesinExamAssignment, NaesinUnit } from '@/types/database';
import { ExamAssignmentManager } from './exam-assignment-manager';
import { PassageStageManager } from './passage-stage-manager';

interface GrammarRelation {
  title: string;
  level?: { level_number: number; title_ko: string } | null;
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

  const [videoRes, memoryRes, textbookRes, passageStagesRes] = await Promise.all([
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
      .select('passage_required_stages')
      .eq('student_id', studentId)
      .single(),
  ]);

  const passageStages = (passageStagesRes.data?.passage_required_stages as string[] | null) ?? ['fill_blanks', 'translation'];

  const videoProgress = videoRes.data || [];
  const memoryProgress = memoryRes.data || [];
  const textbookProgress = textbookRes.data || [];

  const completedVideos = videoProgress.filter((p) => p.video_completed).length;
  const masteredMemory = memoryProgress.filter((p) => p.is_mastered).length;
  const totalWatchedSeconds = videoProgress.reduce((a, p) => a + p.video_watched_seconds, 0);
  const hours = Math.floor(totalWatchedSeconds / 3600);
  const minutes = Math.floor((totalWatchedSeconds % 3600) / 60);

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

        {/* Summary Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
              <CardTitle className="text-sm font-medium">총 학습 시간</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{hours > 0 ? `${hours}h ` : ''}{minutes}m</div>
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

        {/* Recent Activity */}
        <div>
          <h3 className="text-lg font-semibold mb-3">최근 학습 활동</h3>
          <div className="space-y-2">
            {videoProgress.slice(0, 10).map((p) => (
              <Card key={p.id}>
                <CardContent className="py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">
                        {(p.grammar as GrammarRelation | null)?.title || '문법'}
                      </span>
                      {(p.grammar as GrammarRelation | null)?.level && (
                        <span className="text-xs text-muted-foreground ml-2">
                          Lv.{(p.grammar as GrammarRelation).level!.level_number}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {p.video_completed ? (
                        <Badge className="bg-green-500 text-white text-xs">완료</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">진행중</Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(p.updated_at), 'MM/dd HH:mm')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {videoProgress.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                아직 학습 기록이 없습니다.
              </p>
            )}
          </div>
        </div>

        {/* Passage Stage Manager */}
        {naesinData && (
          <div>
            <h3 className="text-lg font-semibold mb-3">교과서 암기 단계 설정</h3>
            <PassageStageManager
              studentId={studentId}
              initialStages={passageStages as ('fill_blanks' | 'ordering' | 'translation' | 'grammar_vocab')[]}
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
