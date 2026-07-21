import type { createAdminClient } from '@/lib/supabase/admin';

type Admin = ReturnType<typeof createAdminClient>;
type WrongWord = { front_text: string; back_text: string };

interface ExamResultRow {
  student_id: string;
  day_ids: string[];
  range_key: string;
  score: number;
  wrong_words: WrongWord[] | null;
  exam_type: string;
  created_at: string;
}

export interface ExamGroup {
  rangeKey: string;
  dayIds: string[];
  /** 'headword'(1회독 표제어) / 'syn_ant'(2회독 유의어·반의어) */
  examType: 'headword' | 'syn_ant';
  bestScore: number;
  attempts: number;
  lastAttemptAt: string;
  isToday: boolean;
  wrongWords: WrongWord[];
}

export interface StudentExamGroups {
  studentId: string;
  exams: ExamGroup[];
}

/** created_at(UTC)을 한국 날짜(YYYY-MM-DD)로 */
function kstDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
}

/**
 * 학생들의 묶음 시험 결과를 Day조합(range)별로 집계.
 * 각 시험: 최고점·재응시 횟수·최고점 회차 오답·마지막 응시일·오늘 여부.
 * 학생별 시험은 마지막 응시일 내림차순(= 오늘 본 게 맨 위).
 */
export async function fetchVocaExamGroups(
  admin: Admin,
  studentIds: string[],
  bookId?: string | null,
): Promise<{ groups: StudentExamGroups[]; dayTitles: Record<string, string> }> {
  if (studentIds.length === 0) return { groups: [], dayTitles: {} };

  let q = admin
    .from('voca_exam_results')
    .select('student_id, day_ids, range_key, score, wrong_words, exam_type, created_at')
    .in('student_id', studentIds)
    .order('created_at', { ascending: false });
  if (bookId) q = q.eq('book_id', bookId);
  const { data } = await q;
  const rows = (data ?? []) as unknown as ExamResultRow[];

  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
  const allDayIds = new Set<string>();
  const byStudent = new Map<string, Map<string, ExamGroup>>();

  for (const r of rows) {
    for (const d of r.day_ids || []) allDayIds.add(d);
    if (!byStudent.has(r.student_id)) byStudent.set(r.student_id, new Map());
    const ranges = byStudent.get(r.student_id)!;
    // 같은 Day조합이라도 1회독/2회독은 별도 카드로 (그룹 키에 유형 포함)
    const examType = (r.exam_type === 'syn_ant' ? 'syn_ant' : 'headword') as 'headword' | 'syn_ant';
    const key = `${r.range_key}::${examType}`;
    const ex = ranges.get(key) ?? {
      rangeKey: r.range_key,
      dayIds: r.day_ids,
      examType,
      bestScore: -1,
      attempts: 0,
      lastAttemptAt: r.created_at,
      isToday: false,
      wrongWords: [],
    };
    ex.attempts += 1;
    if (r.created_at > ex.lastAttemptAt) ex.lastAttemptAt = r.created_at;
    if (r.score > ex.bestScore) {
      ex.bestScore = r.score;
      ex.wrongWords = r.wrong_words || [];
    }
    ranges.set(key, ex);
  }

  const dayTitles: Record<string, string> = {};
  if (allDayIds.size > 0) {
    const { data: days } = await admin.from('voca_days').select('id, title').in('id', [...allDayIds]);
    for (const d of days || []) dayTitles[d.id] = d.title;
  }

  const groups: StudentExamGroups[] = [...byStudent.entries()].map(([studentId, ranges]) => ({
    studentId,
    exams: [...ranges.values()]
      .map((e) => ({ ...e, isToday: kstDate(e.lastAttemptAt) === today }))
      .sort((a, b) => (a.lastAttemptAt < b.lastAttemptAt ? 1 : -1)),
  }));

  return { groups, dayTitles };
}
