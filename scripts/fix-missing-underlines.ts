/**
 * "밑줄 친" 문항인데 <u> 태그가 없는 문항 복구 (2026-09-13)
 *
 * 학생 화면(FormattedText)은 <u>…</u>만 밑줄로 그린다. 추출 과정에서 밑줄이 *…* / _…_ 마커로 남거나
 * 통째로 유실된 문항은 학생이 무엇을 묻는지 알 수 없다. 처리 순서:
 *   (a) 마커 변환: *text* / **text** / _text_ / __text__ → <u>text</u>
 *   (b) 규칙 기반 복원: 지시문·<보기>·해설·문항 유형에서 대상을 추론해 보기/문장마다 정확히 1곳에 <u> 부착
 *       (모든 단위 문장이 정확히 1개씩 매칭될 때만 적용 — 하나라도 0개/2개면 미적용)
 *   (c) 지시문 재작성: 대상을 안전하게 복원할 수 없으면 "밑줄 친"을 빼고 풀 수 있는 지시문으로
 *   나머지는 수동 작업 목록으로 출력.
 * 로직 본체는 src/lib/naesin/fix-underlines.ts (sanitizeQuestions가 저장 시 같은 로직을 자동 적용).
 * 정답(answer/answer_key)은 절대 건드리지 않는다. 적용 후 시도가 있는 시트는 regradeSheet로 재채점(오답 화면 지문 갱신).
 *
 *   npx tsx --env-file=.env.local scripts/fix-missing-underlines.ts                # dry-run
 *   npx tsx --env-file=.env.local scripts/fix-missing-underlines.ts --apply
 *   옵션: --table=sheets|templates|all (기본 all)  --sample=N (경로 b 무작위 N건 출력)  --verbose
 *         --manual=path.json (수동 작업 목록 저장)  --backup-dir=dir (기본 scripts/backups/missing-underlines-YYYYMMDD)
 */
import { mkdirSync, writeFileSync } from 'fs';
import { createAdminClient } from '@/lib/supabase/admin';
import { regradeSheet } from '@/lib/naesin/regrade-sheet';
import { fixMissingUnderline, hasMissingUnderline, type UnderlinePath, type UnderlineQuestion } from '@/lib/naesin/fix-underlines';

type Q = UnderlineQuestion;
type Table = 'naesin_problem_sheets' | 'naesin_templates';
type Row = { id: string; title: string; questions: Q[] };
type Path = UnderlinePath;
const hasU = (t: string) => /<u>/.test(t);

const ARGS = process.argv.slice(2);
const APPLY = ARGS.includes('--apply');
const VERBOSE = ARGS.includes('--verbose');
const arg = (k: string) => ARGS.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3);
const TABLE = arg('table') ?? 'all';
const SAMPLE = Number(arg('sample') ?? 0);
const MANUAL_OUT = arg('manual');
const SHOW = arg('show'); // 노트에 이 문자열이 포함된 문항 전문 출력 (규칙 검수용)
const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
const BACKUP_DIR = arg('backup-dir') ?? `scripts/backups/missing-underlines-${today}`;

// ───────────────────────── 실행 ─────────────────────────
async function fetchAll(admin: ReturnType<typeof createAdminClient>, table: Table): Promise<Row[]> {
  const rows: Row[] = [];
  for (let from = 0; ; from += 500) {
    const { data, error } = await admin.from(table).select('id, title, questions').order('id').range(from, from + 499).returns<Row[]>();
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < 500) break;
  }
  return rows;
}

