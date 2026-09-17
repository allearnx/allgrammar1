/**
 * 중1 동아윤 4과 문법 제자리 정비 (2026-09-14, 이동현 신고 후속) — 시트 ID·문항 번호 유지(진도·임시저장 보존).
 * 템플릿(동명사 fa9d511c · be going to a96a4fa1) + source_template_id 복사본 전부. 문항은 번호가 아니라 본문 조각으로 찾는다.
 *
 *  동명사 Step1: 이어지는 소문항((2)~)에 지시문·보기 없음 → 앞 문항의 지시문·보기 부착 (학생뷰는 question만 렌더).
 *               오타(어떤상→어법상, finsihed, 필수어, 서술하여, 쉬어 되는), 번호 잔재(13.~17.) 정리, 인정답안 보강.
 *  be going to Step1: 한 칸에 여러 답 받는 8문항 → subParts(항목별 입력칸) + 파트별 인정답안.
 *               #10 "계획 중 하나 선택"인데 정답이 4문장 연결 → 정답 1개 + 나머지 인정답안. #6·#12 빈칸 수 보정.
 *  실행: npx tsx --env-file=.env.local scripts/fix-donga1-l4-grammar-inplace.ts [--apply]
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
const exact = (s: string) => (q: Q) => q.question.trim() === s;
const addAcc = (q: Q, ...vals: string[]) => { q.acceptedAnswers = [...new Set([...(q.acceptedAnswers ?? []), ...vals])]; };
/** 지시문 prefix 부착 (이미 붙어 있으면 그대로) */
const prefix = (dir: string, body?: string) => (q: Q) => {
  const b = body ?? q.question;
  if (q.question.startsWith(dir.slice(0, 12))) { q.question = dir + q.question.slice(q.question.indexOf(b.slice(0, 8)) >= 0 ? q.question.indexOf(b.slice(0, 8)) : 0); return '지시문 이미 있음(정리)'; }
  q.question = dir + b; return '지시문 부착';
};
const toSub = (parts: [string, string, string[]?][]) => (q: Q) => {
  q.subParts = parts.map(([label, answer, acc]) => ({ label, answer, ...(acc?.length ? { acceptedAnswers: acc } : {}) }));
  q.answer = parts.map((p) => p[1]).join(' / ');
  q.type = 'multi_part';
  return `subParts ${parts.length}개`;
};

// ── 동명사 Step1 — 문항별 표준 본문·정답 (템플릿·복사본 공통, 본문 조각으로 매칭) ──
const D_FIX = '다음 문장에서 어법상 어색한 부분을 찾아 바르게 고치시오. (고친 문장을 전부 쓸 것)\n\n';
const D_TABLE = '다음 표를 보고 예문과 같이 문장을 완성하시오.\n\nex. Julie enjoys listening to music and traveling.\n\n';
const D_TWO = '다음 <보기>의 단어 중 알맞은 것을 두 가지 골라 문장을 완성하시오. (필요시 변형 가능)\n\n<보기>\nfinish / mind / watch / enjoy / clean / close\n\n';
const TWO_HINT = '\n※ 두 단어를 띄어쓰기로 구분하여 입력 (예: enjoy swimming)';
const D_MINA = '다음 미나에 대한 정보를 참고하여 문장을 완성하시오.\n\nstudy: English, math       play: tennis, soccer\nwatch: movies              drink: orange juice\neat: noodles\n\n';
const D_BOKI = '다음 <보기>에서 단어를 알맞게 골라 문장을 만드시오. (단, 단어의 형태는 적절히 바꿀 것)\n\n<보기>\nstart, finish, learn, give up, like, hate, mind, hope, wish, avoid\n\n';
const D_READ = '다음 글을 읽고 빈칸에 알맞은 말을 쓰시오.\n\n';
const D_PAREN = '다음 괄호 안에 주어진 말을 이용하여 빈칸에 알맞은 말을 쓰시오.\n\n';
const D_FRIEND = '친구를 사귈 때 중요한 것들에 대해 생각하며, <보기>의 단어로 문장을 완성하시오.\n\nQ: What do you think is important for friends to do?\n\n<보기> receive / share / listen / give\n\n';
const D_CONNECT = '다음 짝이 되는 말을 연결하여, 동명사를 이용한 문장을 완성하시오.\n\n<보기1> Get a good grade / Wake up early / Have good friends\n<보기2> important / not easy / a good habit\n\nExample: Getting a good grade is not easy.\n\n';
const D_WORD = '다음 주어진 단어를 이용하여 문장을 완성하시오.\n\n';
const D_ABC = '다음 각 문장에서 어색한 부분을 한 곳씩 찾아 바르게 고쳐 쓰시오.\n\n(A) Mark enjoys cook in the park.\n(B) Ride a bicycle with her is exciting.\n(C) Jane told her sister wash her hands.\n\n';
const D_MINHO = '다음 표를 보고 Minho에 관한 글을 완성하시오.\n\n이름 : Minho\n취미 : 책 읽기\n잘하는 것 : 농구하기\n좋아하는 것 : 음악듣기\n해야 할 일 : 방청소하기\n\nHis name is Minho.\nHis hobby is reading books.\nHe is good at (1)__________.\nHe enjoys (2)__________.\nCleaning his room is his work.\n\n';

