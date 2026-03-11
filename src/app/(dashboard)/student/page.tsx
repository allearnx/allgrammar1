import { requireRole } from '@/lib/auth/helpers';
import { createClient } from '@/lib/supabase/server';
import { Topbar } from '@/components/layout/topbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, BookMarked, GraduationCap, BarChart3, Clock, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { VocaDashboard } from '@/components/dashboard/voca-dashboard';
import { NaesinDashboard } from '@/components/dashboard/naesin-dashboard';
import { CombinedDashboard } from '@/components/dashboard/combined-dashboard';
import type { VocaBook, VocaDay, VocaStudentProgress } from '@/types/voca';
import type { NaesinUnit, NaesinStudentProgress, NaesinExamAssignment, NaesinContentAvailability } from '@/types/naesin';

export default async function StudentDashboard() {
  const user = await requireRole(['student']);
  const supabase = await createClient();

  // Check service assignments
  const { data: assignments } = await supabase
    .from('service_assignments')
    .select('service')
    .eq('student_id', user.id);

  const services = assignments?.map((a) => a.service) || [];
  const vocaOnly = services.length === 1 && services[0] === 'voca';
  const naesinOnly = services.length === 1 && services[0] === 'naesin';
  const hasBoth = services.includes('voca') && services.includes('naesin');

  // ── Voca-only dashboard ──
  if (vocaOnly) {
    // 배정된 교재만 fetch
    const { data: bookAssignment } = await supabase
      .from('voca_book_assignments')
      .select('book_id')
      .eq('student_id', user.id)
      .single();

    if (!bookAssignment) {
      return (
        <>
          <Topbar user={user} title="올킬보카" />
          <div className="flex items-center justify-center min-h-[60vh] p-4">
            <Card className="max-w-sm w-full text-center">
              <CardContent className="pt-6 pb-6 space-y-2">
                <BookOpen className="h-10 w-10 mx-auto text-muted-foreground/50" />
                <h3 className="font-semibold text-lg">교재 미배정</h3>
                <p className="text-sm text-muted-foreground">
                  선생님이 교재를 배정하면 학습을 시작할 수 있어요
                </p>
              </CardContent>
            </Card>
          </div>
        </>
      );
    }

    const { data: books } = await supabase
      .from('voca_books')
      .select('*')
      .eq('id', bookAssignment.book_id);

    const bookIds = (books || []).map((b) => b.id);
    let days: VocaDay[] = [];
    if (bookIds.length > 0) {
      const { data } = await supabase
        .from('voca_days')
        .select('*')
        .in('book_id', bookIds)
        .order('sort_order');
      days = data || [];
    }

    const dayIds = days.map((d) => d.id);
    let progressList: VocaStudentProgress[] = [];
    if (dayIds.length > 0) {
      const { data } = await supabase
        .from('voca_student_progress')
        .select('*')
        .eq('student_id', user.id)
        .in('day_id', dayIds);
      progressList = data || [];
    }

    // Word count for current active day
    const sortedDays = [...days].sort((a, b) => a.sort_order - b.sort_order);
    const progressMap = new Map(progressList.map((p) => [p.day_id, p]));
    const currentDay = sortedDays.find((d) => {
      const p = progressMap.get(d.id);
      if (!p) return true;
      const quizPass = (p.quiz_score ?? 0) >= 80;
      const r1 = (p.flashcard_completed || quizPass) && quizPass && (p.spelling_score ?? 0) >= 80 && p.matching_completed;
      const r2 = p.round2_flashcard_completed && (p.round2_quiz_score ?? 0) >= 80 && p.round2_matching_completed;
      return !r1 || !r2;
    }) ?? sortedDays[0];

    let wordCount = 0;
    if (currentDay) {
      const { count } = await supabase
        .from('voca_vocabulary')
        .select('id', { count: 'exact', head: true })
        .eq('day_id', currentDay.id);
      wordCount = count || 0;
    }

    // Fetch wrong words from voca quiz results + matching submissions
    const [quizResultsRes, matchingSubRes] = await Promise.all([
      dayIds.length > 0
        ? supabase.from('voca_quiz_results').select('wrong_words').eq('student_id', user.id).in('day_id', dayIds)
        : Promise.resolve({ data: null }),
      dayIds.length > 0
        ? supabase.from('voca_matching_submissions').select('wrong_words').eq('student_id', user.id).in('day_id', dayIds)
        : Promise.resolve({ data: null }),
    ]);

    const wrongWordCounts: Record<string, number> = {};
    for (const row of quizResultsRes.data || []) {
      for (const w of (row.wrong_words as { front_text: string }[]) || []) {
        wrongWordCounts[w.front_text] = (wrongWordCounts[w.front_text] || 0) + 1;
      }
    }
    for (const row of matchingSubRes.data || []) {
      for (const w of (row.wrong_words as { word: string }[]) || []) {
        wrongWordCounts[w.word] = (wrongWordCounts[w.word] || 0) + 1;
      }
    }

    return (
      <>
        <Topbar user={user} title="올킬보카" />
        <VocaDashboard
          userName={user.full_name}
          books={(books as VocaBook[]) || []}
          days={days}
          progressList={progressList}
          wordCount={wordCount}
          wrongWordCounts={wrongWordCounts}
        />
      </>
    );
  }

  // ── Naesin-only dashboard ──
  if (naesinOnly) {
    // 1. Student settings → textbook_id + enabled_stages
    const { data: settings } = await supabase
      .from('naesin_student_settings')
      .select('textbook_id, enabled_stages')
      .eq('student_id', user.id)
      .single();

    const textbookId = settings?.textbook_id;

    if (textbookId) {
      // 2. Textbook name
      const { data: textbook } = await supabase
        .from('naesin_textbooks')
        .select('display_name')
        .eq('id', textbookId)
        .single();

      // 3. Units for this textbook
      const { data: unitsData } = await supabase
        .from('naesin_units')
        .select('*')
        .eq('textbook_id', textbookId)
        .eq('is_active', true)
        .order('sort_order');
      const units: NaesinUnit[] = unitsData || [];
      const unitIds = units.map((u) => u.id);

      // 4. Exam assignments
      const { data: examData } = await supabase
        .from('naesin_exam_assignments')
        .select('*')
        .eq('student_id', user.id)
        .eq('textbook_id', textbookId);
      const examAssignments: NaesinExamAssignment[] = examData || [];

      // 5. Student progress
      let naesinProgressList: NaesinStudentProgress[] = [];
      if (unitIds.length > 0) {
        const { data } = await supabase
          .from('naesin_student_progress')
          .select('*')
          .eq('student_id', user.id)
          .in('unit_id', unitIds);
        naesinProgressList = data || [];
      }

      // 6. Content availability per unit + quiz set counts + grammar video counts
      const contentMap: Record<string, NaesinContentAvailability> = {};
      const vocabQuizSetCounts: Record<string, number> = {};
      const grammarVideoCounts: Record<string, number> = {};

      if (unitIds.length > 0) {
        const [vocabRes, passageRes, grammarRes, problemRes, lastReviewRes, quizSetRes, similarRes] =
          await Promise.all([
            supabase.from('naesin_vocabulary').select('unit_id').in('unit_id', unitIds),
            supabase.from('naesin_passages').select('unit_id').in('unit_id', unitIds),
            supabase.from('naesin_grammar_lessons').select('unit_id, content_type').in('unit_id', unitIds),
            supabase.from('naesin_problem_sheets').select('unit_id').in('unit_id', unitIds).eq('category', 'problem'),
            supabase.from('naesin_last_review_content').select('unit_id').in('unit_id', unitIds),
            supabase.from('naesin_vocab_quiz_sets').select('unit_id').in('unit_id', unitIds),
            supabase.from('naesin_similar_problems').select('unit_id').in('unit_id', unitIds).eq('status', 'approved'),
          ]);

        const vocabUnits = new Set((vocabRes.data || []).map((r) => r.unit_id));
        const passageUnits = new Set((passageRes.data || []).map((r) => r.unit_id));
        const grammarUnits = new Set((grammarRes.data || []).map((r) => r.unit_id));
        const problemUnits = new Set((problemRes.data || []).map((r) => r.unit_id));
        const lastReviewUnits = new Set((lastReviewRes.data || []).map((r) => r.unit_id));

        // Count quiz sets and grammar videos per unit
        for (const row of quizSetRes.data || []) {
          vocabQuizSetCounts[row.unit_id] = (vocabQuizSetCounts[row.unit_id] || 0) + 1;
        }
        for (const row of grammarRes.data || []) {
          if (row.content_type === 'video') {
            grammarVideoCounts[row.unit_id] = (grammarVideoCounts[row.unit_id] || 0) + 1;
          }
        }

        // Also check similar problems as last_review content
        const similarUnits = new Set((similarRes.data || []).map((r) => r.unit_id));

        for (const uid of unitIds) {
          contentMap[uid] = {
            hasVocab: vocabUnits.has(uid),
            hasPassage: passageUnits.has(uid),
            hasGrammar: grammarUnits.has(uid),
            hasProblem: problemUnits.has(uid),
            hasLastReview: lastReviewUnits.has(uid) || similarUnits.has(uid),
          };
        }
      }

      return (
        <>
          <Topbar user={user} title="내신 대비" />
          <NaesinDashboard
            userName={user.full_name}
            textbookName={textbook?.display_name || '교과서'}
            units={units}
            progressList={naesinProgressList}
            examAssignments={examAssignments}
            contentMap={contentMap}
            vocabQuizSetCounts={vocabQuizSetCounts}
            grammarVideoCounts={grammarVideoCounts}
            enabledStages={settings?.enabled_stages}
          />
        </>
      );
    }
  }

  // ── Combined (voca + naesin) dashboard ──
  if (hasBoth) {
    // 배정된 교재 확인 + 내신 설정 fetch
    const [{ data: vocaBookAssignment }, { data: naesinSettings }] = await Promise.all([
      supabase
        .from('voca_book_assignments')
        .select('book_id')
        .eq('student_id', user.id)
        .single(),
      supabase
        .from('naesin_student_settings')
        .select('textbook_id, enabled_stages')
        .eq('student_id', user.id)
        .single(),
    ]);

    let books: VocaBook[] = [];
    if (vocaBookAssignment) {
      const { data: vocaBooksData } = await supabase
        .from('voca_books')
        .select('*')
        .eq('id', vocaBookAssignment.book_id);
      books = (vocaBooksData as VocaBook[]) || [];
    }

    const bookIds = books.map((b) => b.id);
    const textbookId = naesinSettings?.textbook_id;

    // Fetch voca days + naesin data in parallel
    const [daysRes, textbookRes, unitsRes, examsRes] = await Promise.all([
      bookIds.length > 0
        ? supabase.from('voca_days').select('*').in('book_id', bookIds).order('sort_order')
        : Promise.resolve({ data: null }),
      textbookId
        ? supabase.from('naesin_textbooks').select('display_name').eq('id', textbookId).single()
        : Promise.resolve({ data: null }),
      textbookId
        ? supabase.from('naesin_units').select('*').eq('textbook_id', textbookId).eq('is_active', true).order('sort_order')
        : Promise.resolve({ data: null }),
      textbookId
        ? supabase.from('naesin_exam_assignments').select('*').eq('student_id', user.id).eq('textbook_id', textbookId)
        : Promise.resolve({ data: null }),
    ]);

    const vocaDays: VocaDay[] = daysRes.data || [];
    const textbookName = textbookRes.data?.display_name || '교과서';
    const naesinUnits: NaesinUnit[] = unitsRes.data || [];
    const naesinExamAssignments: NaesinExamAssignment[] = examsRes.data || [];

    // Fetch progress + content map (depends on days/units)
    const dayIds = vocaDays.map((d) => d.id);
    const unitIds = naesinUnits.map((u) => u.id);

    const [vocaProgressRes2, naesinProgressRes2, ...contentResults] = await Promise.all([
      dayIds.length > 0
        ? supabase.from('voca_student_progress').select('*').eq('student_id', user.id).in('day_id', dayIds)
        : Promise.resolve({ data: null }),
      unitIds.length > 0
        ? supabase.from('naesin_student_progress').select('*').eq('student_id', user.id).in('unit_id', unitIds)
        : Promise.resolve({ data: null }),
      ...(unitIds.length > 0
        ? [
            supabase.from('naesin_vocabulary').select('unit_id').in('unit_id', unitIds),
            supabase.from('naesin_passages').select('unit_id').in('unit_id', unitIds),
            supabase.from('naesin_grammar_lessons').select('unit_id, content_type').in('unit_id', unitIds),
            supabase.from('naesin_problem_sheets').select('unit_id').in('unit_id', unitIds).eq('category', 'problem'),
            supabase.from('naesin_last_review_content').select('unit_id').in('unit_id', unitIds),
            supabase.from('naesin_vocab_quiz_sets').select('unit_id').in('unit_id', unitIds),
            supabase.from('naesin_similar_problems').select('unit_id').in('unit_id', unitIds).eq('status', 'approved'),
          ]
        : []),
    ]);

    const vocaProgressList: VocaStudentProgress[] = vocaProgressRes2.data || [];
    const naesinProgressList: NaesinStudentProgress[] = naesinProgressRes2.data || [];

    const naesinContentMap: Record<string, NaesinContentAvailability> = {};
    const vocabQuizSetCounts: Record<string, number> = {};
    const grammarVideoCounts: Record<string, number> = {};

    if (unitIds.length > 0 && contentResults.length >= 7) {
      const [vocabRes, passageRes, grammarRes, problemRes, lastReviewRes, quizSetRes, similarRes] = contentResults;
      const vocabUnits = new Set((vocabRes.data || []).map((r: { unit_id: string }) => r.unit_id));
      const passageUnits = new Set((passageRes.data || []).map((r: { unit_id: string }) => r.unit_id));
      const grammarUnits = new Set((grammarRes.data || []).map((r: { unit_id: string }) => r.unit_id));
      const problemUnits = new Set((problemRes.data || []).map((r: { unit_id: string }) => r.unit_id));
      const lastReviewUnits = new Set((lastReviewRes.data || []).map((r: { unit_id: string }) => r.unit_id));
      const similarUnits = new Set((similarRes.data || []).map((r: { unit_id: string }) => r.unit_id));

      for (const row of quizSetRes.data || []) {
        vocabQuizSetCounts[row.unit_id] = (vocabQuizSetCounts[row.unit_id] || 0) + 1;
      }
      for (const row of (grammarRes.data || []) as { unit_id: string; content_type: string }[]) {
        if (row.content_type === 'video') {
          grammarVideoCounts[row.unit_id] = (grammarVideoCounts[row.unit_id] || 0) + 1;
        }
      }

      for (const uid of unitIds) {
        naesinContentMap[uid] = {
          hasVocab: vocabUnits.has(uid),
          hasPassage: passageUnits.has(uid),
          hasGrammar: grammarUnits.has(uid),
          hasProblem: problemUnits.has(uid),
          hasLastReview: lastReviewUnits.has(uid) || similarUnits.has(uid),
        };
      }
    }

    // Word count for current active voca day
    const sortedDays = [...vocaDays].sort((a, b) => a.sort_order - b.sort_order);
    const vocaProgressMap = new Map(vocaProgressList.map((p) => [p.day_id, p]));
    const currentDay = sortedDays.find((d) => {
      const p = vocaProgressMap.get(d.id);
      if (!p) return true;
      const quizPass = (p.quiz_score ?? 0) >= 80;
      const r1 = (p.flashcard_completed || quizPass) && quizPass && (p.spelling_score ?? 0) >= 80 && p.matching_completed;
      const r2 = p.round2_flashcard_completed && (p.round2_quiz_score ?? 0) >= 80 && p.round2_matching_completed;
      return !r1 || !r2;
    }) ?? sortedDays[0];

    let wordCount = 0;
    if (currentDay) {
      const { count } = await supabase
        .from('voca_vocabulary')
        .select('id', { count: 'exact', head: true })
        .eq('day_id', currentDay.id);
      wordCount = count || 0;
    }

    return (
      <>
        <Topbar user={user} title="학습 대시보드" />
        <CombinedDashboard
          userName={user.full_name}
          vocaBooks={books}
          vocaDays={vocaDays}
          vocaProgressList={vocaProgressList}
          vocaWordCount={wordCount}
          textbookName={textbookName}
          naesinUnits={naesinUnits}
          naesinProgressList={naesinProgressList}
          examAssignments={naesinExamAssignments}
          contentMap={naesinContentMap}
          vocabQuizSetCounts={vocabQuizSetCounts}
          grammarVideoCounts={grammarVideoCounts}
          enabledStages={naesinSettings?.enabled_stages}
        />
      </>
    );
  }

  // ── Default dashboard (grammar/naesin) ──
  const [videoProgressRes, memoryProgressRes, dueReviewsRes, naesinProgressRes] = await Promise.all([
    supabase
      .from('student_progress')
      .select('video_completed')
      .eq('student_id', user.id),
    supabase
      .from('student_memory_progress')
      .select('is_mastered')
      .eq('student_id', user.id),
    supabase
      .from('student_memory_progress')
      .select('id')
      .eq('student_id', user.id)
      .eq('is_mastered', false)
      .lte('next_review_date', new Date().toISOString().split('T')[0]),
    supabase
      .from('naesin_student_progress')
      .select('vocab_completed, passage_completed, grammar_completed, problem_completed')
      .eq('student_id', user.id),
  ]);

  const completedVideos = videoProgressRes.data?.filter((p) => p.video_completed).length || 0;
  const totalProgress = videoProgressRes.data?.length || 0;
  const masteredItems = memoryProgressRes.data?.filter((p) => p.is_mastered).length || 0;
  const totalMemory = memoryProgressRes.data?.length || 0;
  const dueReviews = dueReviewsRes.data?.length || 0;

  // Naesin stats
  const naesinProgress = naesinProgressRes.data || [];
  const naesinStagesCompleted = naesinProgress.reduce((acc, p) => {
    return acc + (p.vocab_completed ? 1 : 0) + (p.passage_completed ? 1 : 0) + (p.grammar_completed ? 1 : 0) + (p.problem_completed ? 1 : 0);
  }, 0);
  const naesinUnitsFullyCompleted = naesinProgress.filter(
    (p) => p.vocab_completed && p.passage_completed && p.grammar_completed && p.problem_completed
  ).length;

  return (
    <>
      <Topbar user={user} title="대시보드" />
      <div className="p-4 md:p-6 space-y-6">
        {/* Welcome */}
        <div>
          <h2 className="text-2xl font-bold tracking-tight">안녕하세요, {user.full_name}님! 👋</h2>
          <p className="text-muted-foreground mt-1">오늘도 영어 문법 공부를 시작해볼까요?</p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {naesinProgress.length > 0 && (
            <>
              <Card className="border-l-4 border-l-green-500">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">내신 단계 완료</CardTitle>
                  <div className="rounded-full bg-green-100 p-2 dark:bg-green-950">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold tracking-tight">{naesinStagesCompleted}</div>
                  <p className="text-xs text-muted-foreground">
                    전체 {naesinProgress.length * 4}단계 중
                  </p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-indigo-500">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">완료 단원</CardTitle>
                  <div className="rounded-full bg-indigo-100 p-2 dark:bg-indigo-950">
                    <BookMarked className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold tracking-tight">{naesinUnitsFullyCompleted}</div>
                  <p className="text-xs text-muted-foreground">
                    전체 {naesinProgress.length}단원 중
                  </p>
                </CardContent>
              </Card>
            </>
          )}
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">완료한 강의</CardTitle>
              <div className="rounded-full bg-green-100 p-2 dark:bg-green-950">
                <GraduationCap className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight">{completedVideos}</div>
              <p className="text-xs text-muted-foreground">
                전체 {totalProgress}개 중
              </p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-indigo-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">암기 완료</CardTitle>
              <div className="rounded-full bg-indigo-100 p-2 dark:bg-indigo-950">
                <BookOpen className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight">{masteredItems}</div>
              <p className="text-xs text-muted-foreground">
                전체 {totalMemory}개 중
              </p>
            </CardContent>
          </Card>
          {naesinProgress.length === 0 && (
            <>
              <Card className="border-l-4 border-l-orange-500">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">복습 대기</CardTitle>
                  <div className="rounded-full bg-orange-100 p-2 dark:bg-orange-950">
                    <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold tracking-tight">{dueReviews}</div>
                  <p className="text-xs text-muted-foreground">오늘 복습할 항목</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-purple-500">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">학습 진도</CardTitle>
                  <div className="rounded-full bg-purple-100 p-2 dark:bg-purple-950">
                    <BarChart3 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold tracking-tight">
                    {totalProgress > 0 ? Math.round((completedVideos / totalProgress) * 100) : 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">전체 진도율</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="hover:shadow-md transition-shadow border-indigo-200 bg-indigo-50/30 dark:border-indigo-800 dark:bg-indigo-950/20">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center gap-3">
                <div className="rounded-full bg-indigo-100 p-3 dark:bg-indigo-950">
                  <GraduationCap className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="font-semibold">문법 학습</h3>
                <p className="text-sm text-muted-foreground">레벨별 영어 문법을 학습하세요</p>
                <Button asChild className="mt-2">
                  <Link href="/student/levels">학습 시작</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
          {dueReviews > 0 && (
            <Card className="hover:shadow-md transition-shadow border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-950/20">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="rounded-full bg-orange-100 p-3 dark:bg-orange-950">
                    <Clock className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                  </div>
                  <h3 className="font-semibold">복습하기</h3>
                  <p className="text-sm text-muted-foreground">
                    {dueReviews}개 항목이 복습을 기다리고 있어요
                  </p>
                  <Button asChild variant="outline" className="mt-2">
                    <Link href="/student/review">복습 시작</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center gap-3">
                <div className="rounded-full bg-muted p-3">
                  <BookMarked className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold">내신 대비</h3>
                <p className="text-sm text-muted-foreground">교과서별 내신 시험을 준비하세요</p>
                <Button asChild variant="outline" className="mt-2">
                  <Link href="/student/naesin">내신 학습</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center gap-3">
                <div className="rounded-full bg-muted p-3">
                  <BarChart3 className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold">내 진도</h3>
                <p className="text-sm text-muted-foreground">학습 현황을 확인하세요</p>
                <Button asChild variant="outline" className="mt-2">
                  <Link href="/student/progress">진도 확인</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
