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
  .select('id, title, questions, answer_key')
  .in('unit_id', [unit3, unit4]);

const sheetMap = {};
for (const s of sheets) sheetMap[s.id] = s;
const sheetIds = sheets.map(s => s.id);

// Get all attempts
const { data: attempts } = await sb
  .from('naesin_problem_attempts')
  .select('id, student_id, sheet_id, answers, score, total_questions, wrong_answers, created_at')
  .in('sheet_id', sheetIds);

// Get student info
const studentIds = [...new Set(attempts.map(a => a.student_id))];
const studentMap = {};
for (const table of ['students', 'profiles', 'users']) {
  const { data: sts } = await sb.from(table).select('id, name, school').in('id', studentIds);
  if (sts && sts.length) {
    for (const s of sts) studentMap[s.id] = s;
    console.log(`학생 테이블: ${table}, ${sts.length}명`);
    break;
  }
}
if (Object.keys(studentMap).length === 0) {
  // Try profiles with different columns
  const { data: profs } = await sb.from('profiles').select('*').in('id', studentIds).limit(1);
  if (profs && profs.length) {
    console.log('profiles 컬럼:', Object.keys(profs[0]));
    for (const p of profs) studentMap[p.id] = { name: p.full_name || p.display_name || p.username || p.id, school: p.school || '?' };
  }
}

const fixedQuestions = {
  '접속사 although Step2': {
    1: 'If', 2: 'Though', 3: 'because', 6: 'If',
    26: 'Though Korea is a small country, it has a long history.',
    27: "Though Rick was late for the meeting, he didn't run at all.",
    28: 'Though Tom is a careful driver, he has had some accidents.',
    38: "Though fruit is good for his health, he doesn't like it.",
    40: 'since', 41: 'Although', 42: 'Although', 43: 'In spite of',
    44: 'Although he was poor,',
    46: "Though Steve didn't have a map, he had no difficulty getting there.",
  },
  '수동태 step2': {
    4: 'is interested in',
    33: 'The movie has been loved by many people.',
    39: 'Hanguel was made by King Sejong the Great in 1443.',
    55: 'The early worm is caught by the early bird.',
  },
};

for (const attempt of attempts) {
  const sheet = sheetMap[attempt.sheet_id];
  if (!sheet) continue;
  const student = studentMap[attempt.student_id] || { name: '?', school: '?' };

  console.log(`=== ${student.name} (${student.school}) — ${sheet.title} ===`);
  console.log(`점수: ${attempt.score}/${attempt.total_questions} (${new Date(attempt.created_at).toLocaleDateString('ko-KR')})`);

  const fixKey = Object.keys(fixedQuestions).find(k => sheet.title.includes(k));
  const fixMap = fixKey ? fixedQuestions[fixKey] : {};

  // Show all answers with wrong/right status
  const answers = attempt.answers || [];
  const wrongNums = (attempt.wrong_answers || []).map(w => w.questionNumber || w.number);
  let regradeNeeded = [];

  for (let i = 0; i < answers.length; i++) {
    const a = answers[i];
    if (!a) continue;

    const qNum = a.questionNumber || a.number || (i + 1);
    const q = sheet.questions.find(q => q.number === qNum);
    const correctAnswer = sheet.answer_key?.[i] || q?.answer || '?';
    const isWrong = a.isCorrect === false || wrongNums.includes(qNum);
    const isFixed = fixMap[qNum] !== undefined;

    if (isWrong) {
      const marker = isFixed ? ' ⚠️ 수정된문제' : '';
      console.log(`  Q${qNum}: 학생="${a.answer}" vs 현재정답="${correctAnswer}"${marker} ❌`);

      if (isFixed) {
        // Check if student's answer matches the NEW correct answer
        const newCorrect = fixMap[qNum];
        const studentNorm = (a.answer || '').trim().toLowerCase();
        const newNorm = newCorrect.trim().toLowerCase();
        const matches = studentNorm === newNorm ||
          studentNorm.replace(/[.,!?]/g, '') === newNorm.replace(/[.,!?]/g, '');

        if (matches) {
          console.log(`    → 🔄 학생 답이 수정된 정답과 일치! 재채점 시 정답 처리됨`);
          regradeNeeded.push(qNum);
        } else {
          // Check what the OLD answer was
          console.log(`    → 수정 전 정답으로도 오답이었음 (영향 없음)`);
        }
      }
    }
  }

  if (regradeNeeded.length > 0) {
    console.log(`\n  🔄 재채점 필요: Q${regradeNeeded.join(', Q')} → 점수 ${attempt.score} → ${attempt.score + regradeNeeded.length}/${attempt.total_questions}`);
  }
  console.log('');
}
