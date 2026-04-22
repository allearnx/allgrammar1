/**
 * 전체 시트 일괄 재채점 스크립트
 * - JSONB 동기화
 * - naesin_wrong_answers stage 정리 + orphan 제거
 * - MCQ acceptedAnswers 체크 포함
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

// === 앱의 normalize-answer.ts와 동일한 로직 ===

const CIRCLED_TO_NUM = { '①': '1', '②': '2', '③': '3', '④': '4', '⑤': '5', '⑥': '6', '⑦': '7', '⑧': '8', '⑨': '9', '⑩': '10' };

function uncircle(s) {
  return s.replace(/[①②③④⑤⑥⑦⑧⑨⑩]+/g, (match) =>
    [...match].map((ch) => CIRCLED_TO_NUM[ch] ?? ch).join(','),
  );
}

function normalize(s) {
  return String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/\.+\s*$/, '')
    .replace(/\s+/g, ' ');
}

function extractAnswer(val) {
  if (val == null) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  if (typeof val === 'object' && 'answer' in val) return String(val.answer ?? '');
  return '';
}

function normalizeMultiSelect(s) {
  const parts = s.split(',').map((v) => v.trim());
  if (parts.length <= 1) return s.trim().toLowerCase();
  if (parts.every((p) => /^\d+$/.test(p))) {
    return parts.sort((a, b) => Number(a) - Number(b)).join(', ');
  }
  return parts.map((p) => p.toLowerCase()).sort().join(', ');
}

function matchMcqAnswer(userAnswer, correctAnswer, options) {
  const uPlain = uncircle(userAnswer).trim().toLowerCase();
  const cPlain = uncircle(correctAnswer).trim().toLowerCase();
  if (uPlain === cPlain) return true;
  if (cPlain.includes(',') || uPlain.includes(',')) {
    if (normalizeMultiSelect(uPlain) === normalizeMultiSelect(cPlain)) return true;
  }
  if (!options || options.length === 0) return false;
  const idx = parseInt(uPlain, 10);
  if (!isNaN(idx) && idx >= 1 && idx <= options.length) {
    if (options[idx - 1].trim().toLowerCase() === cPlain) return true;
  }
  const cidx = parseInt(cPlain, 10);
  if (!isNaN(cidx) && cidx >= 1 && cidx <= options.length) {
    if (options[cidx - 1].trim().toLowerCase() === uPlain) return true;
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
    .eq('sheet_id', sheetId)
    .order('created_at', { ascending: true });

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
        // acceptedAnswers 체크 (정답처리된 답도 정답으로 인정)
        if (!isCorrect && questions[i]?.acceptedAnswers?.length > 0) {
          const studentNorm = normalize(userAnswer);
          isCorrect = questions[i].acceptedAnswers.some((c) => normalize(c) === studentNorm);
        }
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

    // 오답 테이블 항상 동기화
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
  console.log('전체 시트 일괄 재채점 시작...\n');

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
