import type { SupabaseClient } from '@supabase/supabase-js';
import { estimateRetention } from './forgetting-curve';

export interface ClassReviewStudent {
  studentId: string;
  studentName: string;
  reviewCount: number;
  urgentTopics: {
    topic: string;
    retention: number;
    daysSince: number;
  }[];
}

interface RawAttempt {
  student_id: string;
  score: number;
  total_questions: number;
  created_at: string;
  sheet_id: string | null;
}

/**
 * Batch-compute review status for all naesin-assigned students in an academy.
 * Fixed 4 DB queries regardless of student count.
 */
export async function computeClassReview(
  supabase: SupabaseClient,
  academyId: string,
): Promise<ClassReviewStudent[]> {
  // 1. Students assigned to naesin in this academy
  const { data: students } = await supabase
    .from('users')
    .select('id, name')
    .eq('academy_id', academyId)
    .eq('role', 'student');

  if (!students || students.length === 0) return [];

  const studentIds = students.map((s) => s.id);
  const studentNameMap = new Map(students.map((s) => [s.id, s.name as string]));

  // 2. All problem attempts for these students (last 90 days)
  const since = new Date(Date.now() - 90 * 86400000).toISOString();
  const { data: attempts } = await supabase
    .from('naesin_problem_attempts')
    .select('student_id, score, total_questions, created_at, sheet_id')
    .in('student_id', studentIds)
    .gte('created_at', since);

  if (!attempts || attempts.length === 0) return [];

  // 3. Resolve sheet → template_topic (batch)
  const sheetIds = [...new Set((attempts as RawAttempt[]).map((a) => a.sheet_id).filter(Boolean))] as string[];
  const sheetTopicMap = new Map<string, string>();

  if (sheetIds.length > 0) {
    const { data: sheets } = await supabase
      .from('naesin_problem_sheets')
      .select('id, source_template_id')
      .in('id', sheetIds);

    const templateIds = [...new Set((sheets || []).map((s) => s.source_template_id).filter(Boolean))] as string[];

    if (templateIds.length > 0) {
      const { data: templates } = await supabase
        .from('naesin_templates')
        .select('id, template_topic')
        .in('id', templateIds);

      const tMap = new Map((templates || []).filter((t) => t.template_topic).map((t) => [t.id, t.template_topic as string]));
      for (const s of sheets || []) {
        if (s.source_template_id && tMap.has(s.source_template_id)) {
          sheetTopicMap.set(s.id, tMap.get(s.source_template_id)!);
        }
      }
    }
  }

  // 4. Group by student → topic → stats
  const now = Date.now();
  type TopicAcc = { correct: number; total: number; count: number; latest: string };
  const studentTopics = new Map<string, Map<string, TopicAcc>>();

  for (const a of attempts as RawAttempt[]) {
    const topic = a.sheet_id ? sheetTopicMap.get(a.sheet_id) : undefined;
    if (!topic) continue; // skip attempts without resolved topic

    let topics = studentTopics.get(a.student_id);
    if (!topics) {
      topics = new Map();
      studentTopics.set(a.student_id, topics);
    }

    let acc = topics.get(topic);
    if (!acc) {
      acc = { correct: 0, total: 0, count: 0, latest: a.created_at };
      topics.set(topic, acc);
    }
    acc.correct += a.score;
    acc.total += a.total_questions;
    acc.count += 1;
    if (a.created_at > acc.latest) acc.latest = a.created_at;
  }

  // 5. Compute retention per student → collect review items
  const result: ClassReviewStudent[] = [];

  for (const [studentId, topics] of studentTopics) {
    const urgent: ClassReviewStudent['urgentTopics'] = [];

    for (const [topic, acc] of topics) {
      const accuracy = acc.total > 0 ? Math.round((acc.correct / acc.total) * 100) : 0;
      const daysSince = Math.floor((now - new Date(acc.latest).getTime()) / 86400000);
      const retention = estimateRetention(accuracy, daysSince, acc.count);

      if (retention < 50) {
        urgent.push({ topic, retention, daysSince });
      }
    }

    if (urgent.length > 0) {
      urgent.sort((a, b) => a.retention - b.retention);
      result.push({
        studentId,
        studentName: studentNameMap.get(studentId) ?? '이름 없음',
        reviewCount: urgent.length,
        urgentTopics: urgent.slice(0, 3),
      });
    }
  }

  // Sort by reviewCount descending (most urgent student first)
  result.sort((a, b) => b.reviewCount - a.reviewCount);
  return result;
}
