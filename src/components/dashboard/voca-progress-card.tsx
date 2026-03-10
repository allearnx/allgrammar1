import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { CheckCircle, BookOpen, ClipboardList } from 'lucide-react';
import { scoreChipClass, progressBorderClass } from '@/lib/utils/progress-styles';

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
  vocaProgress: VocaProgressRow[];
}

export function VocaProgressCard({ vocaProgress }: Props) {
  // Group by book
  const vocaByBook = new Map<string, { bookTitle: string; sortOrder: number; days: VocaProgressRow[] }>();
  for (const vp of vocaProgress) {
    if (!vp.day) continue;
    const book = vp.day.book;
    if (!book) continue;
    if (!vocaByBook.has(book.id)) {
      vocaByBook.set(book.id, { bookTitle: book.title, sortOrder: book.sort_order, days: [] });
    }
    vocaByBook.get(book.id)!.days.push(vp);
  }
  const vocaBooks = [...vocaByBook.entries()]
    .sort((a, b) => a[1].sortOrder - b[1].sortOrder)
    .map(([bookId, data]) => ({
      bookId,
      bookTitle: data.bookTitle,
      days: data.days.sort((a, b) => (a.day?.day_number ?? 0) - (b.day?.day_number ?? 0)),
    }));

  // Stats
  const vocaCompletedDays = vocaProgress.filter(
    (p) => p.flashcard_completed && p.quiz_score !== null && p.spelling_score !== null && p.matching_completed
  ).length;
  const vocaTotalDays = vocaProgress.length;
  const vocaQuizScores = vocaProgress.filter((p) => p.quiz_score !== null).map((p) => p.quiz_score!);
  const vocaAvgQuiz = vocaQuizScores.length > 0 ? Math.round(vocaQuizScores.reduce((a, b) => a + b, 0) / vocaQuizScores.length) : null;
  const vocaSpellingScores = vocaProgress.filter((p) => p.spelling_score !== null).map((p) => p.spelling_score!);
  const vocaAvgSpelling = vocaSpellingScores.length > 0 ? Math.round(vocaSpellingScores.reduce((a, b) => a + b, 0) / vocaSpellingScores.length) : null;

  return (
    <Card className="border-l-4 border-l-violet-500">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-violet-100 p-2 dark:bg-violet-950">
            <BookOpen className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          </div>
          <CardTitle className="text-lg">올톡보카</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 통계 3개 */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">완료 Day</p>
              <CheckCircle className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>
            <div className="text-2xl font-bold tracking-tight">{vocaCompletedDays}/{vocaTotalDays}</div>
            <p className="text-xs text-muted-foreground">모든 단계 완료된 Day</p>
          </div>
          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">평균 퀴즈</p>
              <ClipboardList className="h-4 w-4 text-pink-600 dark:text-pink-400" />
            </div>
            <div className="text-2xl font-bold tracking-tight">{vocaAvgQuiz !== null ? `${vocaAvgQuiz}점` : '-'}</div>
            <p className="text-xs text-muted-foreground">퀴즈 평균 점수</p>
          </div>
          <div className="rounded-lg border p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">평균 스펠링</p>
              <BookOpen className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="text-2xl font-bold tracking-tight">{vocaAvgSpelling !== null ? `${vocaAvgSpelling}점` : '-'}</div>
            <p className="text-xs text-muted-foreground">스펠링 평균 점수</p>
          </div>
        </div>

        {/* Day별 진행률 */}
        {vocaBooks.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold tracking-tight mb-2">Day별 진행률</h4>
            <div className="space-y-4">
              {vocaBooks.map(({ bookId, bookTitle, days }) => (
                <div key={bookId}>
                  <h5 className="text-sm font-medium text-muted-foreground mb-2">{bookTitle}</h5>
                  <div className="space-y-2">
                    {days.map((vp) => {
                      const day = vp.day!;
                      const r1Done = vp.flashcard_completed && vp.quiz_score !== null && vp.spelling_score !== null && vp.matching_completed;
                      const r2Done = vp.round2_flashcard_completed && vp.round2_quiz_score !== null && vp.round2_matching_completed;
                      const allDone = r1Done && r2Done;
                      const hasAny = vp.flashcard_completed || vp.quiz_score !== null || vp.spelling_score !== null || vp.matching_completed;

                      return (
                        <div
                          key={vp.day_id}
                          className={`rounded-lg border p-3 ${progressBorderClass(allDone ? 2 : hasAny ? 1 : 0, 2)}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs shrink-0">Day {day.day_number}</Badge>
                              <span className="text-sm font-medium truncate">{day.title}</span>
                            </div>
                            <Badge
                              variant={allDone ? 'default' : 'secondary'}
                              className={allDone ? 'bg-green-500 text-white shrink-0' : 'shrink-0'}
                            >
                              {allDone ? '완료' : r1Done ? 'R1 완료' : '진행중'}
                            </Badge>
                          </div>

                          {/* Round 1 */}
                          <div className="flex gap-2 flex-wrap">
                            <span className="text-xs font-medium text-muted-foreground w-8">R1</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded ${vp.flashcard_completed ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                              플래시카드 {vp.flashcard_completed ? '✓' : '-'}
                            </span>
                            {vp.quiz_score !== null && (
                              <span className={`text-xs px-1.5 py-0.5 rounded ${scoreChipClass(vp.quiz_score)}`}>
                                퀴즈 {vp.quiz_score}점
                              </span>
                            )}
                            {vp.spelling_score !== null && (
                              <span className={`text-xs px-1.5 py-0.5 rounded ${scoreChipClass(vp.spelling_score)}`}>
                                스펠링 {vp.spelling_score}점
                              </span>
                            )}
                            {vp.matching_score !== null && (
                              <span className={`text-xs px-1.5 py-0.5 rounded ${scoreChipClass(vp.matching_score)}`}>
                                매칭 {vp.matching_score}점
                              </span>
                            )}
                          </div>

                          {/* Round 2 */}
                          {(vp.round2_flashcard_completed || vp.round2_quiz_score !== null || vp.round2_matching_score !== null) && (
                            <div className="flex gap-2 flex-wrap mt-1">
                              <span className="text-xs font-medium text-muted-foreground w-8">R2</span>
                              <span className={`text-xs px-1.5 py-0.5 rounded ${vp.round2_flashcard_completed ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                                플래시카드 {vp.round2_flashcard_completed ? '✓' : '-'}
                              </span>
                              {vp.round2_quiz_score !== null && (
                                <span className={`text-xs px-1.5 py-0.5 rounded ${scoreChipClass(vp.round2_quiz_score)}`}>
                                  퀴즈 {vp.round2_quiz_score}점
                                </span>
                              )}
                              {vp.round2_matching_score !== null && (
                                <span className={`text-xs px-1.5 py-0.5 rounded ${scoreChipClass(vp.round2_matching_score)}`}>
                                  매칭 {vp.round2_matching_score}점
                                </span>
                              )}
                            </div>
                          )}

                          {vp.updated_at && (
                            <p className="text-xs text-muted-foreground mt-1">
                              마지막 학습: {format(new Date(vp.updated_at), 'MM/dd HH:mm')}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
