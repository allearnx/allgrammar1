/**
 * 중3 천재이 4과 관계부사 — 구 Step1(66)·Step2(50) 복사본을 검수 완료된 능률김 5과(02718371) 관계부사 문항으로 교체.
 * (2026-09-17 사장님: "뱅크" = 검수 끝난 새 스타일 세트. 같은 층(내신↔내신)·같은 학년(중3) 재사용 원칙.)
 *  - 능률김 5과 376문항 중 관계부사 문항만 228개 선별 (가주어 It·의미상 주어·종합 어법 제외, 애매 31건 수동 판정)
 *  - 1단계 110 → 4세트 / 2단계 66 → 3세트 / 3단계 53 → 2세트, 제목 "4과 관계부사 N단계 (k/n)"
 *  - whether/if Step1·2는 그대로. 구 관계부사 시트 2장은 백업 후 삭제 (시도 0건).
 *  npx tsx --env-file=.env.local scripts/rebuild-cheonjae3-l4-relative-adverb.ts [--apply]
 */
import { writeFileSync } from 'fs';
import { createAdminClient } from '@/lib/supabase/admin';
import { sanitizeQuestions } from '@/lib/validation/problem-validator';
import { scanRow } from '@/lib/validation';
import type { NaesinProblemQuestion } from '@/types/naesin';

const APPLY = process.argv.includes('--apply');
const SRC_UNIT = '02718371-722c-49f7-b637-67531b191eda'; // 중3 능률김 5과
const DST_UNIT = '15b84544-7b18-4d08-8a60-c716f46e53ce'; // 중3 천재이 4과
const OLD_SHEET_TITLES = ['관계부사 Step1', '관계부사 Step2'];
const CLINIC_ID = 'b4642997-340d-4fe1-9507-65601bef0793';

