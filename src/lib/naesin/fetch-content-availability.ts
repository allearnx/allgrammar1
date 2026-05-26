import type { createClient } from '@/lib/supabase/server';
import type { NaesinContentAvailability } from '@/types/database';
import type { NaesinStudentProgress } from '@/types/naesin';

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

interface ContentAvailabilityResult {
  progress: NaesinStudentProgress | null;
  contentAvailability: NaesinContentAvailability;
  videoLessons: { id: string; content_type: string }[];
  textbookVideoCount: number;
  quizSetIds: string[];
  examDate: string | null;
  problemSheetCount: number;
  problemSheetsAttempted: number;
}

/**
 * 단일 RPC 호출로 유닛의 콘텐츠 존재 여부 + 학생 진도를 조회.
 * 기존 14개 병렬 쿼리 → 1개 DB 함수 호출로 통합.
 */
export async function fetchContentAvailability(
  supabase: SupabaseClient,
  userId: string,
  unitId: string,
  textbookId: string | null,
): Promise<ContentAvailabilityResult> {
  const { data, error } = await supabase.rpc('get_unit_content_availability', {
    p_student_id: userId,
    p_unit_id: unitId,
    p_textbook_id: textbookId,
  });

  if (error || !data) {
    return {
      progress: null,
      contentAvailability: {
        hasVocab: false,
        hasPassage: false,
        hasDialogue: false,
        hasTextbookVideo: false,
        hasGrammar: false,
        hasProblem: false,
        hasMockExam: false,
        hasLastReview: false,
      },
      videoLessons: [],
      textbookVideoCount: 0,
      quizSetIds: [],
      examDate: null,
      problemSheetCount: 0,
      problemSheetsAttempted: 0,
    };
  }

  const d = data as Record<string, unknown>;
  const grammarLessons = (d.grammar_lessons as { id: string; content_type: string }[]) || [];

  return {
    progress: (d.progress as NaesinStudentProgress) ?? null,
    contentAvailability: {
      hasVocab: d.has_vocab as boolean,
      hasPassage: d.has_passage as boolean,
      hasDialogue: d.has_dialogue as boolean,
      hasTextbookVideo: d.has_textbook_video as boolean,
      hasGrammar: d.has_grammar as boolean,
      hasProblem: d.has_problem as boolean,
      hasMockExam: d.has_mock_exam as boolean,
      hasLastReview: d.has_last_review as boolean,
    },
    videoLessons: grammarLessons.filter((l) => l.content_type === 'video'),
    textbookVideoCount: d.textbook_video_count as number,
    quizSetIds: (d.quiz_set_ids as string[]) || [],
    examDate: (d.exam_date as string) ?? null,
    problemSheetCount: d.problem_sheet_count as number,
    problemSheetsAttempted: d.problem_sheets_attempted as number,
  };
}
