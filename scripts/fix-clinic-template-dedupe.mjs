/**
 * 관계부사=전치사+관계대명사 집중훈련(b4642997) — 내신 시트와 완전히 같은 예문 5문항 교체 (2026-09-17).
 * 사장님 원칙: 기본기/내신 유형/예상(쌍둥이)/기출은 성격이 다르고, 겹쳐도 되지만 같은 문항이면 안 됨.
 * 관계부사 Step1과 겹친 house/town where I was born, This is the restaurant, I'll never forget the day 교체.
 *   node scripts/fix-clinic-template-dedupe.mjs [--apply]
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) { const m = line.match(/^([A-Z_0-9]+)=(.*)$/); if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, ''); }
const APPLY = process.argv.includes('--apply');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const ID = 'b4642997-340d-4fe1-9507-65601bef0793';

const EDITS = {
  11: (q) => { q.options = [
    'This is the gym where my brother works out in.',
    'This is the gym where my brother works out.',
    'This is the gym in which my brother works out.',
    'This is the gym which my brother works out in.',
    'This is the gym that my brother works out in.',
  ]; q.answer = '1'; },
  20: (q) => { q.options = [
    'The park which my uncle jogs is quiet.',
    'The park where my uncle jogs in is quiet.',
    'The park in which my uncle jogs is quiet.',
    'The park that my uncle jogs in is quiet.',
    'The park how my uncle jogs is quiet.',
  ]; q.answer = '3, 4';
    q.explanation = "jog은 자동사라 장소를 붙이려면 전치사 in이 필요하다. ①은 전치사가 없어 불완전하고 ②는 where와 in이 중복, ⑤는 how가 어색하다. ③(in which)과 ④(that ... in)만 올바르다."; },
  21: (q) => { q.question = '다음 두 문장을 관계부사를 사용하여 한 문장으로 쓰시오.\n\n• This is the bakery.\n• We bought fresh bread there yesterday.';
    q.answer = 'This is the bakery where we bought fresh bread yesterday.'; q.acceptedAnswers = ['This is the bakery where we bought fresh bread yesterday']; },
  22: (q) => { q.question = '다음 두 문장을 <조건>에 맞게 한 문장으로 쓰시오.\n\n• This is the bakery.\n• We bought fresh bread there yesterday.\n\n<조건> in which를 반드시 사용할 것';
    q.answer = 'This is the bakery in which we bought fresh bread yesterday.'; q.acceptedAnswers = ['This is the bakery in which we bought fresh bread yesterday']; },
  24: (q) => { q.question = '다음 두 문장을 관계부사 when을 사용하여 한 문장으로 쓰시오.\n\n• I still remember the morning.\n• We moved to Busan on that morning.';
    q.answer = 'I still remember the morning when we moved to Busan.'; q.acceptedAnswers = ['I still remember the morning when we moved to Busan']; },
  25: (q) => { q.question = '다음 두 문장을 <조건>에 맞게 한 문장으로 쓰시오.\n\n• I still remember the morning.\n• We moved to Busan on that morning.\n\n<조건> on which를 반드시 사용할 것';
    q.answer = 'I still remember the morning on which we moved to Busan.'; q.acceptedAnswers = ['I still remember the morning on which we moved to Busan']; },
  23: (q) => { q.question = '다음 문장을 <보기>와 같이 "관계대명사(that)+전치사" 형태로 바꿔 쓰시오.\n\n<보기> This is the room where he studies.\n→ This is the room that he studies in.\n\nThis is the library where I do my homework.'; },
  28: (q) => { q.question = '다음 우리말과 일치하도록 주어진 단어를 배열하여 영작하시오.\n\n이것은 내 삼촌이 일하는 공장이다.\n(factory, where, works, uncle, my, this, the, is)';
    q.answer = 'This is the factory where my uncle works.'; q.acceptedAnswers = ['This is the factory where my uncle works']; },
  29: (q) => { q.question = '다음 우리말과 일치하도록 주어진 단어를 배열하여 영작하시오. (전치사+관계대명사를 사용할 것)\n\n이것은 내 삼촌이 일하는 공장이다.\n(factory, in, which, works, uncle, my, this, the, is)';
    q.answer = 'This is the factory in which my uncle works.'; q.acceptedAnswers = ['This is the factory in which my uncle works']; },
};

const { data: t } = await sb.from('naesin_templates').select('questions, answer_key').eq('id', ID).single();
writeFileSync(new URL('../scripts/backups/clinic-template-dedupe-backup.json', import.meta.url), JSON.stringify(t, null, 1));
const qs = t.questions; const ak = [...t.answer_key];
for (const [n, fn] of Object.entries(EDITS)) {
  const i = qs.findIndex((q) => q.number === Number(n));
  if (i < 0) throw new Error('없는 문항 ' + n);
  fn(qs[i]); ak[i] = qs[i].answer;
  console.log(`#${n} 교체 → 정답 ${JSON.stringify(qs[i].answer)}`);
}
// 겹침 재검사
const norm = (s) => s.toLowerCase().replace(/<\/?u>/g, '').replace(/[’‘]/g, "'").replace(/_{2,}/g, '_').replace(/[^a-z0-9'_ ]/g, ' ').replace(/\s+/g, ' ').trim();
const sentences = (q) => { const out = new Set(); const grab = (t) => { for (const s of String(t ?? '').split(/\n|(?<=[.?!])\s+/)) { const x = norm(s); if (/[a-z]/.test(x) && x.split(' ').length >= 4) out.add(x); } }; grab(q.question); for (const o of q.options ?? []) grab(o); return out; };
const mine = new Set(); for (const q of qs) for (const s of sentences(q)) mine.add(s);
const { data: sheets } = await sb.from('naesin_problem_sheets').select('title, questions').range(0, 9999);
const { data: tmpls } = await sb.from('naesin_templates').select('title, questions').neq('id', ID).range(0, 9999);
let dup = 0; for (const r of [...sheets, ...tmpls]) for (const q of r.questions ?? []) for (const s of sentences(q)) if (mine.has(s)) { dup++; console.log('  아직 겹침:', r.title, '|', s); }
console.log('교체 후 완전 일치 문장:', dup, '건');
if (!APPLY) { console.log('[dry-run]'); process.exit(0); }
const { error } = await sb.from('naesin_templates').update({ questions: qs, answer_key: ak }).eq('id', ID); if (error) throw error;
console.log('✓ 적용');
