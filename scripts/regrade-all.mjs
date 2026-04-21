/**
 * 전체 시트 일괄 재채점 스크립트
 * - JSONB 동기화
 * - naesin_wrong_answers stage 정리 + orphan 제거
 *
 * 실행: node scripts/regrade-all.mjs
 */
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceKey) {
  console.error('Missing SUPABASE env vars');
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// normalize / matchMcqAnswer / extractAnswer — inline simplified versions
function normalize(s) {
  return String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s\u00A0]+/g, ' ')
    .replace(/[''ʼ`]/g, "'")
    .replace(/[""]/g, '"')
    .replace(/\s*([.,!?;:])\s*/g, '$1 ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractAnswer(val) {
  if (val && typeof val === 'object' && 'answer' in val) return String(val.answer);
  return String(val ?? '');
}

function matchMcqAnswer(userAnswer, correctAnswer, options) {
  const uNorm = normalize(userAnswer);
  const cNorm = normalize(correctAnswer);
  if (uNorm === cNorm) return true;
  // number-based matching
  const uNum = parseInt(userAnswer, 10);
  const cNum = parseInt(correctAnswer, 10);
  if (!isNaN(uNum) && !isNaN(cNum)) return uNum === cNum;
  // option text matching
  if (options && options.length > 0) {
    const cIdx = !isNaN(cNum) ? cNum - 1 : -1;
    if (cIdx >= 0 && cIdx < options.length && normalize(options[cIdx]) === uNorm) return true;
    const uIdx = !isNaN(uNum) ? uNum - 1 : -1;
    if (uIdx >= 0 && uIdx < options.length && normalize(options[uIdx]) === cNorm) return true;
  }
  return false;
}

async function regradeSheet(sheetId) {
  const { data: sheet } = await admin
    .from('naesin_problem_sheets')
    .select('id, unit_id, answer_key, questions, mode, category')
    .eq('id', sheetId)
    .single();

  if (!sheet) return { total: 0, changed: 0 };

  const wrongStage = sheet.category === 'mock_exam' ? 'mockExam' : 'problem';

  const { data: attempts } = await admin
    .from('naesin_problem_attempts')
    .select('id, student_id, answers, score, total_questions, wrong_answers')
    .eq('sheet_id', sheetId);

  if (!attempts || attempts.length === 0) return { total: 0, changed: 0 };

  const answerKey = sheet.answer_key || [];
  const questions = sheet.questions || [];
  let changed = 0;

  for (const attempt of attempts) {
    const answers = attempt.answers || [];
    const totalQuestions = attempt.total_questions;
    let correctCount = 0;
    const wrongAnswers = [];

    for (let i = 0; i < totalQuestions; i++) {
      const userAnswer = String(answers[i] ?? '');
      const correctAnswer = extractAnswer(answerKey[i]);
      const isSubjective = !questions[i]?.options || questions[i].options.length === 0;

      let isCorrect;
      if (isSubjective) {
        const studentNorm = normalize(userAnswer);
        const candidates = [correctAnswer, ...(questions[i]?.acceptedAnswers ?? [])];
        isCorrect = candidates.some((c) => normalize(c) === studentNorm);
      } else {
        isCorrect = matchMcqAnswer(userAnswer, correctAnswer, questions[i]?.options);
      }

      if (isCorrect) {
        correctCount++;
      } else {
        wrongAnswers.push({
          number: i + 1,
          userAnswer: answers[i] ?? '',
          correctAnswer,
          question: questions[i]?.question,
        });
      }
    }

    const newScore = Math.round((correctCount / totalQuestions) * 100);
    const oldWrongNums = (attempt.wrong_answers ?? []).map((w) => w.number).sort((a, b) => a - b).join(',');
    const newWrongNums = wrongAnswers.map((w) => w.number).sort((a, b) => a - b).join(',');
    const hasChange = newScore !== attempt.score || oldWrongNums !== newWrongNums;

    // JSONB 항상 동기화
    await admin
      .from('naesin_problem_attempts')
      .update({ score: newScore, wrong_answers: wrongAnswers })
      .eq('id', attempt.id);

    if (hasChange) changed++;

    // ��답 테이��� 항상 동기화
    await admin
      .from('naesin_wrong_answers')
      .delete()
      .eq('student_id', attempt.student_id)
      .eq('sheet_id', sheetId);

    if (wrongAnswers.length > 0) {
      const wrongRows = wrongAnswers.map((wa) => {
        const idx = wa.number - 1;
        const q = questions[idx];
        return {
          student_id: attempt.student_id,
          unit_id: sheet.unit_id,
          stage: wrongStage,
          source_type: sheet.mode,
          question_data: {
            ...wa,
            ...(q?.options ? { options: q.options } : {}),
            ...(q?.explanation ? { explanation: q.explanation } : {}),
            ...(q?.subParts ? { subParts: q.subParts } : {}),
          },
          sheet_id: sheetId,
        };
      });
      await admin.from('naesin_wrong_answers').insert(wrongRows);
    }
  }

  return { total: attempts.length, changed };
}

// Main
async function main() {
  console.log('전��� 시트 일괄 재채점 시작...\n');

  const { data: sheetRows } = await admin
    .from('naesin_problem_attempts')
    .select('sheet_id');

  const sheetIds = [...new Set((sheetRows || []).map((r) => r.sheet_id))];
  console.log(`시도가 있는 시트: ${sheetIds.length}개\n`);

  let totalAttempts = 0;
  let totalChanged = 0;
  let errors = 0;

  for (let i = 0; i < sheetIds.length; i++) {
    try {
      const result = await regradeSheet(sheetIds[i]);
      totalAttempts += result.total;
      totalChanged += result.changed;
      if (result.changed > 0) {
        console.log(`  [${i + 1}/${sheetIds.length}] ${sheetIds[i]} → ${result.total}건 중 ${result.changed}건 변경`);
      }
    } catch (e) {
      errors++;
      console.error(`  [${i + 1}/${sheetIds.length}] ${sheetIds[i]} → ERROR: ${e.message}`);
    }
  }

  console.log(`\n완료!`);
  console.log(`  시트: ${sheetIds.length}개`);
  console.log(`  시도: ${totalAttempts}건`);
  console.log(`  변경: ${totalChanged}건`);
  if (errors > 0) console.log(`  에러: ${errors}건`);
}

main().catch(console.error);
