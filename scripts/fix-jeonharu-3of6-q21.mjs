/**
 * 전하루 3/6 시트 소급 정정 — 8/30 시도(0126d675)의 Q21 "had been study"만 오답으로 반영 (87→83).
 * 배경: isSubstringMatch가 문자열 접두사 비교라 "study"≈"studying"으로 정답 처리됐던 구멍(0b34973 수정).
 * - Q16은 시도 이후 문항이 교체됐으므로(당시엔 정답) 건드리지 않는다 — 전면 재채점 금지.
 * - 8/31 만점 시도(15e3c413)는 Q21을 "had been studying"으로 맞게 써서 100점 정당 — 무변경.
 * - 오답노트(naesin_wrong_answers)는 최신 시도(만점) 기준 0행이 맞으므로 무변경.
 *   node scripts/fix-jeonharu-3of6-q21.mjs [--apply]
 */
import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';
const APPLY = process.argv.includes('--apply');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const SID = '1265b36f-c01c-4c48-b3ee-55eda9dd1a54';         // 전하루
const SHEET = '688aec02-902c-4e14-acb8-fb743fef3950';       // 1과 문법 (3/6)
const ATTEMPT = '0126d675';                                  // 8/30 시도 (87점)
const QN = 21, CORRECT = 'had been studying';

const { data: sheet } = await sb.from('naesin_problem_sheets').select('id,questions').eq('id', SHEET).single();
const q = sheet.questions[QN - 1];
if (q.answer !== CORRECT) throw new Error(`Q21 정답 불일치: ${q.answer}`);

const { data: atts } = await sb.from('naesin_problem_attempts').select('*').eq('student_id', SID).eq('sheet_id', SHEET);
const at = atts.find(a => a.id.startsWith(ATTEMPT));
if (!at) throw new Error('대상 시도 없음');

writeFileSync(new URL('./backups/jeonharu-3of6-q21-backup-20260901.json', import.meta.url),
  JSON.stringify({ attempt: at }, null, 1));

const ua = String(at.answers[QN - 1] ?? '');
if (ua.trim().toLowerCase() !== 'had been study') throw new Error(`Q21 학생답 예상과 다름: "${ua}"`);
if ((at.wrong_answers ?? []).some(w => w.number === QN)) { console.log('이미 반영됨 — 종료'); process.exit(0); }

const correctCnt = Math.round(at.score / 100 * at.total_questions) - 1;   // 26 → 25
const newScore = Math.round(correctCnt / at.total_questions * 100);       // 83
const newWrongs = [...(at.wrong_answers ?? []), { number: QN, userAnswer: at.answers[QN - 1], correctAnswer: CORRECT, question: q.question }]
  .sort((a, b) => a.number - b.number);
console.log(`${at.id.slice(0,8)} (${at.created_at.slice(0,10)}): ${at.score} → ${newScore} | 오답 ${at.wrong_answers?.length ?? 0} → ${newWrongs.length}건 (기존: Q${(at.wrong_answers??[]).map(w=>w.number).join(',Q')})`);
if (APPLY) {
  const { error } = await sb.from('naesin_problem_attempts').update({ score: newScore, wrong_answers: newWrongs }).eq('id', at.id);
  if (error) throw error;
  console.log('✓ 적용 완료');
} else console.log('[dry-run] --apply로 실행하면 반영됩니다');