async function main() {
  const admin = createAdminClient();
  const tables: Table[] = TABLE === 'sheets' ? ['naesin_problem_sheets'] : TABLE === 'templates' ? ['naesin_templates'] : ['naesin_problem_sheets', 'naesin_templates'];
  const counts: Record<Table, Record<Path, number>> = {
    naesin_problem_sheets: { a: 0, b: 0, c: 0, manual: 0 },
    naesin_templates: { a: 0, b: 0, c: 0, manual: 0 },
  };
  const ruleCounts = new Map<string, number>();
  const manual: { table: Table; id: string; title: string; number: number; notes: string[]; direction: string; question: string; options?: string[] }[] = [];
  const samples: { table: Table; title: string; number: number; notes: string[]; question: string; options?: string[] }[] = [];
  const touchedSheets: string[] = [];
  let backups = 0;
  mkdirSync(BACKUP_DIR, { recursive: true });

  for (const table of tables) {
    const rows = await fetchAll(admin, table);
    let rowsTouched = 0;
    for (const row of rows) {
      const before = JSON.stringify(row.questions);
      const log: string[] = [];
      for (const q of row.questions ?? []) {
        if (!hasMissingUnderline(q)) continue;
        const answerBefore = JSON.stringify(q.answer);
        const r = fixMissingUnderline(q, row.title ?? '');
        if (JSON.stringify(q.answer) !== answerBefore) throw new Error(`answer changed! ${table} ${row.id} #${q.number}`);
        counts[table][r.path]++;
        for (const n of r.notes) ruleCounts.set(n.replace(/×\d+|\[.*\]/g, ''), (ruleCounts.get(n.replace(/×\d+|\[.*\]/g, '')) ?? 0) + 1);
        const direction = q.question.split('\n').find((l) => /밑줄 친/.test(l)) ?? q.question.split('\n')[0];
        if (r.path === 'manual') manual.push({ table, id: row.id, title: row.title, number: q.number, notes: r.notes, direction: direction.slice(0, 120), question: q.question, options: q.options });
        if (r.path === 'b') samples.push({ table, title: row.title, number: q.number, notes: r.notes, question: q.question, options: q.options });
        log.push(`  #${q.number} [${r.path}] ${r.notes.join(', ')}`);
        if (SHOW && r.notes.some((n) => n.includes(SHOW))) {
          console.log(`\n>>> [${table}] ${row.title} #${q.number} (${r.notes.join(', ')}) ans=${JSON.stringify(q.answer)}\n${q.question}`);
          (q.options ?? []).forEach((o, i) => console.log(`  (${i + 1}) ${o}`));
          if (q.explanation) console.log(`  exp: ${q.explanation.slice(0, 160)}`);
        }
      }
      const after = JSON.stringify(row.questions);
      if (after === before) continue;
      rowsTouched++;
      writeFileSync(`${BACKUP_DIR}/${table}_${row.id}.json`, JSON.stringify({ table, id: row.id, title: row.title, questions: JSON.parse(before) }));
      backups++;
      if (VERBOSE) console.log(`\n[${table}] ${row.title} (${row.id.slice(0, 8)})\n${log.join('\n')}`);
      if (!APPLY) continue;
      const { error } = await admin.from(table).update({ questions: row.questions }).eq('id', row.id);
      if (error) throw error;
      if (table === 'naesin_problem_sheets') touchedSheets.push(row.id);
    }
    console.log(`\n[${table}] ${rows.length}행 조회, ${rowsTouched}행 변경${APPLY ? ' (저장됨)' : ''}`);
    console.log(`  경로별: a=${counts[table].a} b=${counts[table].b} c=${counts[table].c} manual=${counts[table].manual}`);
  }

  console.log('\n규칙별 적용 건수:');
  for (const [k, v] of [...ruleCounts.entries()].sort((a, b) => b[1] - a[1])) console.log(`  ${String(v).padStart(5)}  ${k}`);
  console.log(`\n백업 ${backups}건 → ${BACKUP_DIR}`);

  if (SAMPLE > 0) {
    console.log(`\n===== 경로 b 무작위 표본 ${SAMPLE}건 (검수용) =====`);
    const pool = samples.filter((s) => s.table === 'naesin_problem_sheets');
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    for (const s of pool.slice(0, SAMPLE)) {
      console.log(`\n--- ${s.title} #${s.number} (${s.notes.join(', ')})`);
      console.log(s.question.split('\n').filter((l) => hasU(l) || /밑줄 친/.test(l)).join('\n'));
      (s.options ?? []).forEach((o, i) => { if (hasU(o)) console.log(`  (${i + 1}) ${o}`); });
    }
  }

  const manualGroups = new Map<string, number>();
  for (const m of manual) { const k = m.direction.replace(/\d+/g, 'N'); manualGroups.set(k, (manualGroups.get(k) ?? 0) + 1); }
  console.log(`\n===== 수동 작업 목록 ${manual.length}건 (지시문별) =====`);
  for (const [k, v] of [...manualGroups.entries()].sort((a, b) => b[1] - a[1]).slice(0, 60)) console.log(`  ${String(v).padStart(4)}  ${k}`);
  if (MANUAL_OUT) { writeFileSync(MANUAL_OUT, JSON.stringify(manual, null, 1)); console.log(`수동 목록 저장: ${MANUAL_OUT}`); }

  if (!APPLY) { console.log('\n[dry-run] --apply 로 실제 적용'); return; }

  console.log(`\n===== 재채점 (변경 시트 ${touchedSheets.length}개 중 시도 있는 시트) =====`);
  let regraded = 0, scoreChanges = 0;
  for (const id of touchedSheets) {
    const before = await admin.from('naesin_problem_attempts').select('id, score').eq('sheet_id', id);
    if (!before.data?.length) continue;
    const r = await regradeSheet(id);
    const after = await admin.from('naesin_problem_attempts').select('id, score').eq('sheet_id', id);
    const bm = new Map(before.data.map((a) => [a.id, a.score]));
    const diffs = (after.data ?? []).filter((a) => bm.get(a.id) !== a.score).map((a) => `${a.id.slice(0, 8)} ${bm.get(a.id)}→${a.score}`);
    regraded++;
    scoreChanges += diffs.length;
    console.log(`  ${id.slice(0, 8)}: 시도 ${r.total}건, 점수 변동 ${diffs.length}건${diffs.length ? ' ' + diffs.join(', ') : ''}`);
  }
  console.log(`재채점 시트 ${regraded}개, 점수 변동 총 ${scoreChanges}건`);
}

main().catch((e) => { console.error(e); process.exit(1); });
