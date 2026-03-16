import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, BookOpen, FileText, GraduationCap, ClipboardList } from 'lucide-react';
import { scoreChipClass, passageChipClass, progressBorderClass } from '@/lib/utils/progress-styles';

interface NaesinProgress {
  vocab_completed: boolean;
  vocab_quiz_score: number | null;
  vocab_spelling_score: number | null;
  passage_completed: boolean;
  passage_fill_blanks_best: number | null;
  passage_ordering_best: number | null;
  passage_translation_best: number | null;
  passage_grammar_vocab_best: number | null;
  grammar_completed: boolean;
  grammar_videos_completed: number | null;
  problem_completed: boolean;
}

interface Props {
  unit: { id: string; unit_number: number; title: string };
  progress: NaesinProgress | undefined;
}

const STAGE_CONFIG = [
  { key: 'vocab', label: '단어', icon: BookOpen, field: 'vocab_completed' },
  { key: 'passage', label: '교과서 암기', icon: FileText, field: 'passage_completed' },
  { key: 'grammar', label: '문법', icon: GraduationCap, field: 'grammar_completed' },
  { key: 'problem', label: '문제', icon: ClipboardList, field: 'problem_completed' },
] as const;

const SCORE_CHIPS: { field: keyof NaesinProgress; label: string; type: 'score' | 'passage' }[] = [
  { field: 'vocab_quiz_score', label: '퀴즈', type: 'score' },
  { field: 'vocab_spelling_score', label: '스펠링', type: 'score' },
  { field: 'passage_fill_blanks_best', label: '빈칸', type: 'passage' },
  { field: 'passage_ordering_best', label: '순서', type: 'passage' },
  { field: 'passage_translation_best', label: '영작', type: 'passage' },
  { field: 'passage_grammar_vocab_best', label: '어법/어휘', type: 'passage' },
];

export function NaesinUnitProgressCard({ unit, progress }: Props) {
  const hasPassageScore = !!progress && (
    progress.passage_fill_blanks_best != null ||
    progress.passage_ordering_best != null ||
    progress.passage_translation_best != null ||
    progress.passage_grammar_vocab_best != null
  );
  const hasGrammarProgress = !!progress && (progress.grammar_videos_completed ?? 0) > 0;

  const stages = STAGE_CONFIG.map((cfg) => ({
    ...cfg,
    completed: progress?.[cfg.field] ?? false,
    inProgress:
      cfg.key === 'passage' ? !progress?.passage_completed && hasPassageScore :
      cfg.key === 'grammar' ? !progress?.grammar_completed && hasGrammarProgress :
      false,
  }));

  const completedCount = stages.filter((s) => s.completed).length;
  const percent = Math.round((completedCount / 4) * 100);
  const progressColor =
    percent >= 80 ? '[&>[data-slot=progress-indicator]]:bg-green-500' :
    percent >= 40 ? '[&>[data-slot=progress-indicator]]:bg-indigo-500' :
    '[&>[data-slot=progress-indicator]]:bg-slate-400';

  const visibleChips = progress
    ? SCORE_CHIPS.filter((c) => progress[c.field] !== null && progress[c.field] !== undefined)
    : [];

  return (
    <Card className={progressBorderClass(completedCount, 4)}>
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
        <Progress value={percent} className={`h-2.5 mb-2 ${progressColor}`} />
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
        {visibleChips.length > 0 && (
          <div className="flex gap-2 mt-2 flex-wrap">
            {visibleChips.map((chip) => (
              <span
                key={chip.field}
                className={`text-xs px-1.5 py-0.5 rounded ${chip.type === 'score' ? scoreChipClass(progress![chip.field] as number) : passageChipClass}`}
              >
                {chip.label} {progress![chip.field] as number}점
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
