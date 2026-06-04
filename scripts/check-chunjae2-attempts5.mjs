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

const { data: attempts } = await sb
  .from('naesin_problem_attempts')
  .select('*')
  .in('sheet_id', sheetIds)
  .order('created_at', { ascending: false });

// Get student profile
const { data: profile } = await sb
  .from('profiles')
  .select('*')
  .eq('id', attempts[0].student_id)
  .single();

const name = profile?.full_name || profile?.display_name || profile?.name || profile?.username || '이름없음';
console.log(`학생: ${name} (${profile?.school || '학교정보없음'})`);

// Fixed questions mapping (old → new answer)
const fixedQuestionsMap = {
  '접속사 although Step2': {
    1: { old: 'Although', new: 'If' },
    2: { old: 'Although', new: 'Though' },
    3: { old: 'although', new: 'because' },
    6: { old: 'Although', new: 'If' },
    26: { old: 'Though it has a long history', new: 'Though Korea is a small country, it has a long history.' },
    27: { old: "Though he didn't run at all", new: "Though Rick was late for the meeting, he didn't run at all." },
    28: { old: 'Though he has had some accidents', new: 'Though Tom is a careful driver, he has had some accidents.' },
    38: { old: 'Though, is, doesn\'t like', new: "Though fruit is good for his health, he doesn't like it." },
    40: { old: 'although', new: 'since' },
    41: { old: 'Although I missed the train, I arrived on time.', new: 'Although' },
    42: { old: 'Although there were too many people...', new: 'Although' },
    43: { old: 'My low grades, I lived a successful life.', new: 'In spite of' },
    44: { old: 'Although he was poor, he always helped others.', new: 'Although he was poor,' },
    46: { old: "Though Steve didn't get any support...", new: "Though Steve didn't have a map, he had no difficulty getting there." },
  },
  '수동태 step2': {
    4: { old: 'is made to play', new: 'is interested in' },
    33: { old: 'The movie is loved by many people.', new: 'The movie has been loved by many people.' },
    39: { old: 'The Taj Mahal was built by Shah Jahan.', new: 'Hanguel was made by King Sejong the Great in 1443.' },
    55: { old: 'The worm that gets up early...', new: 'The early worm is caught by the early bird.' },
  },
};

for (const attempt of attempts) {
  const sheet = sheetMap[attempt.sheet_id];
  if (!sheet) continue;

  console.log(`\n${'='.repeat(60)}`);
  console.log(`시트: ${sheet.title}`);
  console.log(`점수: ${attempt.score}/${attempt.total_questions}`);
  console.log(`날짜: ${new Date(attempt.created_at).toLocaleDateString('ko-KR')}`);

  const wrong = attempt.wrong_answers || [];
  const fixKey = Object.keys(fixedQuestionsMap).find(k => sheet.title.includes(k));
  const fixMap = fixKey ? fixedQuestionsMap[fixKey] : {};

  let scoreChange = 0;

  console.log(`\n오답 ${wrong.length}건:`);
  for (const w of wrong) {
    const qNum = w.number;
    const studentAns = w.userAnswer;
    const correctAns = w.correctAnswer;
    const isFixed = fixMap[qNum] !== undefined;

    let marker = '';
    if (isFixed) {
      const fix = fixMap[qNum];
      const studentNorm = (studentAns || '').trim().toLowerCase().replace(/[.,!?]/g, '');
      const newNorm = fix.new.trim().toLowerCase().replace(/[.,!?]/g, '');

      if (studentNorm === newNorm) {
        marker = ' → 🔄 수정된 정답과 일치! 재채점 시 +1점';
        scoreChange++;
      } else {
        marker = ` → (수정된 문제이나 학생답도 오답)`;
      }
    }

    console.log(`  Q${qNum}: 학생="${studentAns}" 정답="${correctAns}"${marker}`);
  }

  if (scoreChange > 0) {
    console.log(`\n  🔄 재채점 필요: 점수 ${attempt.score} → ${attempt.score + scoreChange}/${attempt.total_questions}`);
  } else if (fixKey) {
    console.log(`\n  ✅ 수정된 문제에 영향 없음 (점수 변동 없음)`);
  } else {
    console.log(`\n  ✅ 이 시트는 수정 사항 없음`);
  }
}
