import type { SupabaseClient } from '@supabase/supabase-js';
import type { TopicAccuracyItem } from '@/types/student-report';

interface Attempt {
  score: number;
  total_questions: number;
  created_at: string;
  sheet_id: string | null;
}

/** unit title → topic name (strip "1단원 " prefix etc.) */
function extractTopic(unitTitle: string): string {
  return unitTitle.replace(/^\d+단원\s*/, '').trim() || unitTitle;
}

/** ISO week key: "2026-W14" */
function isoWeek(dateStr: string): string {
  const d = new Date(dateStr);
  const jan4 = new Date(d.getFullYear(), 0, 4);
  const dayOfYear = Math.floor((d.getTime() - jan4.getTime()) / 86400000) + jan4.getDay();
  const weekNum = Math.ceil(dayOfYear / 7);
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

export async function computeTopicAccuracy(
  qc: SupabaseClient,
  attempts: Attempt[],
): Promise<TopicAccuracyItem[]> {
  if (attempts.length === 0) return [];

  // 1. sheet_id 수집 (attempts 엔 sheet_id 만 있음 — unit_id 는 시트로 유도)
  const sheetIds = [...new Set(attempts.map((a) => a.sheet_id).filter(Boolean))] as string[];

  // 2. sheet → template_topic + sheet → unit_id
  const sheetTopicMap = new Map<string, string>();
  const sheetUnitMap = new Map<string, string>();

  if (sheetIds.length > 0) {
    const { data: sheets } = await qc
      .from('naesin_problem_sheets')
      .select('id, source_template_id, unit_id')
      .in('id', sheetIds);

    for (const s of sheets || []) {
      if (s.unit_id) sheetUnitMap.set(s.id, s.unit_id);
    }

    const templateIds = [...new Set((sheets || []).map((s) => s.source_template_id).filter(Boolean))] as string[];

    if (templateIds.length > 0) {
      const { data: templates } = await qc
        .from('naesin_templates')
        .select('id, template_topic')
        .in('id', templateIds);

      const templateTopicMap = new Map<string, string>();
      for (const t of templates || []) {
        if (t.template_topic) templateTopicMap.set(t.id, t.template_topic);
      }

      for (const s of sheets || []) {
        if (s.source_template_id && templateTopicMap.has(s.source_template_id)) {
          sheetTopicMap.set(s.id, templateTopicMap.get(s.source_template_id)!);
        }
      }
    }
  }

  // 3. unit → title (sheet 로 유도한 unit_id 기준, fallback 용)
  const unitIds = [...new Set([...sheetUnitMap.values()])];
  const unitTitleMap = new Map<string, string>();
  if (unitIds.length > 0) {
    const { data: units } = await qc
      .from('naesin_units')
      .select('id, title')
      .in('id', unitIds);
    for (const u of units || []) unitTitleMap.set(u.id, u.title);
  }

  // 4. Resolve topic for each attempt
  type Acc = {
    correct: number; total: number; count: number;
    weekly: Map<string, { correct: number; total: number }>;
    unitLatest: Map<string, string>; // unitId → latest created_at
  };
  const topicMap = new Map<string, Acc>();

  for (const a of attempts) {
    const unitId = a.sheet_id ? sheetUnitMap.get(a.sheet_id) : undefined;
    let topic = a.sheet_id ? sheetTopicMap.get(a.sheet_id) : undefined;
    if (!topic) {
      const unitTitle = unitId ? unitTitleMap.get(unitId) : undefined;
      topic = unitTitle ? extractTopic(unitTitle) : '기타';
    }

    let acc = topicMap.get(topic);
    if (!acc) {
      acc = { correct: 0, total: 0, count: 0, weekly: new Map(), unitLatest: new Map() };
      topicMap.set(topic, acc);
    }
    acc.correct += a.score;
    acc.total += a.total_questions;
    acc.count += 1;

    // Track latest attempt per unit
    if (unitId) {
      const prev = acc.unitLatest.get(unitId);
      if (!prev || a.created_at > prev) acc.unitLatest.set(unitId, a.created_at);
    }

    const wk = isoWeek(a.created_at);
    const wAcc = acc.weekly.get(wk) ?? { correct: 0, total: 0 };
    wAcc.correct += a.score;
    wAcc.total += a.total_questions;
    acc.weekly.set(wk, wAcc);
  }

  // 5. Build result, sort by accuracy ascending (weakest first)
  const result: TopicAccuracyItem[] = [];

  for (const [topic, acc] of topicMap) {
    const accuracy = acc.total > 0 ? Math.round((acc.correct / acc.total) * 100) : 0;

    // Weekly trend — last 12 weeks, sorted chronologically
    const weeks = [...acc.weekly.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([week, w]) => ({
        week,
        accuracy: w.total > 0 ? Math.round((w.correct / w.total) * 100) : 0,
      }));

    // Unit IDs sorted by latest attempt (most recent first)
    const sortedUnits = [...acc.unitLatest.entries()]
      .sort(([, a], [, b]) => b.localeCompare(a))
      .map(([uid]) => uid);
    const sortedUnitTitles = sortedUnits.map((uid) => unitTitleMap.get(uid) ?? uid);

    const lastStudiedAt = acc.unitLatest.size > 0
      ? [...acc.unitLatest.values()].sort().pop()
      : undefined;

    result.push({ topic, totalCorrect: acc.correct, totalQuestions: acc.total, accuracy, attemptCount: acc.count, trend: weeks, unitIds: sortedUnits, unitTitles: sortedUnitTitles, lastStudiedAt });
  }

  result.sort((a, b) => a.accuracy - b.accuracy);
  return result;
}
