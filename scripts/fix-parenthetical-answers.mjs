/**
 * 서술형 정답 괄호 대안 분리 — DB 일괄 패치
 *
 * 문제: PDF 추출 시 정답에 괄호 대안이 통째로 저장됨.
 *   예: "She is not a famous singer. (She isn't a famous singer.)"
 *   학생이 "She is not a famous singer." 입력 → 전체 문자열 불일치 → 오답
 *
 * 처리:
 *   - Pattern 1: 끝 괄호 대안  "Main text. (Alternative)"
 *   - Pattern 2: 인라인 또는    "...isn't (또는 is not)..."
 *   - 제외: 번호 패턴 "(1)", "(2)" 등
 *
 * 사용법:
 *   node scripts/fix-parenthetical-answers.mjs --dry-run   # 변경 내역만 출력
 *   node scripts/fix-parenthetical-answers.mjs              # 실제 DB 업데이트 + 재채점
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const DRY_RUN = process.argv.includes('--dry-run');

// ─── 정규화 (normalize-answer.ts와 동일) ───
function normalize(s) {
  return s
    .trim()
    .toLowerCase()
    .replace(/\.+\s*$/, '')
    .replace(/\s+/g, ' ');
}

function extractAnswer(val) {
  if (val == null) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  if (typeof val === 'object' && 'answer' in val) {
    return String(val.answer ?? '');
  }
  return '';
}

// ─── 괄호 패턴 파싱 ───

/** 번호 매기기 패턴인지 확인: "(1) ...", "(2) ..." */
function isNumberedPattern(answer) {
  return /^\(\d+\)/.test(answer.trim());
}

/** 한글이 포함된 텍스트인지 확인 */
function containsKorean(text) {
  return /[\u3131-\uD79D]/.test(text);
}

/** 주로 영어 문장인지 확인 (Latin 문자가 다수) */
function isPrimarilyEnglish(text) {
  const latin = (text.match(/[a-zA-Z]/g) || []).length;
  return latin >= 3;
}

/**
 * 끝 괄호 대안 패턴:
 *   "She is not a famous singer. (She isn't a famous singer.)"
 *   → main: "She is not a famous singer."
 *   → alt:  "She isn't a famous singer."
 *
 * 여러 줄(줄바꿈)이 있으면 각 줄별로 처리.
 */
function parseTrailingParenthetical(answer) {
  // 줄바꿈이 있으면 각 줄별로 처리
  if (answer.includes('\n')) {
    const lines = answer.split('\n');
    let anyChanged = false;
    const mainLines = [];
    const alternatives = [];

    for (const line of lines) {
      const result = parseSingleLineTrailing(line);
      if (result) {
        anyChanged = true;
        mainLines.push(result.main);
        alternatives.push(...result.alternatives);
      } else {
        mainLines.push(line);
      }
    }

    if (!anyChanged) return null;
    return { main: mainLines.join('\n'), alternatives };
  }

  return parseSingleLineTrailing(answer);
}

function parseSingleLineTrailing(line) {
  // 괄호 안에 문장이 있는 끝 괄호 패턴
  // 예: "Main text. (Alternative text.)"  또는  "Main text (Alternative text)"
  const match = line.match(/^(.+?)\s*\(([^()]+)\)\s*$/);
  if (!match) return null;

  const mainPart = match[1].trim();
  const altPart = match[2].trim();

  // 번호 패턴 제외: alt가 숫자만이면 스킵 (예: "answer (1)")
  if (/^\d+$/.test(altPart)) return null;

  // alt가 너무 짧으면 (1~2글자) 의미 있는 대안이 아닐 수 있음 → 스킵
  if (altPart.length <= 2) return null;

  // 한글 주석/라벨 제외: "(형용사)", "(모든 학생들이...)" 등은 대안이 아님
  if (containsKorean(altPart)) return null;

  // 대안이 영어 문장이어야 함 (Latin 문자 최소 3개)
  if (!isPrimarilyEnglish(altPart)) return null;

  return { main: mainPart, alternatives: [altPart] };
}

