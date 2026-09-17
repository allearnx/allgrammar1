import type { SupabaseClient } from '@supabase/supabase-js';
import type { NaesinProblemQuestion } from '@/types/naesin';

/**
 * 층 간 문항 중복 검사 (2026-09-17 사장님 원칙: 기본기/내신 유형/예상/기출은 성격이 달라
 * 겹쳐도 되지만 "같은 문항"이면 안 됨). 내신 콕콕 세트를 저장할 때 내신 단원 시트·일반 템플릿과
 * 영어 문장(4단어 이상)이 완전히 같은 것을 찾아낸다. 옵션·본문 모두 대상.
 */
const norm = (s: string) =>
  s.toLowerCase().replace(/<\/?u>/g, '').replace(/[’‘]/g, "'").replace(/_{2,}/g, '_')
    .replace(/[^a-z0-9'_ ]/g, ' ').replace(/\s+/g, ' ').trim();

export function extractSentences(q: Pick<NaesinProblemQuestion, 'question' | 'options'>): Set<string> {
  const out = new Set<string>();
  const grab = (t: unknown) => {
    for (const s of String(t ?? '').split(/\n|(?<=[.?!])\s+/)) {
      const n = norm(s);
      if (/[a-z]/.test(n) && n.split(' ').length >= 4) out.add(n);
    }
  };
  grab(q.question);
  for (const o of q.options ?? []) grab(o);
  return out;
}

export interface DuplicateHit { source: string; number: number; sentence: string }

/** 주어진 문항들이 기존 시트·템플릿과 문장 단위로 겹치는 곳을 반환 (excludeTemplateId = 자기 자신 제외) */
export async function findDuplicateSentences(
  admin: SupabaseClient,
  questions: NaesinProblemQuestion[],
  excludeTemplateId?: string,
): Promise<DuplicateHit[]> {
  const mine = new Map<string, number>();
  for (const q of questions) for (const s of extractSentences(q)) if (!mine.has(s)) mine.set(s, q.number);
  if (mine.size === 0) return [];

  const [{ data: sheets }, { data: tmpls }] = await Promise.all([
    admin.from('naesin_problem_sheets').select('title, questions').is('assigned_student_id', null).range(0, 9999),
    admin.from('naesin_templates').select('id, title, questions').range(0, 9999),
  ]);
  const hits: DuplicateHit[] = [];
  const seen = new Set<string>();
  const scan = (label: string, qs: unknown) => {
    for (const q of (qs as NaesinProblemQuestion[]) ?? []) for (const s of extractSentences(q)) {
      const n = mine.get(s);
      if (n != null && !seen.has(`${label}|${s}`)) { seen.add(`${label}|${s}`); hits.push({ source: label, number: n, sentence: s }); }
    }
  };
  for (const s of sheets ?? []) scan(`시트 ${s.title}`, s.questions);
  for (const t of tmpls ?? []) if (t.id !== excludeTemplateId) scan(`템플릿 ${t.title}`, t.questions);
  return hits;
}
