/**
 * 수동태 Step3 — 고아 시트 933bcd0f (템플릿 삭제됨, 시도 0건, 재채점 불필요).
 *   node scripts/fix-sudongtae-step3.mjs [--apply]
 *
 * 삭제: Q1 (보기 배열이 컬럼 단위로 파손돼 원본 없이 복원 불가) → 번호 재정리 + answer_key[0] 제거
 * 재구성: Q29 (지문 ⓐ~ⓔ와 선지 ①~⑤가 한 options에 뭉침) → 지문은 question으로, 선지 5개만 options
 * 한글복원: Q30·Q31·Q32·Q53·Q54 깨진 지시문
 * 일괄: 페이지번호 아티팩트(?NN)) 전체 제거 (Q30~Q48)
 * 정답처리: Q53 (②·⑤ 둘 다 올바른 전환) acceptedAnswers ["5"]
 * 해설: Q49~Q54 플레이스홀더 → 실제 해설
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_0-9]+)=(.*)$/); if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, '');
}
const APPLY = process.argv.includes('--apply');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const SHEET_ID = '933bcd0f-30f2-4972-88b7-3a7509133530';

const EXPL = {
  49: "⑤ find의 과거분사는 'found'인데 'founded'(설립하다)로 잘못 써서 어색하다. 나머지는 올바른 수동태 전환이다.",
  50: "⑤ 'may forget'(현재·미래 추측)을 'was forgotten'(과거)으로 바꿔 시제·의미가 달라졌다. 나머지는 능동·수동 의미가 같다.",
  51: "④ grow의 과거분사는 'grown'인데 'weren't grow'로 잘못 써서 어색하다. 나머지는 올바른 수동태 전환이다.",
  52: "⑤ 'call O C'(5형식)의 수동태는 'He was called Jack by us'인데 'Jack was called him'으로 잘못 전환되어 어색하다.",
  53: "능동태를 수동태로 바르게 바꾼 것은 ② 'English is spoken in New Zealand.'와 ⑤ 'The window was broken by my little brother.'이다.",
  54: "③ stop의 과거분사는 'stopped'인데 'was stop'으로 써서 어색하다. 나머지는 올바른 수동태 문장이다.",
};

function applyEdits(questions, answerKey, warns) {
  const log = []; const byNum = (n) => questions.find((q) => q.number === n);
  const rep = (q, from, to, lab) => { if (!q) { warns.push(`⚠ ${lab}:문항없음`); return; } const b = q.question; q.question = b.split(from).join(to); if (b === q.question) warns.push(`⚠ ${lab}:"${from.slice(0,16)}" 미발견`); else log.push(lab); };

  // 한글 복원
  rep(byNum(30), '어떤상 역채를 것의 중 개수는?', '어법상 어색한 문장의 개수는?', 'Q30 한글');
  rep(byNum(31), '어법상 올은 문장의 중 개수는?', '어법상 옳은 문장의 개수는?', 'Q31 한글');
  rep(byNum(32), '어법상 올은 문장의 중 개수는?', '어법상 옳은 문장의 개수는?', 'Q32 한글');
  rep(byNum(53), '수동태로 바꾸게 바꾼 것 중에 잘지어진 것은?', '수동태로 바르게 바꾼 것은?', 'Q53 한글');
  rep(byNum(54), '어색한 어색한 것은?', '어색한 것은?', 'Q54 한글');

  // Q29 재구성: 지문 ⓐ~ⓔ → question, 선지 ①~⑤만 options
  { const q = byNum(29);
    if (q.options && q.options.length === 10) {
      const sentences = q.options.slice(0, 5);
      const choices = q.options.slice(5).map((o) => o.replace(/^[①②③④⑤]\s*/, '').trim());
      q.question = q.question + '\n' + sentences.join('\n');
      q.options = choices; log.push('Q29 지문/선지 분리');
    } else warns.push('⚠ Q29: options 10개 아님');
  }

  // Q53 acceptedAnswers
  { const q = byNum(53); q.acceptedAnswers = ['5']; log.push('Q53 acceptedAnswers["5"]'); }

  // 해설 교정
  for (const n of [49, 50, 51, 52, 53, 54]) { const q = byNum(n); if (q) q.explanation = EXPL[n]; }
  log.push('Q49~54 해설 교정');

  // 페이지번호 아티팩트 일괄 제거 (?NN) / .NN))
  let pageStripped = 0;
  for (const q of questions) { const b = q.question || ''; const a = b.replace(/([?.])\s*\d{2,3}\)/g, '$1'); if (a !== b) { q.question = a; pageStripped++; } }
  log.push(`페이지번호 제거 ${pageStripped}문항`);

  // Q1 삭제 + 번호 재정리 + answer_key[0] 제거
  if (questions[0].number !== 1) warns.push('⚠ questions[0]이 Q1 아님 — 삭제 보류'); else {
    const kept = questions.filter((q) => q.number !== 1);
    for (const q of kept) q.number -= 1;
    answerKey.splice(0, 1);
    log.push(`Q1 삭제 (${questions.length}→${kept.length}), answer_key[0] 제거`);
    return { questions: kept, log };
  }
  return { questions, log };
}

async function run() {
  const { data, error } = await sb.from('naesin_problem_sheets').select('questions, answer_key').eq('id', SHEET_ID).single();
  if (error) { console.error(error); process.exit(1); }
  writeFileSync(new URL('../scripts/sudongtae-step3-backup.json', import.meta.url), JSON.stringify(data, null, 2));
  const warns = []; const { questions: newQ, log } = applyEdits(data.questions, data.answer_key, warns);
  console.log(`[sheet 933bcd0f] 수정:`); log.forEach((l) => console.log('   -', l)); warns.forEach((w) => console.log('  ', w));
  console.log(`   결과: questions=${newQ.length}, answer_key=${data.answer_key.length}`);
  if (APPLY) {
    const { error: e } = await sb.from('naesin_problem_sheets').update({ questions: newQ, answer_key: data.answer_key }).eq('id', SHEET_ID);
    if (e) { console.error(e); process.exit(1); } console.log('   ✓ 저장됨');
  } else console.log('\n[dry-run] --apply 로 적용');
  console.log('백업: scripts/sudongtae-step3-backup.json');
}
await run();
