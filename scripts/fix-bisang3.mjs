import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const unitIds = [
  '61d8c49e-5888-4ca4-a21c-2091103b4159', // 3과
  'a0c4cc94-8791-4c63-884b-cec29fc04fbd', // 4과
];

// ============================================================
// 1. Fix empty speakers in dialogues
// ============================================================
console.log('========== 1. 빈 화자 수정 ==========');

const { data: dialogues } = await sb
  .from('naesin_dialogues')
  .select('id, unit_id, title, sentences')
  .in('unit_id', unitIds);

for (const d of dialogues) {
  const sents = d.sentences || [];
  const emptySpeakers = sents.filter(s => !s.speaker || !s.speaker.trim());
  if (emptySpeakers.length === 0) continue;

  const unit = d.unit_id === unitIds[0] ? '3과' : '4과';
  console.log(`\n--- ${unit} ${d.title} ---`);

  // Print context to determine speakers
  for (let i = 0; i < sents.length; i++) {
    const s = sents[i];
    if (!s.speaker || !s.speaker.trim()) {
      console.log(`  [${i}] ⚠️ 빈 화자: "${(s.original || '').substring(0, 80)}"`);
      console.log(`       한글: "${(s.korean || '').substring(0, 80)}"`);
      // Look at surrounding context
      if (i > 0) console.log(`       이전: [${sents[i-1].speaker}] ${(sents[i-1].original || '').substring(0, 60)}`);
      if (i < sents.length - 1) console.log(`       다음: [${sents[i+1]?.speaker || '?'}] ${(sents[i+1]?.original || '').substring(0, 60)}`);
    }
  }
}

// Now fix speakers based on context analysis
// We need to look at the actual dialogue content first, then apply fixes
// Let's dump the full dialogues to understand the pattern

for (const d of dialogues) {
  const sents = d.sentences || [];
  const emptySpeakers = sents.filter(s => !s.speaker || !s.speaker.trim());
  if (emptySpeakers.length === 0) continue;

  const unit = d.unit_id === unitIds[0] ? '3과' : '4과';
  console.log(`\n\n--- FULL: ${unit} ${d.title} ---`);
  for (let i = 0; i < Math.min(sents.length, 30); i++) {
    const s = sents[i];
    const flag = (!s.speaker || !s.speaker.trim()) ? ' ⚠️' : '';
    console.log(`  [${i}] [${s.speaker || '???'}] ${(s.original || '').substring(0, 100)}${flag}`);
  }
}

// ============================================================
// 2. Fix problem sheet answers
// ============================================================
console.log('\n\n========== 2. 문제 정답 수정 ==========');

const { data: sheets } = await sb
  .from('naesin_problem_sheets')
  .select('id, unit_id, title, questions, answer_key, source_template_id')
  .in('unit_id', unitIds)
  .order('title');

// --- 과거완료 step 1: Q7 ---
const step1Fixes = [
  {
    num: 7,
    newAnswer: 'I had lost my watch that my father had bought me',
    newExplanation: '주어진 단어(lost, my, my, bought, father, had, me, watch)를 모두 사용하여 과거완료 문장을 만듭니다. "I had lost my watch that my father had bought me" = 나는 아버지가 나에게 사준 시계를 잃어버렸었다.',
  },
];