const REL = /관계부사|선행사|\b(in|at|on|for|by|during) which\b|\bthe way\b|\b(where|when|why|how)\b/i;
const GAJ = /가주어|진주어|의미상 주어|의미상의 주어|\bIt('s| is| was| will be| would be| seems)\b[^.]*\b(for|of)\b[^.]*\bto\b|\((for|of|to)( \/ (for|of|to))+\)/i;
const FORCE_REL = new Set(['5과 2단계 (2/4)#28']);
const FORCE_OUT = new Set(['5과 2단계 (4/4)#19', '5과 2단계 (4/4)#21', '5과 2단계 (4/4)#23', '5과 3단계 (1/4)#17', '5과 3단계 (2/4)#12']);
const SETS: Record<string, number> = { '1': 4, '2': 3, '3': 2 };

const norm = (s: string) => s.toLowerCase().replace(/<\/?u>/g, '').replace(/[’‘]/g, "'").replace(/_{2,}/g, '_').replace(/[^a-z0-9'_ ]/g, ' ').replace(/\s+/g, ' ').trim();
const sents = (q: NaesinProblemQuestion) => { const o = new Set<string>(); const g = (t: unknown) => { for (const s of String(t ?? '').split(/\n|(?<=[.?!])\s+/)) { const n = norm(s); if (/[a-z]/.test(n) && n.split(' ').length >= 4) o.add(n); } }; g(q.question); for (const x of q.options ?? []) g(x); return o; };

async function main() {
  const admin = createAdminClient();
  const { data: src } = await admin.from('naesin_problem_sheets').select('title, questions').eq('unit_id', SRC_UNIT).eq('category', 'problem').order('sort_order');
  const byStage: Record<string, NaesinProblemQuestion[]> = { '1': [], '2': [], '3': [] };
  for (const s of src ?? []) for (const q of s.questions as NaesinProblemQuestion[]) {
    const key = `${s.title}#${q.number}`; const t = [q.question, ...(q.options ?? []), q.explanation ?? '', String(q.answer ?? '')].join(' ');
    if (FORCE_REL.has(key) || (!FORCE_OUT.has(key) && REL.test(t) && !GAJ.test(t))) byStage[s.title.match(/(\d)단계/)![1]].push(q);
  }
  const total = Object.values(byStage).reduce((a, b) => a + b.length, 0);
  console.log(`선별: 1단계 ${byStage['1'].length} / 2단계 ${byStage['2'].length} / 3단계 ${byStage['3'].length} = ${total}`);

  // 세트 분할 + 재번호 + sanitize + 검사
  const newSheets: { title: string; sort_order: number; questions: NaesinProblemQuestion[]; answer_key: (string | number | null)[] }[] = [];
  let order = 0; let issuesTotal = 0;
  for (const st of ['1', '2', '3']) {
    const list = byStage[st]; const n = SETS[st]; const size = Math.ceil(list.length / n);
    for (let k = 0; k < n; k++) {
      const chunk = list.slice(k * size, (k + 1) * size).map((q, i) => ({ ...structuredClone(q), number: i + 1 }));
      const title = `4과 관계부사 ${st}단계 (${k + 1}/${n})`;
      const { questions, answerKey } = sanitizeQuestions(chunk, chunk.map((q) => q.answer as string), { title });
      const issues = scanRow('sheet', { id: '', title, questions, answer_key: answerKey }).filter((i) => i.category === 'correctness');
      issuesTotal += issues.length;
      for (const i of issues) console.log('  ⚠', title, JSON.stringify(i));
      newSheets.push({ title, sort_order: order++, questions, answer_key: answerKey });
      console.log(`  ${title}: ${questions.length}문항`);
    }
  }
  console.log(`correctness 이슈 ${issuesTotal}건`);

  // 클리닉 겹침
  const { data: clinic } = await admin.from('naesin_templates').select('questions').eq('id', CLINIC_ID).single();
  const clinicSet = new Set<string>(); for (const q of clinic!.questions as NaesinProblemQuestion[]) for (const s of sents(q)) clinicSet.add(s);
  let dup = 0; for (const sh of newSheets) for (const q of sh.questions) for (const s of sents(q)) if (clinicSet.has(s)) dup++;
  console.log(`집중훈련 클리닉과 완전 일치 문장: ${dup}건`);

  // 대상 단원 현황
  const { data: old } = await admin.from('naesin_problem_sheets').select('id, title, questions, answer_key, sort_order, source_template_id').eq('unit_id', DST_UNIT).eq('category', 'problem');
  const oldRel = (old ?? []).filter((s) => OLD_SHEET_TITLES.includes(s.title));
  const { data: atts } = await admin.from('naesin_problem_attempts').select('id').in('sheet_id', oldRel.map((s) => s.id));
  const { data: prog } = await admin.from('naesin_student_progress').select('student_id, problem_completed').eq('unit_id', DST_UNIT).eq('problem_completed', true);
  console.log(`천재이 4과 구 관계부사 시트 ${oldRel.length}장(시도 ${atts?.length ?? 0}건) 삭제 예정 | 유지: ${(old ?? []).filter((s) => !OLD_SHEET_TITLES.includes(s.title)).map((s) => s.title).join(', ')} | problem_completed=true 학생 ${prog?.length ?? 0}명`);
  writeFileSync(new URL('../scripts/backups/cheonjae3-l4-relative-adverb-old-backup.json', import.meta.url), JSON.stringify(oldRel, null, 1));

  if (!APPLY) { console.log('\n[dry-run] --apply 로 적용'); return; }
  if (issuesTotal > 0) { console.error('correctness 이슈가 있어 중단'); process.exit(1); }
  const { error: insErr } = await admin.from('naesin_problem_sheets').insert(newSheets.map((s) => ({ unit_id: DST_UNIT, title: s.title, mode: 'interactive', category: 'problem', sort_order: s.sort_order, questions: s.questions, answer_key: s.answer_key })));
  if (insErr) throw insErr;
  const { error: delErr } = await admin.from('naesin_problem_sheets').delete().in('id', oldRel.map((s) => s.id));
  if (delErr) throw delErr;
  if (prog?.length) await admin.from('naesin_student_progress').update({ problem_completed: false }).eq('unit_id', DST_UNIT).eq('problem_completed', true);
  // whether/if 시트를 뒤로
  const rest = (old ?? []).filter((s) => !OLD_SHEET_TITLES.includes(s.title)).sort((a, b) => a.sort_order - b.sort_order);
  for (let i = 0; i < rest.length; i++) await admin.from('naesin_problem_sheets').update({ sort_order: newSheets.length + i }).eq('id', rest[i].id);
  console.log(`\n✓ 적용: 새 시트 ${newSheets.length}장 삽입, 구 시트 ${oldRel.length}장 삭제 (백업: scripts/backups/cheonjae3-l4-relative-adverb-old-backup.json)`);
}
main().catch((e) => { console.error(e); process.exit(1); });
