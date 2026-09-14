/**
 * 이동형 오답 신고 2차 (2026-09-14) — 명령문 Step1 · 과거형 Step2 문항 결함 수정.
 *  A. 명령문 Step1 (템플릿 4bee03dc + 복사본 51206734 중1 천재이 3과 · f9c97167 중1 동아윤 3과)
 *     - 동물원 안내문(Wonder World): 표지판 내용이 본문에 없어 정답 불가 → 표지판 설명 인라인 + subParts 3개로 통일
 *       (템플릿·천재이는 subParts가 2개로 잘못 쪼개져 있었음). 인정답안 Don't feed / Throw the trash / Put the trash 추가
 *     - 할머니 당부문(grandma): 빈칸이 4개인데 지시문은 "㉠~㉢", 4번째 라벨이 ㉠ 중복 → ㉣로 교정 + subParts 4개
 *       (템플릿·천재이 정답 "㉡ Be nice"는 "___ with your friends at school"에 맞지 않음 → Don't fight)
 *     - 잘못된 부분 고치기(Looks at the sky): 내용은 맞고 형식만 다른 답 인정답안 등재
 *       (이동형 "Looks-Look … is-be", 이지민 "(1) Look at the sky. …" 완전 문장)
 *  B. 과거형 Step2 (템플릿 f2172f7c + 복사본 4장) #23: (3) got ↔ woke, (5) get ↔ go 모두 자연스러워 인정답안 추가
 *  C. 시도 있는 시트 재채점 — 새 채점 규칙(matchFilledBlanks: 빈칸 채운 완전 문장 인정) 적용 포함
 *  실행: npx tsx --env-file=.env.local scripts/fix-dongh-imperative-past-sheets.ts [--apply]
 */
import { writeFileSync } from 'fs';
import { createAdminClient } from '@/lib/supabase/admin';
import { regradeSheet } from '@/lib/naesin/regrade-sheet';

const APPLY = process.argv.includes('--apply');
type Sub = { label: string; answer: string; acceptedAnswers?: string[] };
type Q = { number: number; question: string; answer: string; options?: string[]; acceptedAnswers?: string[]; subParts?: Sub[]; [k: string]: unknown };
const IMP_TMPL = '4bee03dc-b34c-40dd-b521-287de7c49ef7';
const PAST_TMPL = 'f2172f7c-d350-4854-acb7-abaef287273f';
const backup: Record<string, unknown> = {};
const touched = new Set<string>();

const ZOO_Q = `다음은 동물원의 안내문입니다. 표지판 내용에 맞게 (A)~(C)를 명령문으로 완성하시오.

[표지판] (A) 사진 촬영 OK  (B) 동물에게 간식 주기 금지  (C) 쓰레기는 쓰레기통에

Welcome to Wonder World. (A)______ with cute animals. However, (B)______ snacks to the animals. They're not good for the animals. (C)______ in the trash can, please. Have a great time.

※ (A)/(B)/(C)를 앞에서부터 ' / '로 구분해 쓰시오.`;
const ZOO_SUB: Sub[] = [
  { label: '(A)', answer: 'Take pictures', acceptedAnswers: ['Enjoy time', 'Have fun'] },
  { label: '(B)', answer: "Don't give", acceptedAnswers: ["Don't feed", "Don't give snacks"] },
  { label: '(C)', answer: 'Put trash', acceptedAnswers: ['Throw trash', 'Put garbage', 'Throw garbage', 'Throw the trash', 'Put the trash'] },
];
const ZOO_ANS = "Take pictures / Don't give / Put trash";

const GRANDMA_Q = `다음 글의 흐름상 빈칸 ㉠~㉣에 들어갈 말을 <보기>에서 골라 명령문(긍정 또는 부정)의 형태로 쓰시오. (필요시 형태를 바꿀 수 있음)

When I go to school, my grandma always tells me like this;
㉠______ careful when crossing the street.
㉡______ with your friends at school.
㉢______ to what your teachers say.
This morning she told me as usual and added one thing; ㉣______ to take your umbrella. It will rain soon.

<보기>
write  forget  get  are
has  listen  fight  touch  take

※ ㉠~㉣을 순서대로 ' / '로 구분해 쓰시오.`;
const GRANDMA_SUB: Sub[] = [
  { label: '㉠', answer: 'Be' }, { label: '㉡', answer: "Don't fight" }, { label: '㉢', answer: 'Listen' }, { label: '㉣', answer: "Don't forget" },
];
const GRANDMA_ANS = "Be / Don't fight / Listen / Don't forget";

const LOOKS_ACCEPTED = [
  "(1) Looks → Look (2) Doesn't → Don't (3) is → be (4) Are → Be (5) Opening → Open",
  "Looks-Look Doesn't-Don't is-be Are-Be Opening-Open",
  "(1) Look at the sky. (2) Don't go there. (3) Don't be shy. (4) Be nice to your friends. (5) Open your book to page 69.",
];

