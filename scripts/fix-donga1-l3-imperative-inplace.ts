/**
 * 중1 동아윤 3과 명령문 Step1 제자리 정비 (2026-09-14, 이동현 후속) — 시트 ID·번호 유지.
 * 템플릿 4bee03dc + 복사본(천재이 51206734 · 동아윤 f9c97167). 본문 조각으로 매칭.
 *  - 한 칸에 여러 답 받는 12문항 → subParts(항목별 입력칸). 옛 정답 문자열은 인정답안으로 보존(기존 정답 시도 유지).
 *  - 오타: 입부→일부, 깔은→괄호, 담신→당신, 알을→말을, 우의사항→유의사항, 각주 번호(31) 36) 37)) 제거
 *  - 느낌표 변형("Watch out!"), #29 친구 표현 관대 인정
 *  실행: npx tsx --env-file=.env.local scripts/fix-donga1-l3-imperative-inplace.ts [--apply]
 */
import { writeFileSync } from 'fs';
import { createAdminClient } from '@/lib/supabase/admin';
import { regradeSheet } from '@/lib/naesin/regrade-sheet';

const APPLY = process.argv.includes('--apply');
type Sub = { label: string; answer: string; acceptedAnswers?: string[] };
type Q = { number: number; question: string; answer: string; type?: string; options?: string[]; acceptedAnswers?: string[]; subParts?: Sub[]; [k: string]: unknown };
type Edit = { find: (q: Q) => boolean; apply: (q: Q) => string };
const backup: Record<string, unknown> = {};
const touched = new Set<string>();
const inc = (s: string) => (q: Q) => q.question.includes(s);
const P = (label: string, answer: string, acc?: string[]): Sub => ({ label, answer, ...(acc?.length ? { acceptedAnswers: acc } : {}) });
/** subParts 전환: 옛 정답·옛 인정답안은 whole 인정답안으로 유지. fix로 본문 오타 교정 */
const toSub = (parts: Sub[], fix?: (s: string) => string) => (q: Q) => {
  const old = q.answer; const newAns = parts.map((p) => p.answer).join(' / ');
  q.subParts = parts; q.type = 'multi_part'; q.answer = newAns;
  q.acceptedAnswers = [...new Set([...(q.acceptedAnswers ?? []), ...(old && old !== newAns ? [old] : [])])];
  if (fix) q.question = fix(q.question);
  return `subParts ${parts.length}개`;
};
const strip = (s: string) => s.replace(/(시오|것)\.\d{2}\)/g, '$1.');