/**
 * 인라인 또는 패턴:
 *   "No, he isn't (또는 he is not). He is a vet."
 *   → main: "No, he isn't. He is a vet."
 *   → alt:  "No, he is not. He is a vet."
 *
 * 대안 텍스트의 첫 단어가 앞 문맥에 이미 있으면 해당 위치부터 교체 (중복 방지).
 *   예: "he isn't (또는 he is not)" → "he is not"  (isn't→is not이 아닌 he isn't→he is not)
 */
function parseInlineAlternative(answer) {
  const testRegex = /\(또는\s+[^)]+\)/g;
  if (!testRegex.test(answer)) return null;

  // 메인 답: (또는 ...) 부분 제거
  const main = answer.replace(/\s*\(또는\s+[^)]+\)/g, '');

  // 대안 답: 각 (또는 X) 에 대해 앞 문맥과 겹치는 부분을 고려하여 교체
  const matchRegex = /\(또는\s+([^)]+)\)/g;
  const matches = [];
  let m;
  while ((m = matchRegex.exec(answer)) !== null) {
    matches.push({
      fullMatch: m[0],
      altText: m[1].trim(),
      index: m.index,
    });
  }

  let alt = answer;

  // 뒤에서부터 처리 (인덱스 유지)
  for (let i = matches.length - 1; i >= 0; i--) {
    const { fullMatch, altText, index } = matches[i];
    const before = alt.substring(0, index).trimEnd();
    const after = alt.substring(index + fullMatch.length);

    const beforeWords = before.split(/\s+/);
    const altWords = altText.split(/\s+/);
    const altFirstWord = altWords[0].toLowerCase();

    // 앞 문맥에서 대안 첫 단어와 일치하는 위치 탐색 (최대 4단어 뒤로)
    let replaceFrom = beforeWords.length - 1; // 기본: 바로 앞 단어만 교체
    for (let j = beforeWords.length - 2; j >= Math.max(0, beforeWords.length - 4); j--) {
      if (beforeWords[j].toLowerCase() === altFirstWord) {
        replaceFrom = j;
        break;
      }
    }

    // 축약형 처리: "is not (또는 isn't)" → "isn't"가 "is not" 2단어를 대체
    // 대안이 축약형(1단어 + 아포스트로피)인데 overlap이 없으면, 앞 2단어 교체 시도
    if (replaceFrom === beforeWords.length - 1 && altWords.length === 1 && altText.includes("'")) {
      // 축약형은 보통 2단어를 대체 (is not → isn't, are not → aren't, etc.)
      if (beforeWords.length >= 2) {
        replaceFrom = beforeWords.length - 2;
      }
    }

    const keepWords = beforeWords.slice(0, replaceFrom);
    const spacer = keepWords.length > 0 ? ' ' : '';
    alt = keepWords.join(' ') + spacer + altText + after;
  }

  return { main: main.trim(), alternatives: [alt.trim()] };
}

/**
 * 메인 파서: 답 문자열에서 괄호 대안을 분리
 */
function parseAnswer(answer) {
  if (typeof answer !== 'string') return null;
  if (!answer.includes('(')) return null;
  if (isNumberedPattern(answer)) return null;

  // Pattern 2 먼저 (인라인 또는) — 더 구체적
  const inlineResult = parseInlineAlternative(answer);
  if (inlineResult) return inlineResult;

  // Pattern 1: 끝 괄호 대안
  const trailingResult = parseTrailingParenthetical(answer);
  if (trailingResult) return trailingResult;

  return null;
}

// ─── DB 처리 ───

/**
 * 테이블의 questions + answer_key를 수정
 * 반환: 변경된 row들의 id 배열
 */
