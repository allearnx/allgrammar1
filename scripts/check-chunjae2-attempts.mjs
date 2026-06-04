import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const unit3 = 'dc3155de-270a-48eb-b667-1fe4186d0f15';
const unit4 = 'a3d94bca-25a5-4f95-a91c-496f463cdc89';

// 1. Get all sheets in these units
const { data: sheets } = await sb
  .from('naesin_problem_sheets')
  .select('id, title, questions, answer_key')
  .in('unit_id', [unit3, unit4]);

const sheetMap = {};
for (const s of sheets) sheetMap[s.id] = s;

// 2. Get all attempts on these sheets
const sheetIds = sheets.map(s => s.id);
const { data: attempts } = await sb
  .from('naesin_problem_attempts')
  .select('id, sheet_id, student_id, answers, score, total, created_at')
  .in('sheet_id', sheetIds)
  .order('created_at', { ascending: false });

if (!attempts || attempts.length === 0) {
  console.log('시도 기록 없음');
  process.exit(0);
}

// 3. Get student info
const studentIds = [...new Set(attempts.map(a => a.student_id))];
const { data: students } = await sb
  .from('students')
  .select('id, name, school')
  .in('id', studentIds);

const studentMap = {};
for (const s of students) studentMap[s.id] = s;

console.log(`총 ${attempts.length}건 시도, 학생 ${studentIds.length}명\n`);

// 4. Check which attempts hit our fixed questions
const fixedQuestions = {
  '접속사 although Step2': [1, 2, 3, 6, 26, 27, 28, 38, 40, 41, 42, 43, 44, 46],
  '수동태 step2': [4, 33, 39, 55],
};

for (const attempt of attempts) {
  const sheet = sheetMap[attempt.sheet_id];
  if (!sheet) continue;
  const student = studentMap[attempt.student_id] || { name: '?', school: '?' };

  console.log(`=== ${student.name} (${student.school}) — ${sheet.title} ===`);
  console.log(`  점수: ${attempt.score}/${attempt.total} (${new Date(attempt.created_at).toLocaleDateString('ko-KR')})`);

  // Check if this sheet has fixed questions
  const fixKey = Object.keys(fixedQuestions).find(k => sheet.title.includes(k));

  const answers = attempt.answers || [];
  let affectedCount = 0;

  for (let i = 0; i < answers.length; i++) {
    const a = answers[i];
    if (!a) continue;

    const qNum = a.questionNumber || (i + 1);
    const isFixed = fixKey && fixedQuestions[fixKey].includes(qNum);
    const wasWrong = a.isCorrect === false;

    // Show wrong answers, especially on fixed questions
    if (wasWrong) {
      const q = sheet.questions.find(q => q.number === qNum);
      const oldAnswer = sheet.answer_key?.[i] || q?.answer || '?';
      const marker = isFixed ? '⚠️ 수정된 문제' : '';
      console.log(`  Q${qNum}: 학생="${a.answer}" vs 정답="${oldAnswer}" ❌ ${marker}`);
      if (isFixed) affectedCount++;
    }
  }

  if (fixKey && affectedCount > 0) {
    console.log(`  → ⚠️ 수정된 문제에서 ${affectedCount}건 오답 (재채점 필요 가능성)`);
  }
  console.log('');
}
