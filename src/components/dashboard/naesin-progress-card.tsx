import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { CheckCircle, Circle, BookOpen, FileText, GraduationCap, ClipboardList, Clock, Settings, MessageSquare, FileQuestion } from 'lucide-react';
import { scoreChipClass, passageChipClass, progressBorderClass } from '@/lib/utils/progress-styles';
import { ExamAssignmentManager } from './exam-assignment-manager';
import { PassageStageManager } from './passage-stage-manager';
import { EnabledStagesManager } from './enabled-stages-manager';
import { ManualProgressToggle } from './manual-progress-toggle';
import type { NaesinExamAssignment, NaesinUnit } from '@/types/database';
import type { Tier } from '@/lib/billing/feature-gate';

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
  dialogue_ordering_best: number | null;
  dialogue_first_letter_best: number | null;
  dialogue_translation_best: number | null;
  dialogue_completed: boolean;
  grammar_completed: boolean;
  grammar_videos_completed: number;
  grammar_total_videos: number;
  problem_completed: boolean;
  mock_exam_completed?: boolean;
  updated_at: string;
  // Round 2
  round2_passage_fill_blanks_best?: number | null;
  round2_passage_ordering_best?: number | null;
  round2_passage_translation_best?: number | null;
  round2_passage_grammar_vocab_best?: number | null;
  round2_passage_completed?: boolean;
  round2_dialogue_ordering_best?: number | null;
  round2_dialogue_first_letter_best?: number | null;
  round2_dialogue_translation_best?: number | null;
  round2_dialogue_completed?: boolean;
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
  enabledStages: ('vocab' | 'passage' | 'dialogue' | 'textbookVideo' | 'grammar' | 'problem' | 'mockExam' | 'lastReview')[];
  passageStages: ('fill_blanks' | 'ordering' | 'translation' | 'grammar_vocab')[];
  translationSentencesPerPage: number;
  tier?: Tier;
  fillBlanksByUnit?: Record<string, Record<string, number>>;
  problemSheetsByUnit?: Record<string, { id: string; title: string; category?: string }[]>;
  problemAttemptsBySheet?: Record<string, { score: number; total: number; pct: number }>;
  grammarContentByUnit?: Record<string, boolean>;
  naesinRequiredRounds?: number;
  hideSettings?: boolean;
  /** 선생님이 수동으로 진도를 체크할 수 있는지 여부 */
  canEditProgress?: boolean;
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
  tier,
  fillBlanksByUnit,
  problemSheetsByUnit,
  problemAttemptsBySheet,
  grammarContentByUnit,
  naesinRequiredRounds,
  hideSettings,
  canEditProgress,
}: Props) {
  const hasRound2 = (naesinRequiredRounds ?? 1) >= 2;
  const naesinUnits = naesinData.units;
  const naesinProgressMap = new Map(naesinProgress.map((p) => [p.unit_id, p]));
  const stageCount = hasRound2 ? 7 : 5;
  const isGrammarCompleted = (unitId: string, progress: NaesinProgressRow | undefined) => {
    if (grammarContentByUnit && !grammarContentByUnit[unitId]) return true; // no grammar content = auto-completed
    return progress?.grammar_completed ?? false;
  };
  const hasMockExamByUnit = new Map<string, boolean>();
  if (problemSheetsByUnit) {
    for (const unit of naesinUnits) {
      const sheets = problemSheetsByUnit[unit.id] || [];
      hasMockExamByUnit.set(unit.id, sheets.some((s) => s.category === 'mock_exam'));
    }
  }
  const naesinStagesCompleted = naesinUnits.reduce((acc, unit) => {
    const p = naesinProgressMap.get(unit.id);
    const base = (p?.vocab_completed ? 1 : 0) + (p?.passage_completed ? 1 : 0) + (p?.dialogue_completed ? 1 : 0) + (isGrammarCompleted(unit.id, p) ? 1 : 0) + (p?.problem_completed ? 1 : 0);
    const mockExam = hasMockExamByUnit.get(unit.id) ? (p?.mock_exam_completed ? 1 : 0) : 0;
    const r2 = hasRound2 ? (p?.round2_passage_completed ? 1 : 0) + (p?.round2_dialogue_completed ? 1 : 0) : 0;
    return acc + base + mockExam + r2;
  }, 0);
  const naesinTotalStages = naesinUnits.reduce((acc, unit) => {
    return acc + stageCount + (hasMockExamByUnit.get(unit.id) ? 1 : 0);
  }, 0);

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
              <BookOpen className="h-4 w-4 text-brand-600 dark:text-brand-400" />
            </div>
            <div className="text-2xl font-bold tracking-tight">
              {naesinUnits.filter((unit) => {
                const p = naesinProgressMap.get(unit.id);
                return p?.vocab_completed && p?.passage_completed && p?.dialogue_completed && isGrammarCompleted(unit.id, p) && p?.problem_completed;
              }).length}/{naesinUnits.length}
            </div>
            <p className="text-xs text-muted-foreground">모든 단계 완료된 단원</p>
          </div>
          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">총 학습 시간</p>
              <Clock className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            </div>
            <div className="text-2xl font-bold tracking-tight">{hours > 0 ? `${hours}h ` : ''}{minutes}m</div>
            <p className="text-xs text-muted-foreground">영상 + 학습 활동 시간</p>
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

              const hasDialogueScore = !!progress && (progress.dialogue_ordering_best != null || progress.dialogue_first_letter_best != null || progress.dialogue_translation_best != null);
              const hasRound2PassageScore = hasRound2 && !!progress && (progress.round2_passage_fill_blanks_best != null || progress.round2_passage_ordering_best != null || progress.round2_passage_translation_best != null || progress.round2_passage_grammar_vocab_best != null);
              const hasRound2DialogueScore = hasRound2 && !!progress && (progress.round2_dialogue_ordering_best != null || progress.round2_dialogue_first_letter_best != null || progress.round2_dialogue_translation_best != null);

              const unitSheets = problemSheetsByUnit?.[unit.id] || [];
              const unitSheetAttempts = unitSheets.filter((s) => problemAttemptsBySheet?.[s.id]);
              const hasSomeSheetAttempts = unitSheetAttempts.length > 0 && unitSheetAttempts.length < unitSheets.length;

              const grammarDone = isGrammarCompleted(unit.id, progress);
              const stages = [
                { key: 'vocab', label: '단어', icon: BookOpen, completed: progress?.vocab_completed ?? false, inProgress: false },
                { key: 'passage', label: '교과서 암기', icon: FileText, completed: progress?.passage_completed ?? false, inProgress: !progress?.passage_completed && hasPassageScore },
                ...(hasRound2 ? [{ key: 'passage_r2', label: '암기(2회독)', icon: FileText, completed: progress?.round2_passage_completed ?? false, inProgress: !(progress?.round2_passage_completed) && !!hasRound2PassageScore }] : []),
                { key: 'dialogue', label: '대화문', icon: MessageSquare, completed: progress?.dialogue_completed ?? false, inProgress: !progress?.dialogue_completed && hasDialogueScore },
                ...(hasRound2 ? [{ key: 'dialogue_r2', label: '대화문(2회독)', icon: MessageSquare, completed: progress?.round2_dialogue_completed ?? false, inProgress: !(progress?.round2_dialogue_completed) && !!hasRound2DialogueScore }] : []),
                { key: 'grammar', label: '문법', icon: GraduationCap, completed: grammarDone, inProgress: !grammarDone && hasGrammarProgress },
                { key: 'problem', label: '문제', icon: ClipboardList, completed: progress?.problem_completed ?? false, inProgress: !(progress?.problem_completed) && hasSomeSheetAttempts },
                ...(unitSheets.some((s) => s.category === 'mock_exam') ? [{
                  key: 'mock_exam',
                  label: '예상문제',
                  icon: FileQuestion,
                  completed: progress?.mock_exam_completed ?? false,
                  inProgress: !(progress?.mock_exam_completed) && unitSheets.some((s) => s.category === 'mock_exam' && problemAttemptsBySheet?.[s.id]),
                }] : []),
              ];
              const completedCount = stages.filter((s) => s.completed).length;
              const unitStageCount = stages.length;

              return (
                <div
                  key={unit.id}
                  className={`rounded-lg border p-3 ${progressBorderClass(completedCount, unitStageCount)}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs shrink-0">L{unit.unit_number}</Badge>
                      <span className="text-sm font-medium truncate">{unit.title}</span>
                    </div>
                    <Badge
                      variant={completedCount === unitStageCount ? 'default' : 'secondary'}
                      className={completedCount === unitStageCount ? 'bg-green-500 text-white shrink-0' : 'shrink-0'}
                    >
                      {completedCount}/{unitStageCount}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    {stages.map((stage) => (
                      canEditProgress ? (
                        <ManualProgressToggle
                          key={stage.key}
                          studentId={studentId}
                          unitId={unit.id}
                          stageKey={stage.key}
                          label={stage.label}
                          completed={stage.completed}
                          inProgress={stage.inProgress}
                        />
                      ) : (
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
                      )
                    ))}
                  </div>
                  {(() => {
                    const chip = 'text-xs px-1.5 py-0.5 rounded';
                    const grayChip = `${chip} bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400`;
                    const DIFF_LABEL: Record<string, string> = { easy: '쉬움', medium: '보통', hard: '어려움' };

                    // 1. 단어
                    const vocabChips: ReactNode[] = [];
                    if (progress?.vocab_quiz_score != null)
                      vocabChips.push(<span key="quiz" className={`${chip} ${scoreChipClass(progress.vocab_quiz_score)}`}>퀴즈 {progress.vocab_quiz_score}점</span>);
                    if (progress?.vocab_spelling_score != null)
                      vocabChips.push(<span key="spell" className={`${chip} ${scoreChipClass(progress.vocab_spelling_score)}`}>스펠링 {progress.vocab_spelling_score}점</span>);

                    // 2. 교과서
                    const passChips: ReactNode[] = [];
                    if (progress?.passage_fill_blanks_best != null) {
                      const fb = fillBlanksByUnit?.[unit.id];
                      if (fb && Object.keys(fb).length > 0) {
                        Object.entries(fb).forEach(([diff, score]) =>
                          passChips.push(<span key={`fb-${diff}`} className={`${chip} ${passageChipClass}`}>빈칸({DIFF_LABEL[diff] || diff}) {score}점</span>));
                      } else {
                        passChips.push(<span key="fb" className={`${chip} ${passageChipClass}`}>빈칸 {progress.passage_fill_blanks_best}점</span>);
                      }
                    }
                    if (progress?.passage_ordering_best != null)
                      passChips.push(<span key="ord" className={`${chip} ${passageChipClass}`}>순서 {progress.passage_ordering_best}점</span>);
                    if (progress?.passage_translation_best != null)
                      passChips.push(<span key="trans" className={`${chip} ${passageChipClass}`}>영작 {progress.passage_translation_best}점</span>);
                    if (progress?.passage_grammar_vocab_best != null)
                      passChips.push(<span key="gv" className={`${chip} ${passageChipClass}`}>어법/어휘 {progress.passage_grammar_vocab_best}점</span>);

                    // 3. 대화문
                    const dlgChips: ReactNode[] = [];
                    if (progress?.dialogue_ordering_best != null)
                      dlgChips.push(<span key="do" className={`${chip} ${scoreChipClass(progress.dialogue_ordering_best)}`}>대화순서 {progress.dialogue_ordering_best}점</span>);
                    if (progress?.dialogue_first_letter_best != null)
                      dlgChips.push(<span key="df" className={`${chip} ${scoreChipClass(progress.dialogue_first_letter_best)}`}>첫글자 {progress.dialogue_first_letter_best}점</span>);
                    if (progress?.dialogue_translation_best != null)
                      dlgChips.push(<span key="dt" className={`${chip} ${scoreChipClass(progress.dialogue_translation_best)}`}>대화영작 {progress.dialogue_translation_best}점</span>);

                    // 4. 2회독 교과서
                    const r2PassChips: ReactNode[] = [];
                    if (hasRound2) {
                      if (progress?.round2_passage_fill_blanks_best != null)
                        r2PassChips.push(<span key="r2fb" className={`${chip} ${passageChipClass}`}>빈칸 {progress.round2_passage_fill_blanks_best}점</span>);
                      if (progress?.round2_passage_ordering_best != null)
                        r2PassChips.push(<span key="r2ord" className={`${chip} ${passageChipClass}`}>순서 {progress.round2_passage_ordering_best}점</span>);
                      if (progress?.round2_passage_translation_best != null)
                        r2PassChips.push(<span key="r2tr" className={`${chip} ${passageChipClass}`}>영작 {progress.round2_passage_translation_best}점</span>);
                      if (progress?.round2_passage_grammar_vocab_best != null)
                        r2PassChips.push(<span key="r2gv" className={`${chip} ${passageChipClass}`}>어법/어휘 {progress.round2_passage_grammar_vocab_best}점</span>);
                    }

                    // 5. 2회독 대화문
                    const r2DlgChips: ReactNode[] = [];
                    if (hasRound2) {
                      if (progress?.round2_dialogue_ordering_best != null)
                        r2DlgChips.push(<span key="r2do" className={`${chip} ${scoreChipClass(progress.round2_dialogue_ordering_best)}`}>대화순서 {progress.round2_dialogue_ordering_best}점</span>);
                      if (progress?.round2_dialogue_first_letter_best != null)
                        r2DlgChips.push(<span key="r2df" className={`${chip} ${scoreChipClass(progress.round2_dialogue_first_letter_best)}`}>첫글자 {progress.round2_dialogue_first_letter_best}점</span>);
                      if (progress?.round2_dialogue_translation_best != null)
                        r2DlgChips.push(<span key="r2dt" className={`${chip} ${scoreChipClass(progress.round2_dialogue_translation_best)}`}>대화영작 {progress.round2_dialogue_translation_best}점</span>);
                    }

                    // 6. 문법
                    const gramChips: ReactNode[] = [];
                    if ((progress?.grammar_total_videos ?? 0) > 0 && progress)
                      gramChips.push(<span key="vid" className={`${chip} bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300`}>영상 {progress.grammar_videos_completed}/{progress.grammar_total_videos}</span>);

                    // 7-9. 시트 분류: 문제 / 예상 / 기타
                    const probChips: ReactNode[] = [];
                    const mockChips: ReactNode[] = [];
                    const otherChips: ReactNode[] = [];
                    const problemOnly = unitSheets.filter((s) => !s.category || s.category === 'problem' || s.category === 'last_review');
                    unitSheets.forEach((sheet) => {
                      const attempt = problemAttemptsBySheet?.[sheet.id];
                      const isMock = sheet.category === 'mock_exam';
                      const isOther = sheet.category === 'external_passage' || sheet.category === 'eng_eng_def';
                      const categoryLabel = isMock ? '예상문제'
                        : sheet.category === 'external_passage' ? '외부지문'
                        : sheet.category === 'eng_eng_def' ? '영영풀이'
                        : problemOnly.length > 1 ? `문제${problemOnly.indexOf(sheet) + 1}` : '문제';
                      const label = sheet.title || categoryLabel;
                      const node = attempt
                        ? <span key={sheet.id} className={`${chip} ${scoreChipClass(attempt.pct)}`}>{label} {attempt.pct}점</span>
                        : <span key={sheet.id} className={grayChip}>{label} 미완료</span>;
                      if (isMock) mockChips.push(node);
                      else if (isOther) otherChips.push(node);
                      else probChips.push(node);
                    });

                    const groups = [
                      { label: '단어', chips: vocabChips },
                      { label: '교과서', chips: passChips },
                      { label: '대화문', chips: dlgChips },
                      { label: '2회독', chips: r2PassChips },
                      { label: '2회독대화', chips: r2DlgChips },
                      { label: '문법', chips: gramChips },
                      { label: '문제', chips: probChips },
                      { label: '예상', chips: mockChips },
                      { label: '기타', chips: otherChips },
                    ].filter((g) => g.chips.length > 0);

                    if (groups.length === 0) return null;

                    return (
                      <div className="space-y-1 mt-2">
                        {groups.map((g) => (
                          <div key={g.label} className="flex items-baseline gap-1.5">
                            <span className="text-muted-foreground w-14 shrink-0 text-xs">{g.label}</span>
                            <div className="flex gap-1.5 flex-wrap">{g.chips}</div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
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
        {!hideSettings && (
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
                tier={tier}
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
        )}
      </CardContent>
    </Card>
  );
}