async function processTable(table, isSheet) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ${table}`);
  console.log('='.repeat(60));

  const { data: rows, error } = await sb
    .from(table)
    .select('id, title, questions, answer_key');

  if (error) {
    console.error(`  조회 실패: ${error.message}`);
    return [];
  }

  const changedIds = [];
  let totalFixed = 0;

  for (const row of rows) {
    const questions = row.questions;
    const answerKey = row.answer_key;
    if (!Array.isArray(questions) || !Array.isArray(answerKey)) continue;

    let rowChanged = false;
    const fixedQuestions = [...questions];
    const fixedAnswerKey = [...answerKey];

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q || typeof q.answer !== 'string') continue;

      // 객관식 스킵 (options가 있으면)
      if (q.options && q.options.length > 0) continue;

      const parsed = parseAnswer(q.answer);
      if (!parsed) continue;

      // 기존 acceptedAnswers 보존 + 새 대안 병합
      const existingAccepted = q.acceptedAnswers ?? [];
      const newAlternatives = parsed.alternatives.filter(
        (alt) => !existingAccepted.some((ea) => normalize(ea) === normalize(alt)),
      );
      // 원래 정답도 대안에 추가 (정답이 바뀌므로)
      const originalAnswer = q.answer;
      const allAccepted = [...existingAccepted, ...newAlternatives];
      // 새 메인 정답이 원래 acceptedAnswers에 이미 있으면 제거
      const finalAccepted = allAccepted
        .filter((a) => normalize(a) !== normalize(parsed.main))
        .concat(
          // 원래 전체 문자열도 대안으로 보존 (혹시 그대로 입력한 학생 대비)
          normalize(originalAnswer) !== normalize(parsed.main)
            ? [originalAnswer]
            : [],
        );
      // 중복 제거
      const uniqueAccepted = [...new Set(
        finalAccepted.map((a) => a.trim()),
      )].filter((a) => a.length > 0);

      console.log(`\n  [${row.title}] Q${q.number ?? i + 1}:`);
      console.log(`    전: "${q.answer}"`);
      console.log(`    후: "${parsed.main}"`);
      console.log(`    대안: ${JSON.stringify(uniqueAccepted)}`);

      fixedQuestions[i] = {
        ...q,
        answer: parsed.main,
        acceptedAnswers: uniqueAccepted,
      };

      // answer_key 동기화
      if (i < answerKey.length) {
        const akEntry = answerKey[i];
        if (typeof akEntry === 'object' && akEntry !== null && 'answer' in akEntry) {
          fixedAnswerKey[i] = { ...akEntry, answer: parsed.main };
        } else if (typeof akEntry === 'string') {
          fixedAnswerKey[i] = parsed.main;
        }
      }

      rowChanged = true;
      totalFixed++;
    }

    if (rowChanged) {
      changedIds.push(row.id);

      if (!DRY_RUN) {
        const { error: upErr } = await sb
          .from(table)
          .update({ questions: fixedQuestions, answer_key: fixedAnswerKey })
          .eq('id', row.id);

        if (upErr) {
          console.error(`  업데이트 실패 [${row.title}]: ${upErr.message}`);
        } else {
          console.log(`  ✓ 업데이트 완료: ${row.title}`);
        }
      }
    }
  }

  console.log(`\n  총 ${totalFixed}개 문항 수정 (${changedIds.length}개 행)`);
  return isSheet ? changedIds : [];
}

/**
 * 영향받은 시트 재채점
 * regrade-sheet.ts 로직을 인라인으로 재구현 (ESM 스크립트이므로 직접 import 불가)
 */
async function regradeSheet(sheetId) {
  const { data: sheet } = await sb
    .from('naesin_problem_sheets')
    .select('id, unit_id, answer_key, questions, mode')
    .eq('id', sheetId)
    .single();

  if (!sheet) return { total: 0, changed: 0 };

  const { data: attempts } = await sb
    .from('naesin_problem_attempts')
    .select('id, student_id, answers, score, total_questions, wrong_answers')
    .eq('sheet_id', sheetId);

  if (!attempts || attempts.length === 0) return { total: 0, changed: 0 };

  const answerKey = sheet.answer_key;
  const questions = sheet.questions;
  let changed = 0;

  for (const attempt of attempts) {
    const answers = attempt.answers;
    const totalQuestions = attempt.total_questions;
    let correctCount = 0;
    const wrongAnswers = [];

    for (let i = 0; i < totalQuestions; i++) {
      const userAnswer = String(answers[i] ?? '');
      const correctAnswer = extractAnswer(answerKey[i]);
      const q = questions?.[i];
      const isSubjective = !q?.options || q.options.length === 0;

      let isCorrect;
      if (isSubjective) {
        const studentNorm = normalize(userAnswer);
        const candidates = [correctAnswer, ...(q?.acceptedAnswers ?? [])];
        isCorrect = candidates.some((c) => normalize(c) === studentNorm);
      } else {
        // 객관식: 직접 비교
        isCorrect = userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
        if (!isCorrect && q?.options?.length > 0) {
          const idx = parseInt(userAnswer, 10);
          if (!isNaN(idx) && idx >= 1 && idx <= q.options.length) {
            isCorrect = q.options[idx - 1].trim().toLowerCase() === correctAnswer.trim().toLowerCase();
          }
          if (!isCorrect) {
            const cidx = parseInt(correctAnswer, 10);
            if (!isNaN(cidx) && cidx >= 1 && cidx <= q.options.length) {
              isCorrect = q.options[cidx - 1].trim().toLowerCase() === userAnswer.trim().toLowerCase();
            }
          }
        }
      }

      if (isCorrect) {
        correctCount++;
      } else {
        wrongAnswers.push({
          number: i + 1,
          userAnswer: answers[i] ?? '',
          correctAnswer,
          question: q?.question,
        });
      }
    }

    const newScore = Math.round((correctCount / totalQuestions) * 100);

    const oldWrongNums = (attempt.wrong_answers ?? [])
      .map((w) => w.number).sort((a, b) => a - b).join(',');
    const newWrongNums = wrongAnswers
      .map((w) => w.number).sort((a, b) => a - b).join(',');
    const hasChange = newScore !== attempt.score || oldWrongNums !== newWrongNums;

    if (hasChange) {
      changed++;

      await sb
        .from('naesin_problem_attempts')
        .update({ score: newScore, wrong_answers: wrongAnswers })
        .eq('id', attempt.id);

      await sb
        .from('naesin_wrong_answers')
        .delete()
        .eq('student_id', attempt.student_id)
        .eq('unit_id', sheet.unit_id)
        .eq('stage', 'problem')
        .eq('sheet_id', sheetId);

      if (wrongAnswers.length > 0) {
        const wrongRows = wrongAnswers.map((wa) => {
          const idx = wa.number - 1;
          const q = questions?.[idx];
          return {
            student_id: attempt.student_id,
            unit_id: sheet.unit_id,
            stage: 'problem',
            source_type: sheet.mode,
            question_data: {
              ...wa,
              ...(q?.options ? { options: q.options } : {}),
              ...(q?.explanation ? { explanation: q.explanation } : {}),
            },
            sheet_id: sheetId,
          };
        });
        await sb.from('naesin_wrong_answers').insert(wrongRows);
      }
    }
  }

  return { total: attempts.length, changed };
}

// ─── 메인 ───

console.log(DRY_RUN ? '🔍 DRY-RUN 모드 (변경 없음)\n' : '🔧 실행 모드\n');

// 1. 템플릿 수정
await processTable('naesin_templates', false);

// 2. 시트 수정
const changedSheetIds = await processTable('naesin_problem_sheets', true);

// 3. 재채점
if (!DRY_RUN && changedSheetIds.length > 0) {
  console.log(`\n${'='.repeat(60)}`);
  console.log('  재채점');
  console.log('='.repeat(60));

  let totalAttempts = 0;
  let totalChanged = 0;

  for (const sheetId of changedSheetIds) {
    const { total, changed } = await regradeSheet(sheetId);
    totalAttempts += total;
    totalChanged += changed;
    if (changed > 0) {
      console.log(`  시트 ${sheetId}: ${changed}/${total}건 점수 변경`);
    }
  }

  console.log(`\n  재채점 완료: ${totalChanged}/${totalAttempts}건 변경`);
} else if (DRY_RUN && changedSheetIds.length > 0) {
  console.log(`\n  재채점 대상 시트: ${changedSheetIds.length}개`);
}

console.log('\n✅ 완료');