/** 표준화: question/answer/acceptedAnswers/subParts를 통째로 지정. 기존 정답이 다르면 인정답안으로 보존 */
const canon = (question: string, answer: string, acc: string[] = [], subParts?: Sub[]) => (q: Q) => {
  const old = q.answer;
  q.question = question; q.answer = answer;
  const keepOld = old && old !== answer && !acc.includes(old) && !/^(Sharing, giving|Having|keeping his room clean|cleaning his room)$/.test(old) ? [old] : [];
  const merged = [...new Set([...acc, ...keepOld])];
  if (merged.length) q.acceptedAnswers = merged; else delete q.acceptedAnswers;
  if (subParts) { q.subParts = subParts; q.type = 'multi_part'; } else if (q.subParts && !answer.includes(',')) { delete q.subParts; }
  return old !== answer ? `표준화 [정답 ${JSON.stringify(old)} → ${JSON.stringify(answer)}]` : '표준화';
};
const sub2 = (a: string, b: string, l1 = '(1)', l2 = '(2)', accA: string[] = [], accB: string[] = []): Sub[] => [
  { label: l1, answer: a, ...(accA.length ? { acceptedAnswers: accA } : {}) }, { label: l2, answer: b, ...(accB.length ? { acceptedAnswers: accB } : {}) }];

