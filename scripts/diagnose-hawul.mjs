import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
config({ path: '.env.local' });

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  // auth.users에서 하울 검색
  const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 500 });
  const students = users.filter(u => u.user_metadata?.role === 'student');

  const hawul = students.filter(u =>
    (u.user_metadata?.name || '').includes('하울') ||
    (u.email || '').includes('hawul')
  );

  if (hawul.length === 0) {
    console.log('하울 못찾음. 전체 학생 목록:');
    for (const s of students) {
      console.log(' ', s.id.slice(0,8), s.user_metadata?.name, s.email);
    }
    return;
  }

  const sid = hawul[0].id;
  console.log('하울:', sid, hawul[0].user_metadata?.name, hawul[0].email);

  // mock_exam 카테고리 시트의 시도 확인
  const { data: attempts } = await admin.from('naesin_problem_attempts')
    .select('id, sheet_id, score, total_questions, answers, wrong_answers, created_at')
    .eq('student_id', sid)
    .order('created_at', { ascending: false });

  console.log('\n총 시도:', attempts?.length);

  // 시트 정보 가져오기
  const sheetIds = [...new Set((attempts || []).map(a => a.sheet_id))];
  const { data: sheets } = await admin.from('naesin_problem_sheets')
    .select('id, title, category, mode, answer_key, questions')
    .in('id', sheetIds);

  const sheetMap = new Map((sheets || []).map(s => [s.id, s]));

  for (const a of attempts || []) {
    const s = sheetMap.get(a.sheet_id);
    if (!s) continue;

    const wa = a.wrong_answers || [];
    console.log(`\n=== [${s.category}/${s.mode}] ${s.title} ===`);
    console.log(`score: ${a.score}/${a.total_questions*1} (${a.total_questions}문제) wrongs: ${wa.length} date: ${a.created_at?.slice(0,16)}`);

    const ak = s.answer_key || [];
    const qs = s.questions || [];
    const answers = a.answers || [];

    // 채점 재현
    for (let i = 0; i < a.total_questions; i++) {
      const ua = String(answers[i] ?? '');
      const rawCorrect = ak[i];
      const ca = (rawCorrect && typeof rawCorrect === 'object' && 'answer' in rawCorrect)
        ? String(rawCorrect.answer)
        : String(rawCorrect ?? '');
      const q = qs[i];
      const hasOptions = q?.options && q.options.length > 0;
      const isInWrongList = wa.some(w => w.number === i + 1);

      // 단순 비교
      const directMatch = ua.trim().toLowerCase() === ca.trim().toLowerCase();

      // 번호 비교 (MCQ)
      let numMatch = false;
      if (hasOptions) {
        const uNum = parseInt(ua, 10);
        const cNum = parseInt(ca, 10);
        if (!isNaN(uNum) && !isNaN(cNum)) numMatch = uNum === cNum;
      }

      const shouldBeCorrect = directMatch || numMatch;

      if (isInWrongList || !shouldBeCorrect) {
        console.log(`  Q${i+1}: user=${JSON.stringify(ua)} correct=${JSON.stringify(ca)} options=${hasOptions} directMatch=${directMatch} numMatch=${numMatch} inWrong=${isInWrongList}`);
        if (q?.acceptedAnswers?.length) console.log(`    accepted: ${JSON.stringify(q.acceptedAnswers)}`);
        if (q?.options) console.log(`    options: ${JSON.stringify(q.options.slice(0,5))}`);
      }
    }
  }
}

main().catch(console.error);