// --- 과거완료 step 2: 19 fixes ---
const step2Fixes = [
  {
    num: 1,
    newAnswer: 'had already gone home',
    newExplanation: '보기에서 "already go home"을 사용해야 합니다. 과거 시점(couldn\'t find)보다 더 이전에 일어난 일이므로 과거완료 "had already gone home"이 정답입니다.',
  },
  {
    num: 2,
    newAnswer: 'had broken down on her way',
    newExplanation: '보기에서 "break down on one\'s way"를 사용합니다. 주어가 Kate의 차이므로 "one\'s"를 "her"로 바꾸어 "had broken down on her way"가 정답입니다.',
    acceptedAnswers: ['had broken down on its way'],
  },
  {
    num: 5,
    newAnswer: '4',
    fixOptions: { 2: 'had started' }, // fix option 3 (0-indexed: 2) from "had start" to "had started"
    newExplanation: '보기에서 "start"를 사용하면 "had started"가 되고, "finish"를 사용하면 "had finished"가 됩니다. 극장에 도착했을 때 영화가 이미 시작되었으므로 "had started"가 가장 자연스럽지만, 선택지 중 문법적으로 올바른 것은 ④ "had finished"입니다.',
  },
  {
    num: 6,
    newAnswer: 'had / gone',
    newExplanation: '보기에서 "go"를 사용해야 합니다. 파티에 도착한 과거 시점보다 더 이전에 친구들이 집에 간 상황이므로 과거완료 "had already gone home"이 정답입니다.',
  },
  {
    num: 7,
    newAnswer: 'had / finished',
    newExplanation: '보기에서 "finish"를 사용해야 합니다. 집에 돌아온 시점보다 더 이전에 가족이 저녁을 끝낸 상황이므로 과거완료 "had already finished dinner"가 정답입니다.',
  },
  {
    num: 15,
    newAnswer: 'had / eaten / went',
    newExplanation: '원문 "She went home"에서 "went"를 사용합니다. After절에서 먼저 일어난 일은 과거완료 "had eaten", 나중에 일어난 일은 단순과거 "went"입니다. "left home"은 "집을 떠났다"로 원문과 반대 의미입니다.',
  },
  {
    num: 16,
    newAnswer: 'forgot / had planned / arrived / had gone',
    newExplanation: '보기(plan, be, go, arrive, forget, wake, leave)에서 적절한 단어를 골라 사용합니다. "forgot about"(잊었다), "had planned"(전날 계획했던 — 과거완료), "arrived"(도착했다), "had gone home"(이미 집에 가버렸다 — 과거완료)이 정답입니다.',
  },
  {
    num: 21,
    newAnswer: 'Sam had never seen such a beautiful beach before he went to the East Sea.',
    newExplanation: '두 문장을 합칠 때 시간 순서를 고려합니다. 동해에 가기 전까지는 아름다운 해변을 본 적이 없었으므로 "before"로 연결합니다. "because"를 사용하면 논리적으로 맞지 않습니다.',
    acceptedAnswers: ['Sam had never seen such a beautiful beach until he went to the East Sea.'],
  },
  {
    num: 24,
    newAnswer: 'Because Mike had left his report at home, he couldn\'t hand it in.',
    newExplanation: '문제에서 "Because __________."로 시작하라고 했으므로 Because절을 앞에 놓습니다. 보고서를 집에 두고 온 것(1st)이 더 이전이므로 과거완료 "had left"를 사용합니다.',
  },
  {
    num: 25,
    newAnswer: 'Because I had left my wallet at home, my friend kindly paid the bill for me.',
    newExplanation: '문제에서 "Because __________."로 시작하라고 했으므로 Because절을 앞에 놓습니다. 지갑을 집에 두고 온 것(1st)이 더 이전이므로 과거완료 "had left"를 사용합니다.',
  },
  {
    num: 31,
    newAnswer: 'had put the clothes away',
    newExplanation: '보기에서 "put the clothes away"를 사용합니다. Sarah가 돌아오기 전에 누군가가 침대에서 옷을 치워둔 것이므로 과거완료 "had put the clothes away"가 정답입니다.',
  },
  {
    num: 46,
    newAnswer: 'Minsu had already eaten dinner when his mother came home.',
    newExplanation: '우리말 "어머니가 집에 오셨을 때 민수는 이미 저녁을 먹었다"를 보기 패턴대로 영작합니다. 어머니가 오기 전에 이미 저녁을 먹은 상태이므로 과거완료 "had already eaten dinner"를 사용합니다.',
  },
  {
    num: 50,
    newAnswer: 'had seen / had fallen',
    newExplanation: '(1) 영화를 두 번 본 경험이 이야기를 알고 있는 것보다 이전이므로 "had seen". (2) 민호가 집에 왔을 때 개가 이미 잠든 상태이므로 "had fallen asleep"의 과거완료형 "had fallen"이 정답입니다.',
  },
  {
    num: 62,
    newAnswer: 'When I arrived at the theater, the movie had already begun.',
    newExplanation: '우리말 "내가 영화관에 도착했을 때, 이미 영화는 시작되었다"를 주어진 단어 arrive, begin을 사용하여 영작합니다. 도착(arrived — 단순과거)보다 영화 시작(had begun — 과거완료)이 더 이전입니다.',
  },
  {
    num: 71,
    newAnswer: 'b. went → had gone to bed',
    newExplanation: '남자가 침입했을 때(과거) 이미 모든 사람이 잠자리에 들었으므로(더 이전), b의 "went to bed"를 과거완료 "had gone to bed"로 고쳐야 합니다.',
  },
  {
    num: 74,
    newAnswer: 'After the storm, we had been without electricity for five days.',
    newExplanation: '우리말 "폭풍 후에"는 "After the storm"입니다. 폭풍 이후 5일간 전기 없이 지속된 상태를 과거완료 "had been"으로 표현하고, 숫자 5는 영어 "five"로 씁니다.',
  },
  {
    num: 76,
    newAnswer: 'Mr. Stark had been an English teacher before he left his hometown.',
    newExplanation: '우리말 "Mr. Stark는 그가 그의 고향을 떠나기 전에 영어 선생님이었었다"를 영작합니다. 고향을 떠나기 전에 영어 선생님이었으므로 과거완료 "had been"을 사용하고 "before"로 연결합니다.',
  },
  {
    num: 77,
    newAnswer: 'When I arrived at the party, Lucy had already gone home.',
    newExplanation: '우리말 "내가 파티에 도착했을 때, Lucy는 이미 집에 가고 없었다"를 주어진 단어 arrive, the, go를 사용하여 영작합니다. 내가 도착한 시점보다 Lucy가 먼저 집에 갔으므로 과거완료 "had already gone"을 사용합니다.',
  },
  {
    num: 83,
    newAnswer: 'had practiced, had played, had come',
    newExplanation: '보기(become, play, come, practice, get)에서 적절한 단어를 골라 과거완료로 바꿉니다. (1) 오래 연습했으므로 "had practiced", (2) 브라질에서 축구를 했으므로 "had played", (3) 영국에 왔으므로 "had come"이 정답입니다. "moved"는 보기에 없습니다.',
  },
];