const GERUND: Edit[] = [
  { find: inc('Tom and David enjoy to learn'), apply: canon(D_FIX + '(1) Tom and David enjoy to learn math.', 'Tom and David enjoy learning math.', ['enjoy learning math', 'learning', 'to learn → learning']) },
  { find: (q) => /Kevin fin(i?s|si)hed do/.test(q.question), apply: canon(D_FIX + '(2) Kevin finished do his homework.', 'Kevin finished doing his homework.', ['finished doing his homework', 'doing', 'do → doing']) },
  { find: inc('(take pictures / interesting)'), apply: canon('다음 괄호 안의 말을 이용하여 동명사를 주어로 하는 문장을 완성하시오.\n\n(take pictures / interesting)\n→ __________', 'Taking pictures is interesting') },
  { find: inc('Damin enjoys'), apply: canon(D_TABLE + '(1) Damin enjoys __________. (watch TV / play computer games)', 'watching TV and playing computer games') },
  { find: inc('Matt enjoys'), apply: canon(D_TABLE + '(2) Matt enjoys __________. (travel / cook)', 'traveling and cooking') },
  { find: inc('Junsu enjoys'), apply: canon(D_TABLE + '(3) Junsu enjoys __________. (listen to music / play computer games)', 'listening to music and playing computer games') },
  { find: inc("I don't __________ __________ the window"), apply: canon(D_TWO + "(1) I don't __________ __________ the window. It's up to you." + TWO_HINT, 'mind closing') },
  { find: inc('Suzy __________ __________ her room'), apply: canon(D_TWO + "(2) Suzy __________ __________ her room, so it's always clean." + TWO_HINT, 'enjoys cleaning') },
  { find: inc('Jiho __________ __________ baseball'), apply: canon(D_TWO + "(3) Jiho __________ __________ baseball games. Now it's time to study!" + TWO_HINT, 'finished watching', ['enjoys watching']) },
  { find: inc('Mina loves studying'), apply: canon(D_MINA + '(1) Mina loves studying __________ and __________.', 'English and math', ['math and English', 'English, math']) },
  { find: inc('She likes __________ noodles'), apply: canon(D_MINA + '(2) She likes __________ noodles.', 'eating') },
  { find: inc('She enjoys __________ tennis and'), apply: canon(D_MINA + '(3) She enjoys __________ tennis and __________.', 'playing, soccer', [], sub2('playing', 'soccer')) },
  { find: inc('She likes __________ orange juice'), apply: canon(D_MINA + '(4) She likes __________ orange juice.', 'drinking') },
  { find: inc('She enjoys __________ movies'), apply: canon(D_MINA + '(5) She enjoys __________ movies.', 'watching') },
  { find: inc('나는 글쓰기를 좋아한다'), apply: canon(D_BOKI + '(1) 나는 글쓰기를 좋아한다.\n→ __________', 'I like writing') },
  { find: inc('패스트푸드를 먹는 것을 피해야'), apply: canon(D_BOKI + '(2) 나는 패스트푸드를 먹는 것을 피해야 한다.\n→ __________', 'I should avoid eating fast food') },
  { find: inc('새로운 무엇인가를 배우는 것을'), apply: canon(D_BOKI + '(3) 새로운 무엇인가를 배우는 것을 포기하지 마라.\n→ __________', "Don't give up learning something new") },
  { find: inc('Although Lee Heeah'), apply: (q) => { if (!q.question.startsWith(D_READ)) { q.question = D_READ + q.question.replace(/^다음 글을 읽고 빈칸에 알맞은 글을 쓰시오\.\s*/, ''); return '지시문 부착'; } return '유지'; } },
  { find: inc('Thank you for __________'), apply: canon(D_PAREN + '(1) Thank you for __________.\n(invite me to the party)', 'inviting me to the party') },
  { find: inc('read Harry Potter series'), apply: canon(D_PAREN + '(2) __________ is very fun.\n(read Harry Potter series)', 'Reading Harry Potter series') },
  { find: inc('(exercise regularly)'), apply: canon(D_PAREN + '(3) __________ is good for your health.\n(exercise regularly)', 'Exercising regularly') },
  { find: inc('(watch action movies)'), apply: canon(D_PAREN + '(4) My hobby is __________.\n(watch action movies)', 'watching action movies') },
  { find: inc('advice is important'), apply: canon(D_FRIEND + '(1) __________ and __________ advice is important.', 'Giving, receiving', ['Receiving, giving'], sub2('Giving', 'receiving', '(1)', '(2)', ['Receiving'], ['giving'])) },
  { find: inc('common interests is important'), apply: canon(D_FRIEND + '(2) __________ common interests is important.', 'Sharing') },
  { find: inc('to others is important'), apply: canon(D_FRIEND + '(3) __________ to others is important.', 'Listening') },
  { find: (q) => /Example: Getting a good grade/.test(q.question) && /16\.|\(1\)/.test(q.question.split('Example')[1] ?? '') || /Example: Getting a good grade/.test(q.question) && q.answer.startsWith('Waking'), apply: canon(D_CONNECT + '(1) __________', 'Waking up early is a good habit', ['Waking up early is important']) },
  { find: (q) => q.question.trim() === '17. __________' || (/Example: Getting a good grade/.test(q.question) && q.answer.startsWith('Having')), apply: canon(D_CONNECT + '(2) __________', 'Having good friends is important', ['Having good friends is a good habit']) },
  { find: inc('새로운 친구를 사귀는 것은'), apply: canon(D_WORD + '새로운 친구를 사귀는 것은 쉽지 않다. (make)\n→ __________ is not easy.', 'Making new friends') },
  { find: inc('건강한 음식을 먹는 것은'), apply: canon(D_WORD + '건강한 음식을 먹는 것은 중요하다. (eat)\n→ __________ is important.', 'Eating healthy food') },
  { find: inc('강에서 수영하는 것은'), apply: canon(D_WORD + '강에서 수영하는 것은 위험하다. (swim)\n→ __________ in the river is dangerous.', 'Swimming') },
  { find: (q) => /\(A\) __________ → __________/.test(q.question), apply: canon(D_ABC + '(A) __________ → __________', 'cook, cooking', [], sub2('cook', 'cooking', '틀린 부분', '고친 것')) },
  { find: (q) => /\(B\) __________ → __________/.test(q.question), apply: canon(D_ABC + '(B) __________ → __________', 'Ride, Riding', [], sub2('Ride', 'Riding', '틀린 부분', '고친 것')) },
  { find: (q) => /\(C\) __________ → __________/.test(q.question), apply: canon(D_ABC + '(C) __________ → __________', 'wash, to wash', [], sub2('wash', 'to wash', '틀린 부분', '고친 것')) },
  { find: (q) => /Minho/.test(q.question) && /\(1\) __________\s*$/.test(q.question), apply: canon(D_MINHO + '(1) __________', 'playing basketball') },
  { find: (q) => (/Minho/.test(q.question) || q.question.trim() === '(2) __________') && /\(2\) __________\s*$/.test(q.question), apply: canon(D_MINHO + '(2) __________', 'listening to music') },
];