function fixImperative(qs: Q[], ak: (string | number)[], tag: string): string[] {
  const log: string[] = [];
  const at = (pred: (q: Q) => boolean) => { const i = qs.findIndex(pred); return i < 0 ? null : { i, q: qs[i] }; };
  const zoo = at((q) => q.question.includes('Wonder World'));
  if (zoo) { zoo.q.question = ZOO_Q; zoo.q.answer = ZOO_ANS; zoo.q.subParts = structuredClone(ZOO_SUB); delete zoo.q.acceptedAnswers; ak[zoo.i] = ZOO_ANS; log.push(`#${zoo.q.number} 동물원: 표지판 설명 + subParts 3`); }
  const gm = at((q) => q.question.includes('grandma'));
  if (gm) { gm.q.question = GRANDMA_Q; gm.q.answer = GRANDMA_ANS; gm.q.subParts = structuredClone(GRANDMA_SUB); delete gm.q.acceptedAnswers; ak[gm.i] = GRANDMA_ANS; log.push(`#${gm.q.number} 할머니: ㉣ 라벨 + subParts 4`); }
  const lk = at((q) => q.question.includes('Looks at the sky'));
  if (lk) { const ex = lk.q.acceptedAnswers ?? []; lk.q.acceptedAnswers = [...ex, ...LOOKS_ACCEPTED.filter((a) => !ex.includes(a))]; log.push(`#${lk.q.number} 고쳐쓰기: 인정답안 +${LOOKS_ACCEPTED.length}`); }
  return log.length ? log : [`${tag}: 대상 문항 없음`];
}

function fixPast(qs: Q[], tag: string): string[] {
  const q = qs.find((x) => x.question.includes('up this morning'));
  if (!q) return [`${tag}: #23 대상 없음`];
  if (!q.subParts) {
    // 템플릿은 subParts 없이 문자열 정답만 → 조합 인정답안으로 (복사 시 sanitize가 subParts 자동 생성)
    if (q.answer !== "did, wake, got, Did, get, didn't") return [`${tag}: #23 정답 예상과 다름 ${q.answer}`];
    const combos = ["did, wake, woke, Did, get, didn't", "did, wake, got, Did, go, didn't", "did, wake, woke, Did, go, didn't"];
    const all = [...combos, ...combos.map((c) => c.replace("didn't", 'did not'))];
    q.acceptedAnswers = [...new Set([...(q.acceptedAnswers ?? []), ...all])];
    return [`#${q.number}: (subParts 없음) 인정답안 조합 +${all.length}`];
  }
  if (q.subParts.length !== 6) return [`${tag}: #23 subParts ${q.subParts.length}개 — 건너뜀`];
  const sp = q.subParts;
  if (sp[2].answer !== 'got' || sp[4].answer !== 'get') return [`${tag}: #23 subParts 예상과 다름 ${sp.map((s) => s.answer).join('|')}`];
  const add = (s: Sub, v: string) => { s.acceptedAnswers = [...new Set([...(s.acceptedAnswers ?? []), v])]; };
  add(sp[2], 'woke'); add(sp[4], 'go');
  return [`#${q.number}: (3) +woke, (5) +go`];
}

async function main() {
  const admin = createAdminClient();
  const sheetsOf = async (tmplId: string) => (await admin.from('naesin_problem_sheets').select('id, title, questions, answer_key').eq('source_template_id', tmplId)).data ?? [];

  for (const [tmplId, fixer] of [[IMP_TMPL, 'imp'], [PAST_TMPL, 'past']] as const) {
    const { data: t } = await admin.from('naesin_templates').select('id, title, questions, answer_key').eq('id', tmplId).single();
    const targets = [{ table: 'naesin_templates', ...t! }, ...(await sheetsOf(tmplId)).map((s) => ({ table: 'naesin_problem_sheets', ...s }))];
    for (const row of targets) {
      const qs = row.questions as Q[]; const ak = row.answer_key as (string | number)[];
      backup[`${row.table}_${row.id}`] = { questions: structuredClone(qs), answer_key: structuredClone(ak) };
      const tag = `${row.table === 'naesin_templates' ? 'TMPL' : 'SHEET'} ${row.id.slice(0, 8)} ${row.title}`;
      const log = fixer === 'imp' ? fixImperative(qs, ak, tag) : fixPast(qs, tag);
      console.log(`[${tag}]\n  ${log.join('\n  ')}`);
      if (APPLY) {
        const { error } = await admin.from(row.table).update({ questions: qs, answer_key: ak }).eq('id', row.id);
        if (error) throw error;
        if (row.table === 'naesin_problem_sheets') touched.add(row.id);
      }
    }
  }
  writeFileSync(new URL('../scripts/backups/dongh-imperative-past-backup.json', import.meta.url), JSON.stringify(backup, null, 1));
  if (!APPLY) { console.log('\n[dry-run] --apply 로 적용'); return; }
  for (const id of touched) { const r = await regradeSheet(id); if (r.total) console.log(`재채점 ${id.slice(0, 8)}:`, r); }
  console.log('\n✓ 적용 완료 (백업: scripts/backups/dongh-imperative-past-backup.json)');
}
main().catch((e) => { console.error(e); process.exit(1); });