const EDITS: Edit[] = [
  { find: inc('<u>Are</u> nice to your friends'), apply: toSub([P('(1)', 'Be nice to your friends.'), P('(2)', 'Open your book to page 67.')]) },
  { find: inc('(Wash / Washes) your hands'), apply: toSub([P('(1)', 'Wash'), P('(2)', "Don't"), P('(3)', 'Exercise'), P('(4)', 'Get'), P('(5)', "Don't play")]) },
  { find: inc('_____ fast! We are late for the game'), apply: toSub([P('(1)', 'Run', ['Run!']), P('(2)', 'Try'), P('(3)', "Don't lie"), P('(4)', 'Wear'), P('(5)', "Don't stay")]) },
  { find: inc('세 명의 사람이 서 있음'), apply: toSub([P('(1)', "Don't be late"), P('(2)', 'Wake up', ['Wake up!']), P('(3)', 'Watch out', ['Watch out!']), P('(4)', "Don't eat")]) },
  { find: inc('(the, for, door, your, open, friend)'), apply: toSub([P('(A)', 'Open the door for your friend.'), P('(B)', "Don't play with a ball in the classroom.")]) },
  { find: inc('You talk loudly in the movies'), apply: toSub([P('(1)', "Don't talk"), P('(2)', "Don't be late"), P('(3)', "Don't eat food in the museum."), P('(4)', 'Be nice'), P('(5)', "Don't open")]) },
  { find: inc('Looks at the sky'), apply: toSub([
    P('(1)', 'Look', ['Looks → Look', 'Looks-Look']), P('(2)', "Don't", ["Doesn't → Don't", "Doesn't-Don't"]), P('(3)', "Don't be", ["Don't is → Don't be", 'be', 'is → be', 'is-be']),
    P('(4)', 'Be', ['Are → Be', 'Are-Be']), P('(5)', 'Open', ['Opening → Open', 'Opening-Open']),
  ]) },
  { find: inc('화재 시 대처법\'에 관련된 문구'), apply: toSub([P('㉠', 'use'), P('㉡', 'Cover'), P('㉢', 'Go')]) },
  { find: inc('<SC Middle School Rules>'), apply: toSub([P('(A)', "Don't be late for school."), P('(B)', 'Be nice to your friends.')], (s) => strip(s.replace('규칙 중 입부이다', '규칙 중 일부이다'))) },
  { find: inc('나의 친구들과 사이좋게 지내라'), apply: toSub([P('㉠', "Don't be late for school."), P('㉡', 'Get along with your friends.', ['Get along with friends.', 'Get along with my friends.'])], (s) => strip(s.replace('깔은 안의', '괄호 안의'))) },
  { find: inc('담신의 코와 입을 가리세요'), apply: toSub([P('㉠', "Don't take the elevator."), P('㉡', 'Cover your nose and mouth.')], (s) => strip(s.replace('담신의', '당신의'))) },
  { find: inc('수업 시간에 지켜야 할 알을'), apply: toSub([P('(1)', "Don't run."), P('(2)', 'Be quiet.'), P('(3)', "Don't make noise."), P('(4)', 'Be nice to others.')],
    (s) => strip(s.replace('지켜야 할 알을', '지켜야 할 말을').replace('<우의사항>', '<유의사항>').replace('• <B>는 한 번씩만 사용할 것', '• <B>는 한 번씩만 사용할 것 (<B>에 적힌 순서대로 (1)~(4))'))) },
];

async function applyTo(table: string, id: string, title: string) {
  const admin = createAdminClient();
  const { data: row } = await admin.from(table).select('questions, answer_key').eq('id', id).single();
  const qs = row!.questions as Q[]; const ak = row!.answer_key as (string | number)[];
  backup[`${table}_${id}`] = { questions: structuredClone(qs), answer_key: structuredClone(ak) };
  const log: string[] = [];
  for (const e of EDITS) {
    const hits = qs.map((q, i) => [q, i] as const).filter(([q]) => e.find(q));
    if (hits.length !== 1) { log.push(`⚠ ${hits.length}건 매칭 — 건너뜀`); continue; }
    const [q, i] = hits[0]; const msg = e.apply(q); ak[i] = q.answer; log.push(`#${q.number} ${msg}`);
  }
  console.log(`[${table === 'naesin_templates' ? 'TMPL' : 'SHEET'} ${id.slice(0, 8)} ${title}] ${log.join(' · ')}`);
  if (APPLY) { const { error } = await admin.from(table).update({ questions: qs, answer_key: ak }).eq('id', id); if (error) throw error; if (table !== 'naesin_templates') touched.add(id); }
}

async function main() {
  const admin = createAdminClient();
  const T = '4bee03dc-b34c-40dd-b521-287de7c49ef7';
  const { data: t } = await admin.from('naesin_templates').select('id, title').eq('id', T).single();
  await applyTo('naesin_templates', t!.id, t!.title);
  const { data: copies } = await admin.from('naesin_problem_sheets').select('id, title').eq('source_template_id', T);
  for (const c of copies ?? []) await applyTo('naesin_problem_sheets', c.id, c.title);
  writeFileSync(new URL('../scripts/backups/donga1-l3-imperative-inplace-backup.json', import.meta.url), JSON.stringify(backup, null, 1));
  if (!APPLY) { console.log('\n[dry-run] --apply 로 적용'); return; }
  for (const id of touched) { const r = await regradeSheet(id); if (r.total) console.log(`재채점 ${id.slice(0, 8)}:`, r); }
  console.log('\n✓ 적용 완료 (백업: scripts/backups/donga1-l3-imperative-inplace-backup.json)');
}
main().catch((e) => { console.error(e); process.exit(1); });
