import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const name = process.argv[2] || '김지민';

// 1. Find the student
const { data: profiles } = await supabase
  .from('profiles')
  .select('id, full_name, role')
  .ilike('full_name', `%${name}%`)
  .limit(5);

console.log('=== 학생 프로필 ===');
console.log(profiles);

if (!profiles || profiles.length === 0) {
  console.log('학생을 찾을 수 없습니다');
  process.exit(0);
}

const studentId = profiles[0].id;

// 2. Get their voca progress
const { data: progress } = await supabase
  .from('voca_student_progress')
  .select('day_id, flashcard_completed, quiz_score, spelling_score, matching_completed, matching_score')
  .eq('student_id', studentId);

// 3. Get day info
const dayIds = (progress || []).map(p => p.day_id);
let days = [];
if (dayIds.length > 0) {
  const { data } = await supabase.from('voca_days').select('id, title, sort_order').in('id', dayIds).order('sort_order');
  days = data || [];
}

const dayMap = new Map(days.map(d => [d.id, d]));

console.log('\n=== 보카 진행 상황 ===');
const sorted = (progress || []).sort((a, b) => {
  const da = dayMap.get(a.day_id);
  const db = dayMap.get(b.day_id);
  return (da?.sort_order || 0) - (db?.sort_order || 0);
});

for (const p of sorted) {
  const day = dayMap.get(p.day_id);
  const quizPass = (p.quiz_score ?? 0) >= 80;
  const fcDone = p.flashcard_completed || quizPass;
  const spellPass = (p.spelling_score ?? 0) >= 80;
  const r1Complete = fcDone && quizPass && spellPass && p.matching_completed;

  console.log(
    `${day?.title || p.day_id}: ` +
    `FC=${p.flashcard_completed ? '✓' : '✗'} ` +
    `Quiz=${p.quiz_score ?? '-'} ` +
    `Spell=${p.spelling_score ?? '-'} ` +
    `Match=${p.matching_score ?? '-'}(${p.matching_completed ? '✓' : '✗'}) ` +
    `→ R1: ${r1Complete ? '완료 ✓' : '미완료'}`
  );
}
