import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const unit3 = 'dc3155de-270a-48eb-b667-1fe4186d0f15';
const unit4 = 'a3d94bca-25a5-4f95-a91c-496f463cdc89';

const { data: sheets } = await sb
  .from('naesin_problem_sheets')
  .select('id, title')
  .in('unit_id', [unit3, unit4]);

const sheetMap = {};
for (const s of sheets) sheetMap[s.id] = s;
const sheetIds = sheets.map(s => s.id);

// Get ALL attempts
const { data: attempts } = await sb
  .from('naesin_problem_attempts')
  .select('*')
  .in('sheet_id', sheetIds);

console.log(`시도: ${attempts.length}건\n`);

for (const a of attempts) {
  const sheet = sheetMap[a.sheet_id];
  console.log(`=== ${sheet?.title || a.sheet_id} ===`);
  console.log(`student_id: ${a.student_id}`);
  console.log(`score: ${a.score}, total: ${a.total_questions}`);
  console.log(`created_at: ${a.created_at}`);

  // Look at raw answers structure
  const answers = a.answers || [];
  console.log(`answers: ${answers.length}개`);
  if (answers.length > 0) {
    console.log(`  첫번째 답 구조:`, JSON.stringify(answers[0]));
    console.log(`  두번째 답 구조:`, JSON.stringify(answers[1]));
  }

  // Look at wrong_answers
  const wrong = a.wrong_answers || [];
  console.log(`wrong_answers: ${wrong.length}개`);
  if (wrong.length > 0) {
    console.log(`  첫번째:`, JSON.stringify(wrong[0]));
  }

  // Show all wrong answers properly
  console.log('\n오답 목록:');
  for (const w of wrong) {
    const qNum = w.questionNumber || w.number || w.q;
    const studentAns = w.studentAnswer || w.answer || w.student_answer;
    const correctAns = w.correctAnswer || w.correct || w.correct_answer;
    console.log(`  Q${qNum}: 학생="${studentAns}" vs 정답="${correctAns}" (isCorrect: ${w.isCorrect})`);
  }
  console.log('');
}

// Also check profiles for student info
if (attempts.length > 0) {
  const sid = attempts[0].student_id;
  const { data: profile } = await sb.from('profiles').select('*').eq('id', sid).single();
  if (profile) {
    console.log('학생 프로필:', JSON.stringify(profile, null, 2));
  }
}