const fixSets = [
  { titleMatch: '과거완료 step 1', fixes: step1Fixes },
  { titleMatch: '과거완료 step 2', fixes: step2Fixes },
];

let totalFixed = 0;

for (const sheet of sheets) {
  const fixSet = fixSets.find(f => sheet.title === f.titleMatch);
  if (!fixSet) continue;

  console.log(`\n--- ${sheet.title} (${sheet.id}) ---`);
  const qs = [...sheet.questions];
  const ak = [...sheet.answer_key];
  let sheetFixed = 0;

  for (const fix of fixSet.fixes) {
    const idx = qs.findIndex(q => q.number === fix.num);
    if (idx === -1) { console.log(`  ⚠️ Q${fix.num} 없음`); continue; }

    const old = qs[idx].answer;
    qs[idx] = { ...qs[idx], answer: fix.newAnswer };
    if (fix.newExplanation) qs[idx].explanation = fix.newExplanation;
    if (fix.acceptedAnswers) qs[idx].acceptedAnswers = fix.acceptedAnswers;
    if (fix.fixOptions) {
      const opts = [...(qs[idx].options || [])];
      for (const [oi, newText] of Object.entries(fix.fixOptions)) {
        opts[Number(oi)] = newText;
      }
      qs[idx].options = opts;
    }
    ak[idx] = fix.newAnswer;
    console.log(`  Q${fix.num}: "${String(old).substring(0, 50)}" → "${String(fix.newAnswer).substring(0, 50)}"`);
    sheetFixed++;
  }

  if (sheetFixed > 0) {
    const { error } = await sb
      .from('naesin_problem_sheets')
      .update({ questions: qs, answer_key: ak })
      .eq('id', sheet.id);
    console.log(error ? `  ❌ 저장 실패: ${error.message}` : `  ✅ ${sheetFixed}건 저장 완료`);
    totalFixed += sheetFixed;

    // Template sync
    if (sheet.source_template_id) {
      const { data: tmpl } = await sb
        .from('naesin_templates')
        .select('id, title, questions, answer_key')
        .eq('id', sheet.source_template_id)
        .single();

      if (tmpl) {
        const tqs = [...tmpl.questions];
        const tak = [...tmpl.answer_key];
        let tf = 0;

        for (const fix of fixSet.fixes) {
          const tidx = tqs.findIndex(q => q.number === fix.num);
          if (tidx === -1) continue;
          tqs[tidx] = { ...tqs[tidx], answer: fix.newAnswer };
          if (fix.newExplanation) tqs[tidx].explanation = fix.newExplanation;
          if (fix.acceptedAnswers) tqs[tidx].acceptedAnswers = fix.acceptedAnswers;
          if (fix.fixOptions) {
            const opts = [...(tqs[tidx].options || [])];
            for (const [oi, newText] of Object.entries(fix.fixOptions)) {
              opts[Number(oi)] = newText;
            }
            tqs[tidx].options = opts;
          }
          tak[tidx] = fix.newAnswer;
          tf++;
        }

        const { error: te } = await sb.from('naesin_templates')
          .update({ questions: tqs, answer_key: tak })
          .eq('id', tmpl.id);
        console.log(te
          ? `  ❌ 템플릿: ${te.message}`
          : `  ✅ 템플릿 "${tmpl.title}": ${tf}건 동기화`);

        // Other copies
        const { data: copies } = await sb
          .from('naesin_problem_sheets')
          .select('id, title, questions, answer_key')
          .eq('source_template_id', tmpl.id)
          .neq('id', sheet.id);

        for (const copy of (copies || [])) {
          const cqs = [...copy.questions];
          const cak = [...copy.answer_key];
          let cf = 0;
          for (const fix of fixSet.fixes) {
            const cidx = cqs.findIndex(q => q.number === fix.num);
            if (cidx === -1) continue;
            if (String(cqs[cidx].answer || '').trim() === fix.newAnswer) continue;
            cqs[cidx] = { ...cqs[cidx], answer: fix.newAnswer };
            if (fix.newExplanation) cqs[cidx].explanation = fix.newExplanation;
            if (fix.acceptedAnswers) cqs[cidx].acceptedAnswers = fix.acceptedAnswers;
            if (fix.fixOptions) {
              const opts = [...(cqs[cidx].options || [])];
              for (const [oi, newText] of Object.entries(fix.fixOptions)) {
                opts[Number(oi)] = newText;
              }
              cqs[cidx].options = opts;
            }
            cak[cidx] = fix.newAnswer;
            cf++;
          }
          if (cf > 0) {
            const { error: ce } = await sb.from('naesin_problem_sheets')
              .update({ questions: cqs, answer_key: cak }).eq('id', copy.id);
            console.log(ce
              ? `    ❌ 복사본 ${copy.title}`
              : `    ✅ 복사본 ${copy.title}: ${cf}건 동기화`);
          }
        }
      }
    }
  }
}

// ============================================================
// 3. Check student attempts
// ============================================================
console.log('\n\n========== 3. 학생 시도 확인 ==========');
const allSheetIds = sheets.map(s => s.id);
const { data: attempts } = await sb
  .from('naesin_problem_attempts')
  .select('id, student_id, sheet_id, score, total, wrong_answers')
  .in('sheet_id', allSheetIds);

console.log(`총 시도: ${(attempts || []).length}건`);

const allFixNums = [...step1Fixes.map(f => f.num), ...step2Fixes.map(f => f.num)];
for (const a of (attempts || [])) {
  const sheetTitle = sheets.find(s => s.id === a.sheet_id)?.title || '?';
  const affected = (a.wrong_answers || []).filter(w => allFixNums.includes(w.number));
  if (affected.length > 0) {
    console.log(`  ⚠️ ${sheetTitle} 학생 ${a.student_id}: ${affected.length}건 영향 가능 (${affected.map(w => `Q${w.number}`).join(', ')})`);
  }
}

console.log(`\n총 수정: ${totalFixed}건`);
