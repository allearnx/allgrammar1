/**
 * 수동태 step2 시트 수정 + 재채점
 * - 빈칸 문제에 "※ 빈칸에 들어갈 말만 쓰시오" 안내 추가
 * - 복합 답안을 subParts로 변환 (독립 채점)
 * - 대체 정답(acceptedAnswers) 추가
 * - 템플릿 + 복사본 3개 모두 업데이트
 * - 기존 시도 + 드래프트 재채점
 *
 * 실행: node scripts/fix-sudontae-step2.mjs [--dry-run]
 */
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const DRY_RUN = process.argv.includes('--dry-run');
if (DRY_RUN) console.log('*** DRY RUN — DB 변경 없음 ***\n');

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

// ─── 대상 시트 ───
const TEMPLATE_ID = 'cac534f0-5d4e-475f-87f3-30fdc65d645d';
const SHEET_IDS = [
  'eceb5976-827b-4054-affc-4c4efecf620f',
  'abf2d199-2be5-4008-b2e9-4958649dd965',
  '765105d0-6c5f-44c7-ad60-53053d234187',
];

// ─── normalize (regrade-all.mjs 동일 로직) ───
function normalize(s) {
  return String(s ?? '').trim().toLowerCase()
    .replace(/\.+\s*$/, '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\s+/g, ' ');
}

function extractAnswer(val) {
  if (val == null) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  if (typeof val === 'object' && 'answer' in val) return String(val.answer ?? '');
  return '';
}

const CIRCLED = { '①':'1','②':'2','③':'3','④':'4','⑤':'5','⑥':'6','⑦':'7','⑧':'8','⑨':'9','⑩':'10' };
function uncircle(s) {
  return s.replace(/[①②③④⑤⑥⑦⑧⑨⑩]+/g, m => [...m].map(c => CIRCLED[c]??c).join(','));
}
function normalizeMultiSelect(s) {
  const parts = s.split(',').map(v => v.trim());
  if (parts.length <= 1) return s.trim().toLowerCase();
  if (parts.every(p => /^\d+$/.test(p))) return parts.sort((a,b)=>Number(a)-Number(b)).join(', ');
  return parts.map(p => p.toLowerCase()).sort().join(', ');
}
function matchMcqAnswer(u, c, opts) {
  const uP = uncircle(u).trim().toLowerCase(), cP = uncircle(c).trim().toLowerCase();
  if (uP === cP) return true;
  if (cP.includes(',') || uP.includes(',')) { if (normalizeMultiSelect(uP) === normalizeMultiSelect(cP)) return true; }
  if (!opts || !opts.length) return false;
  const idx = parseInt(uP,10);
  if (!isNaN(idx)&&idx>=1&&idx<=opts.length&&opts[idx-1].trim().toLowerCase()===cP) return true;
  const cidx = parseInt(cP,10);
  if (!isNaN(cidx)&&cidx>=1&&cidx<=opts.length&&opts[cidx-1].trim().toLowerCase()===uP) return true;
  return false;
}

// ─── 1. subParts 정의 ───
const SUB_PARTS_MAP = {
  14: [
    { label: '(1) bear→', answer: 'was born' },
    { label: '(2) 나라', answer: 'Korea' },
    { label: '(3) 년도', answer: '1962' },
    { label: '(4) love→', answer: 'was loved' },
    { label: '(5) 누구에게', answer: 'many Sudanese people' },
    { label: '(6) 어디서', answer: 'Sudan' },
    { label: '(7) call→', answer: 'was called' },
    { label: '(8) 별명', answer: "the Schweizer of Sudan", acceptedAnswers: ["'the Schweizer of Sudan'", '"the Schweizer of Sudan"'] },
  ],
  15: [
    { label: '(1) create', answer: 'created' },
    { label: '(2) read', answer: 'read' },
    { label: '(3) send', answer: 'sent' },
    { label: '(4) teach', answer: 'taught' },
    { label: '(5) 인물', answer: 'Harry Potter' },
  ],
  42: [
    { label: '①', answer: 'is played' },
    { label: '②', answer: 'are cleaned' },
    { label: '③', answer: 'are baked' },
  ],
  43: [
    { label: '(1)', answer: "The fairy's dress was taken by the man" },
    { label: '(2)', answer: "The bird's leg was broken in an accident" },
  ],
  44: [
    { label: '(1)', answer: 'His car was stopped by the police last night' },
    { label: '(2)', answer: 'The play lasted for more than two hours' },
  ],
  45: [
    { label: '(1)', answer: 'was invented by' },
    { label: '(2)', answer: 'is used by' },
  ],
  46: [
    { label: '(1)', answer: 'was thrown' },
    { label: '(2)-빈칸', answer: "wasn't broken", acceptedAnswers: ['was not broken'] },
    { label: '(2)-by 뒤', answer: 'she' },
    { label: '(3)', answer: 'cuts the grass' },
  ],
  51: [
    { label: '능동태', answer: 'We should recycle cans and plastic bottles' },
    { label: '수동태', answer: 'Cans and plastic bottles should be recycled by us' },
  ],
  53: [
    { label: '(1)', answer: 'were taken by my mother' },
    { label: '(2)', answer: 'was broken by' },
    { label: '(3)', answer: 'was made' },
  ],
  55: [
    { label: '(1)', answer: 'was written' },
    { label: '(2)', answer: 'broke' },
    { label: '(3)', answer: 'could be built' },
  ],
  56: [
    { label: '(1)', answer: 'is made' },
    { label: '(2)', answer: 'was woken up' },
    { label: '(3)', answer: 'will be caught by the police', acceptedAnswers: ['will be caught'] },
  ],
  60: [
    { label: '(1) 수동태', answer: 'The magazine is read by my cousin' },
    { label: '(2) 능동태', answer: 'Mark Chagall painted I and the Village in 1911' },
    { label: '(3) 부정 수동태', answer: 'This book was not written by Shakespeare', acceptedAnswers: ["This book wasn't written by Shakespeare"] },
  ],
  61: [
    { label: '능동태', answer: 'Dad made the soup' },
    { label: '수동태', answer: 'The soup was made by dad' },
  ],
  63: [
    { label: '(1)', answer: 'was built by the Romans' },
    { label: '(2)', answer: 'was caught by the policeman' },
  ],
  64: [
    { label: '(1)', answer: 'built the house' },
    { label: '(2)', answer: 'was built by my father' },
  ],
  65: [
    { label: '①', answer: 'are collected' },
    { label: '②', answer: 'are given' },
  ],
};

// ─── 2. 대체 정답 추가 ───
const ACCEPTED_ANSWERS_MAP = {
  // #2: 밑줄 친 부분 2개를 모두 고친 경우도 정답 처리
  2: { acceptedAnswers: [
    "Was the letter delivered by Mr. Smith?\nNo, it wasn't. It was delivered by a bird",
    "Was the letter delivered by Mr. Smith? No, it wasn't. It was delivered by a bird.",
  ]},
  // #62: slash는 대안이지 subParts가 아님
  62: { answer: 'are cut down to make paper', acceptedAnswers: ['are cut down to be made into paper'] },
};

// ─── 2b. subParts 문제의 추가 acceptedAnswers (쉼표 구분 등) ───
const EXTRA_ACCEPTED = {
  // #43, #44: 쉼표 구분도 정답 처리
  43: ["The fairy's dress was taken by the man, The bird's leg was broken in an accident"],
  44: ['His car was stopped by the police last night., The play lasted for more than two hours',
       'His car was stopped by the police last night, The play lasted for more than two hours'],
  // #51: 수동태만 써도 정답 (문제가 수동태만 요구)
  51: ['Cans and plastic bottles should be recycled by us',
       'Cans and plastic bottles should be recycled'],
};

// ─── 3. 빈칸 안내 추가 대상 (subParts 변환 대상 제외) ───
// 문제 텍스트에 ___ 있고, 정답이 빈칸 부분만인 문제
const BLANK_FILL_INSTRUCTION = '\n\n※ 빈칸에 들어갈 말만 쓰시오.';
const BLANK_FILL_NUMBERS = [4, 5, 6, 7, 10, 11, 12, 13, 16, 17, 18, 19, 22, 23, 24, 25, 26, 47, 48, 49, 50, 52, 62];

// ─── 4. 문제 수정 함수 ───
function fixQuestions(questions) {
  let changeCount = 0;

  for (const q of questions) {
    const num = q.number;

    // subParts 변환
    if (SUB_PARTS_MAP[num]) {
      q.subParts = SUB_PARTS_MAP[num];
      // answer를 subParts의 answer들을 " / "로 연결한 형태로 유지
      q.answer = SUB_PARTS_MAP[num].map(sp => sp.answer).join(' / ');
      changeCount++;
      console.log(`  #${num}: subParts ${SUB_PARTS_MAP[num].length}개 추가`);
    }

    // 대체 정답
    if (ACCEPTED_ANSWERS_MAP[num]) {
      if (ACCEPTED_ANSWERS_MAP[num].answer) q.answer = ACCEPTED_ANSWERS_MAP[num].answer;
      q.acceptedAnswers = [...(q.acceptedAnswers || []), ...(ACCEPTED_ANSWERS_MAP[num].acceptedAnswers || [])];
      changeCount++;
      console.log(`  #${num}: acceptedAnswers 추가 (${q.acceptedAnswers.length}개)`);
    }

    // subParts 문제의 추가 허용 정답 (쉼표 구분 등)
    if (EXTRA_ACCEPTED[num]) {
      q.acceptedAnswers = [...(q.acceptedAnswers || []), ...EXTRA_ACCEPTED[num]];
      changeCount++;
      console.log(`  #${num}: 추가 허용답 ${EXTRA_ACCEPTED[num].length}개`);
    }

    // 빈칸 안내 추가
    if (BLANK_FILL_NUMBERS.includes(num) && !q.question.includes('※')) {
      q.question = q.question.trimEnd() + BLANK_FILL_INSTRUCTION;
      changeCount++;
      console.log(`  #${num}: 빈칸 안내 추가`);
    }
  }

  return changeCount;
}

// ─── 5. answer_key 재구축 ───
function rebuildAnswerKey(questions) {
  return questions.map(q => q.answer);
}

// ─── 6. 재채점 (regrade-all.mjs 기반) ───
async function regradeSheet(sheetId, questions, answerKey) {
  const { data: sheet } = await admin
    .from('naesin_problem_sheets')
    .select('unit_id, mode, category')
    .eq('id', sheetId)
    .single();
  if (!sheet) return { attempts: 0, changed: 0, drafts: 0, draftsChanged: 0 };

  const wrongStage = sheet.category === 'mock_exam' ? 'mockExam' : 'problem';

  // --- Attempts ---
  const { data: attempts } = await admin
    .from('naesin_problem_attempts')
    .select('id, student_id, answers, score, total_questions, wrong_answers')
    .eq('sheet_id', sheetId)
    .order('created_at', { ascending: true });

  let changed = 0;
  for (const attempt of attempts || []) {
    const answers = attempt.answers || [];
    const totalQ = attempt.total_questions;
    let correctCount = 0;
    const wrongAnswers = [];

    for (let i = 0; i < totalQ; i++) {
      const userAnswer = String(answers[i] ?? '');
      const correctAnswer = extractAnswer(answerKey[i]);
      const q = questions[i];
      const isSubjective = !q?.options || q.options.length === 0;

      let isCorrect;
      if (isSubjective) {
        if (q?.subParts) {
          const parts = userAnswer.split(' / ');
          isCorrect = q.subParts.every((sp, j) => {
            const sn = normalize(parts[j]?.trim() ?? '');
            const cands = [sp.answer, ...(sp.acceptedAnswers ?? [])];
            return cands.some(c => normalize(c) === sn);
          });
          // Fallback: 기존 제출은 subParts UI 없이 한 줄로 작성 → 전체 문자열 비교
          if (!isCorrect) {
            const sn = normalize(userAnswer);
            const cands = [correctAnswer, ...(q?.acceptedAnswers ?? [])];
            isCorrect = cands.some(c => normalize(c) === sn);
          }
        } else {
          const sn = normalize(userAnswer);
          const cands = [correctAnswer, ...(q?.acceptedAnswers ?? [])];
          isCorrect = cands.some(c => normalize(c) === sn);
        }
      } else {
        isCorrect = matchMcqAnswer(userAnswer, correctAnswer, q?.options);
        if (!isCorrect && q?.acceptedAnswers?.length) {
          isCorrect = q.acceptedAnswers.some(c => normalize(c) === normalize(userAnswer));
        }
      }

      if (isCorrect) { correctCount++; }
      else { wrongAnswers.push({ number: i + 1, userAnswer: answers[i] ?? '', correctAnswer, question: q?.question }); }
    }

    const newScore = Math.round((correctCount / totalQ) * 100);
    const hasChange = newScore !== attempt.score;
    if (hasChange) {
      changed++;
      console.log(`    시도 ${attempt.id.slice(0,8)}: ${attempt.score}점 → ${newScore}점`);
      // 어떤 문제가 변경되었는지 상세 출력
      const oldWrongs = new Set((attempt.wrong_answers||[]).map(w=>w.number));
      const newWrongs = new Set(wrongAnswers.map(w=>w.number));
      for (const n of newWrongs) {
        if (!oldWrongs.has(n)) {
          const wa = wrongAnswers.find(w=>w.number===n);
          console.log(`      NEW WRONG #${n}: 학생="${wa.userAnswer}" 정답="${wa.correctAnswer}"`);
        }
      }
      for (const n of oldWrongs) {
        if (!newWrongs.has(n)) {
          const wa = (attempt.wrong_answers||[]).find(w=>w.number===n);
          console.log(`      NOW CORRECT #${n}: 학생="${wa.userAnswer}" 정답="${wa.correctAnswer}"`);
        }
      }
    }

    if (!DRY_RUN) {
      await admin.from('naesin_problem_attempts').update({ score: newScore, wrong_answers: wrongAnswers }).eq('id', attempt.id);
      await admin.from('naesin_wrong_answers').delete().eq('student_id', attempt.student_id).eq('sheet_id', sheetId);
      if (wrongAnswers.length > 0) {
        await admin.from('naesin_wrong_answers').insert(wrongAnswers.map((wa) => {
          const idx = wa.number - 1;
          const q = questions[idx];
          return {
            student_id: attempt.student_id, unit_id: sheet.unit_id, stage: wrongStage,
            source_type: sheet.mode, sheet_id: sheetId,
            question_data: { ...wa, ...(q?.options ? { options: q.options } : {}), ...(q?.explanation ? { explanation: q.explanation } : {}), ...(q?.subParts ? { subParts: q.subParts } : {}) },
          };
        }));
      }
    }
  }

  // --- Drafts ---
  const { data: drafts } = await admin
    .from('naesin_problem_drafts')
    .select('id, draft_data')
    .eq('sheet_id', sheetId);

  let draftsChanged = 0;
  for (const draft of drafts || []) {
    const d = draft.draft_data;
    if (!d || d.mode !== 'interactive') continue;
    const answersMap = d.answersMap;
    if (!answersMap || Object.keys(answersMap).length === 0) continue;

    const aiResultsMap = d.aiResultsMap ?? {};
    let correct = 0, wrong = 0;
    const newWrongList = [];

    for (const [idxStr, userAnswer] of Object.entries(answersMap)) {
      const i = Number(idxStr);
      if (i < 0 || i >= answerKey.length) continue;
      const correctAnswer = extractAnswer(answerKey[i]);
      const q = questions[i];
      const isSubjective = !q?.options || q.options.length === 0;

      let isCorrect;
      if (isSubjective) {
        if (q?.subParts) {
          const parts = String(userAnswer).split(' / ');
          isCorrect = q.subParts.every((sp, j) => {
            const sn = normalize(parts[j]?.trim() ?? '');
            return [sp.answer, ...(sp.acceptedAnswers ?? [])].some(c => normalize(c) === sn);
          });
        } else {
          const ai = aiResultsMap[idxStr];
          if (ai && ai.score === 100) { isCorrect = true; }
          else {
            const sn = normalize(String(userAnswer));
            isCorrect = [correctAnswer, ...(q?.acceptedAnswers ?? [])].some(c => normalize(c) === sn);
          }
        }
      } else {
        isCorrect = matchMcqAnswer(String(userAnswer), correctAnswer, q?.options);
        if (!isCorrect && q?.acceptedAnswers?.length) {
          isCorrect = q.acceptedAnswers.some(c => normalize(c) === normalize(String(userAnswer)));
        }
      }

      if (isCorrect) correct++;
      else {
        wrong++;
        newWrongList.push({ number: q?.number ?? i + 1, userAnswer, correctAnswer, question: q?.question ?? '' });
      }
    }

    const oldScore = d.score;
    if (oldScore.correct !== correct || oldScore.wrong !== wrong) {
      draftsChanged++;
      console.log(`    드래프트 ${draft.id.slice(0,8)}: ${oldScore.correct}/${oldScore.wrong} → ${correct}/${wrong}`);
      if (!DRY_RUN) {
        await admin.from('naesin_problem_drafts').update({
          draft_data: { ...d, score: { correct, wrong }, wrongList: newWrongList },
        }).eq('id', draft.id);
      }
    }
  }

  return { attempts: (attempts||[]).length, changed, drafts: (drafts||[]).length, draftsChanged };
}

// ─── Main ───
async function main() {
  console.log('=== 수동태 step2 수정 시작 ===\n');

  // 1. 템플릿 읽기
  const { data: tmpl } = await admin
    .from('naesin_templates')
    .select('id, title, questions, answer_key')
    .eq('id', TEMPLATE_ID)
    .single();

  if (!tmpl) { console.error('템플릿을 찾을 수 없습니다'); return; }

  const questions = JSON.parse(JSON.stringify(tmpl.questions)); // deep copy
  console.log(`템플릿: ${tmpl.title} (${questions.length}문항)\n`);

  // 2. 문제 수정
  console.log('문제 수정:');
  const changeCount = fixQuestions(questions);
  console.log(`\n총 ${changeCount}건 수정\n`);

  // 3. answer_key 재구축
  const newAnswerKey = rebuildAnswerKey(questions);

  // 4. 템플릿 업데이트
  if (!DRY_RUN) {
    console.log('템플릿 업데이트...');
    const { error: tmplErr } = await admin
      .from('naesin_templates')
      .update({ questions, answer_key: newAnswerKey })
      .eq('id', TEMPLATE_ID);
    if (tmplErr) console.error('  템플릿 에러:', tmplErr.message);
    else console.log('  ✓ naesin_templates 업데이트 완료');
  }

  // 5. 복사본 업데이트 + 재채점
  for (const sid of SHEET_IDS) {
    console.log(`\n시트 ${sid.slice(0,8)}...:`);

    if (!DRY_RUN) {
      const { error } = await admin
        .from('naesin_problem_sheets')
        .update({ questions, answer_key: newAnswerKey })
        .eq('id', sid);
      if (error) { console.error('  시트 업데이트 에러:', error.message); continue; }
      console.log('  ✓ 시트 업데이트 완료');
    }

    // 재채점
    const result = await regradeSheet(sid, questions, newAnswerKey);
    console.log(`  재채점: 시도 ${result.attempts}건 (변경 ${result.changed}건), 드래프트 ${result.drafts}건 (변경 ${result.draftsChanged}건)`);
  }

  console.log('\n=== 완료 ===');
}

main().catch(console.error);
