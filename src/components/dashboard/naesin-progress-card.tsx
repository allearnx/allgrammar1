import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { CheckCircle, Circle, BookOpen, FileText, GraduationCap, ClipboardList, Clock, Settings } from 'lucide-react';
import { scoreChipClass, passageChipClass, progressBorderClass } from '@/lib/utils/progress-styles';
import { ExamAssignmentManager } from './exam-assignment-manager';
import { PassageStageManager } from './passage-stage-manager';
import { EnabledStagesManager } from './enabled-stages-manager';
import type { NaesinExamAssignment, NaesinUnit } from '@/types/database';

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
  studentId: string;
  naesinData: NaesinData;
  naesinProgress: NaesinProgressRow[];
  hours: number;
  minutes: number;
  enabledStages: ('vocab' | 'passage' | 'grammar' | 'problem' | 'lastReview')[];
  passageStages: ('fill_blanks' | 'ordering' | 'translation' | 'grammar_vocab')[];
  translationSentencesPerPage: number;
}

export function NaesinProgressCard({
  studentId,
  naesinData,
  naesinProgress,
  hours,
  minutes,
  enabledStages,
  passageStages,
  translationSentencesPerPage,
}: Props) {
  const naesinUnits = naesinData.units;
  const naesinProgressMap = new Map(naesinProgress.map((p) => [p.unit_id, p]));
  const naesinStagesCompleted = naesinProgress.reduce((acc, p) => {
    return acc + (p.vocab_completed ? 1 : 0) + (p.passage_completed ? 1 : 0) + (p.grammar_completed ? 1 : 0) + (p.problem_completed ? 1 : 0);
  }, 0);
  const naesinTotalStages = naesinUnits.length * 4;

  return (
    <Card className="border-l-4 border-l-green-500">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-green-100 p-2 dark:bg-green-950">
            <GraduationCap className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-lg">내신 대비</CardTitle>
          <Badge variant="outline" className="text-xs">{naesinData.textbookName}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 통계 3개 */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">내신 단계 완료</p>
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-2xl font-bold tracking-tight">{naesinStagesCompleted}/{naesinTotalStages}</div>
            <p className="text-xs text-muted-foreground">전체 단계 중</p>
          </div>
          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">완료 단원</p>
              <BookOpen className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="text-2xl font-bold tracking-tight">
              {naesinProgress.filter((p) => p.vocab_completed && p.passage_completed && p.grammar_completed && p.problem_completed).length}/{naesinUnits.length}
            </div>
            <p className="text-xs text-muted-foreground">모든 단계 완료된 단원</p>
          </div>
          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">총 학습 시간</p>
              <Clock className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            </div>
            <div className="text-2xl font-bold tracking-tight">{hours > 0 ? `${hours}h ` : ''}{minutes}m</div>
            <p className="text-xs text-muted-foreground">영상 시청 시간 기준</p>
          </div>
        </div>

        {/* 단원별 진행률 */}
        <div>
          <h4 className="text-sm font-semibold tracking-tight mb-2">단원별 진행률</h4>
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

              return (
                <div
                  key={unit.id}
                  className={`rounded-lg border p-3 ${progressBorderClass(completedCount, 4)}`}
                >
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
                        <span className={`text-xs px-1.5 py-0.5 rounded ${scoreChipClass(progress.vocab_quiz_score)}`}>
                          퀴즈 {progress.vocab_quiz_score}점
                        </span>
                      )}
                      {progress.vocab_spelling_score !== null && (
                        <span className={`text-xs px-1.5 py-0.5 rounded ${scoreChipClass(progress.vocab_spelling_score)}`}>
                          스펠링 {progress.vocab_spelling_score}점
                        </span>
                      )}
                      {progress.passage_fill_blanks_best !== null && (
                        <span className={`text-xs px-1.5 py-0.5 rounded ${passageChipClass}`}>
                          빈칸 {progress.passage_fill_blanks_best}점
                        </span>
                      )}
                      {progress.passage_ordering_best !== null && (
                        <span className={`text-xs px-1.5 py-0.5 rounded ${passageChipClass}`}>
                          순서 {progress.passage_ordering_best}점
                        </span>
                      )}
                      {progress.passage_translation_best !== null && (
                        <span className={`text-xs px-1.5 py-0.5 rounded ${passageChipClass}`}>
                          영작 {progress.passage_translation_best}점
                        </span>
                      )}
                      {progress.passage_grammar_vocab_best !== null && (
                        <span className={`text-xs px-1.5 py-0.5 rounded ${passageChipClass}`}>
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
                </div>
              );
            })}
          </div>
        </div>

        {/* 설정 영역 */}
        <div className="space-y-4 border-t pt-4">
          <div className="flex items-center gap-2 mb-2">
            <Settings className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-semibold tracking-tight">설정</h4>
          </div>
          <div>
            <h5 className="text-sm font-medium text-muted-foreground mb-2">활성 단계</h5>
            <EnabledStagesManager
              studentId={studentId}
              initialStages={enabledStages}
            />
          </div>
          <div>
            <h5 className="text-sm font-medium text-muted-foreground mb-2">교과서 암기 단계</h5>
            <PassageStageManager
              studentId={studentId}
              initialStages={passageStages}
              initialTranslationSentencesPerPage={translationSentencesPerPage}
            />
          </div>
          <div>
            <h5 className="text-sm font-medium text-muted-foreground mb-2">시험 배정</h5>
            <ExamAssignmentManager
              studentId={studentId}
              textbookId={naesinData.textbookId}
              units={naesinData.units}
              assignments={naesinData.assignments}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
