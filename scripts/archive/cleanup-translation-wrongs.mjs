/**
 * 곡선따옴표/대시 채점 버그로 잘못 기록된 whole-passage 영작 가짜 오답 정리.
 * 수정된 normalize 로 재채점했을 때 >=80(통과)이 되는 source_type='translation'
 * 오답 레코드를 삭제한다. 삭제 전 전체 레코드를 JSON 백업으로 남긴다.
 *
 *   node scripts/cleanup-translation-wrongs.mjs          # dry-run (조회만)
 *   node scripts/cleanup-translation-wrongs.mjs --apply  # 실제 삭제
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';

for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_0-9]+)=(.*)$/);
  if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, '');
}

const APPLY = process.argv.includes('--apply');
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

function newNormalize(text) {
  return String(text)
    .replace(/[‘’`´]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—−]/g, '-')
    .toLowerCase()
    .replace(/[^a-z0-9'\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
function oldNormalize(text) {
  return String(text).toLowerCase().replace(/[^a-z0-9'\s]/g, '').replace(/\s+/g, ' ').trim();
}
function lcsLen(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
  return dp[m][n];
}
function grade(normFn, original, student) {
  const o = normFn(original), s = normFn(student);
  if (o === s) return 100;
  const ow = o.split(' ');
  if (ow.length === 0 || (ow.length === 1 && ow[0] === '')) return 0;
  return Math.min(Math.round((lcsLen(ow, s.split(' ')) / ow.length) * 100), 100);
}

const { data, error } = await supabase
  .from('naesin_wrong_answers')
  .select('id, student_id, unit_id, stage, source_type, question_data, resolved, created_at, round, sheet_id')
  .eq('source_type', 'translation');
if (error) { console.error(error); process.exit(1); }

const toDelete = [];
for (const row of data) {
  const qd = row.question_data || {};
  const correct = qd.correctAnswer ?? qd.correct_answer;
  const student = qd.userAnswer ?? qd.user_answer;
  if (correct == null || student == null) continue;
  const oldScore = grade(oldNormalize, correct, student);
  const newScore = grade(newNormalize, correct, student);
  if (oldScore < 80 && newScore >= 80) {
    toDelete.push({ ...row, _oldScore: oldScore, _newScore: newScore });
  }
}

console.log(`삭제 대상: ${toDelete.length}건`);
for (const r of toDelete) {
  console.log(`  id=${r.id} ${r._oldScore}→${r._newScore} student=${r.student_id} unit=${r.unit_id}`);
}

// 백업
const backupPath = new URL('../scripts/translation-wrongs-backup.json', import.meta.url);
writeFileSync(backupPath, JSON.stringify(toDelete, null, 2));
console.log(`백업 저장: scripts/translation-wrongs-backup.json (${toDelete.length}건)`);

if (!APPLY) {
  console.log('\n[dry-run] 실제 삭제하려면 --apply 플래그를 붙이세요.');
  process.exit(0);
}

const ids = toDelete.map((r) => r.id);
const { error: delErr, count } = await supabase
  .from('naesin_wrong_answers')
  .delete({ count: 'exact' })
  .in('id', ids);
if (delErr) { console.error('삭제 실패:', delErr); process.exit(1); }
console.log(`\n삭제 완료: ${count}건`);