// ── be going to Step1 ──
const BGT: Edit[] = [
  { find: inc('미나의 이번 주 계획표'), apply: (q) => {
    const full = ['Mina is going to go to the movies on Monday', 'Mina is going to play tennis on Wednesday', 'Mina is going to swim on Thursday', 'Mina is going to visit her grandmother on Saturday', 'Mina is going to visit grandmother on Saturday', 'Mina is going to go swimming on Thursday'];
    q.answer = full[0]; q.acceptedAnswers = [...full.slice(1), ...full.map((f) => f.replace(/^Mina /, ''))]; return '정답 1개 + 계획 4개 인정답안'; } },
  { find: inc('수미와 수미의 여동생'), apply: toSub([
    ['(1)', 'What are you going to do this weekend?'],
    ['(2)', 'I am going to go shopping with my mom.', ['I am going to go shopping with my mother.']],
    ['(3)', 'What is your sister going to do this weekend?'],
    ['(4)', 'She is going to do her homework.'],
  ]) },
  { find: inc('She feeds the fish'), apply: toSub([
    ['(1)', 'She is going to feed the fish.'], ['(2)', 'They are going to practice yoga after school.'], ['(3)', 'He is going to wash his car.'],
  ]) },
  { find: inc('take Chinese lessons'), apply: toSub([
    ['(1)', 'She is going to take Chinese lessons.', ['is going to take Chinese lessons']],
    ['(2)', "He is going to visit his uncle's house.", ["is going to visit his uncle's house"]],
  ]) },
  { find: inc('do    stay    watch'), apply: toSub([
    ['(1)', 'going to stay'], ['(2)', 'am going to watch', ["'m going to watch"]], ['(3)', 'going to do'],
  ]) },
  { find: inc('[pizza image]'), apply: (q) => {
    q.question = q.question.replace('[pizza image]', '피자 그림').replace('[soccer ball image]', '축구공 그림');
    return toSub([['(1)', 'He is going to eat pizza.', ['going to eat pizza']], ['(2)', 'He is going to play soccer.', ['going to play soccer']]])(q) + ' + 그림 설명'; } },
  { find: inc('Party plans for Jiwon'), apply: toSub([
    ['(1)', 'am going to buy a present', ['am going to buy a gift']], ['(2)', 'is going to take pictures', ['is going to take photos']], ['(3)', 'are going to cook'],
  ]) },
  { find: inc('James의 다음 주 계획표'), apply: toSub([['(1)', 'is going to make cookies'], ['(2)', 'is going to play soccer']]) },
  { find: inc('Minsu is thirsty'), apply: toSub([
    ['(1)', 'I am going to take a rest.', ['am going to take a rest']], ['(2)', 'She is going to have a sandwich.', ['is going to have a sandwich']],
  ]) },
  { find: inc('Minjun _______ _______ to _______'), apply: (q) => { addAcc(q, 'is going clean', 'is going, clean', 'is going / clean'); return '빈칸 구조(to 제시) 인정답안'; } },
  { find: inc('I _______ _______ _______ _______ with my friends'), apply: (q) => { q.question = q.question.replace('I _______ _______ _______ _______ with my friends', 'I _______ _______ _______ _______ _______ with my friends'); return '빈칸 4→5 (정답 5단어)'; } },
];

async function applyTo(table: string, id: string, title: string, edits: Edit[]) {
  const admin = createAdminClient();
  const { data: row } = await admin.from(table).select('questions, answer_key').eq('id', id).single();
  const qs = row!.questions as Q[]; const ak = row!.answer_key as (string | number)[];
  backup[`${table}_${id}`] = { questions: structuredClone(qs), answer_key: structuredClone(ak) };
  const log: string[] = [];
  for (const e of edits) {
    const hits = qs.map((q, i) => [q, i] as const).filter(([q]) => e.find(q));
    if (hits.length !== 1) { log.push(`⚠ ${hits.length}건 매칭 — 건너뜀 (${e.find.toString().slice(0, 40)})`); continue; }
    const [q, i] = hits[0]; const before = q.answer;
    const msg = e.apply(q); ak[i] = q.answer;
    log.push(`#${q.number} ${msg}${before !== q.answer ? ` [정답 ${JSON.stringify(before)} → ${JSON.stringify(q.answer)}]` : ''}`);
  }
  console.log(`[${table === 'naesin_templates' ? 'TMPL' : 'SHEET'} ${id.slice(0, 8)} ${title}] ${log.filter((l) => l.startsWith('⚠')).length}건 미매칭\n  ${log.join('\n  ')}`);
  if (APPLY) { const { error } = await admin.from(table).update({ questions: qs, answer_key: ak }).eq('id', id); if (error) throw error; if (table !== 'naesin_templates') touched.add(id); }
}

async function main() {
  const admin = createAdminClient();
  for (const [tmplId, edits] of [['fa9d511c-0755-450e-b4b6-3fbc37266776', GERUND], ['a96a4fa1', BGT]] as const) {
    const { data: tl } = await admin.from('naesin_templates').select('id, title').range(0, 999);
    const t = tl!.find((x) => x.id.startsWith(tmplId))!;
    await applyTo('naesin_templates', t.id, t.title, edits);
    const { data: copies } = await admin.from('naesin_problem_sheets').select('id, title').eq('source_template_id', t.id);
    for (const c of copies ?? []) await applyTo('naesin_problem_sheets', c.id, c.title, edits);
    if (edits === GERUND) await applyTo('naesin_problem_sheets', '2afe8533-9a7f-4b30-a404-1de6cfffd122', 'YBM박 6과 문법 1단계 (1/5) [동명사 재사용본]', edits);
  }
  writeFileSync(new URL('../scripts/backups/donga1-l4-grammar-inplace-backup.json', import.meta.url), JSON.stringify(backup, null, 1));
  if (!APPLY) { console.log('\n[dry-run] --apply 로 적용'); return; }
  for (const id of touched) { const r = await regradeSheet(id); if (r.total) console.log(`재채점 ${id.slice(0, 8)}:`, r); }
  console.log('\n✓ 적용 완료 (백업: scripts/backups/donga1-l4-grammar-inplace-backup.json)');
}
main().catch((e) => { console.error(e); process.exit(1); });
