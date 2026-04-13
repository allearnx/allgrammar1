#!/usr/bin/env node
// 학원 온보딩 Funnel — v2 (onboarding 필드 무시, 실질 신호 기반)
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envFile = readFileSync(resolve(__dirname, '../.env.local'), 'utf-8');
const env = Object.fromEntries(
  envFile
    .split('\n')
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const now = new Date();
const daysAgo = (n) => new Date(now.getTime() - n * 864e5).toISOString();
const since7d = daysAgo(7);

// 1. 학원
const { data: academies } = await supabase
  .from('academies')
  .select('id, name, created_at, owner_id, onboarding_completed_at, invite_code, services, free_service, can_manage_content')
  .order('created_at', { ascending: true });

// 2. 사용자 + auth에서 last_sign_in_at
const { data: users } = await supabase
  .from('users')
  .select('id, academy_id, role, is_active, created_at');

// auth.users에서 last_sign_in_at 가져오기 (admin API)
const { data: authList } = await supabase.auth.admin.listUsers({ perPage: 1000 });
const authById = new Map();
for (const u of authList?.users || []) authById.set(u.id, u);

// 3. 학생 설정
const { data: studentSettings } = await supabase
  .from('naesin_student_settings')
  .select('student_id, textbook_id');

// 4. 활동
const [dailyLog, passages, problems, vocabSets, videos, memory] = await Promise.all([
  supabase.from('learning_daily_log').select('student_id, date'),
  supabase.from('naesin_passage_attempts').select('student_id, created_at'),
  supabase.from('naesin_problem_attempts').select('student_id, created_at'),
  supabase.from('naesin_vocab_quiz_set_results').select('student_id, created_at'),
  supabase.from('naesin_grammar_video_progress').select('student_id, updated_at'),
  supabase.from('student_memory_progress').select('student_id, updated_at'),
]);

// 인덱싱
const ownersByAcademy = new Map(); // admin/teacher users for academy
const studentsByAcademy = new Map();
for (const u of users) {
  if (!u.academy_id) continue;
  if (u.role === 'admin' || u.role === 'teacher') {
    if (!ownersByAcademy.has(u.academy_id)) ownersByAcademy.set(u.academy_id, []);
    ownersByAcademy.get(u.academy_id).push(u);
  }
  if (u.role === 'student') {
    if (!studentsByAcademy.has(u.academy_id)) studentsByAcademy.set(u.academy_id, []);
    studentsByAcademy.get(u.academy_id).push(u);
  }
}

const studentsWithTextbook = new Set((studentSettings || []).filter((s) => s.textbook_id).map((s) => s.student_id));
const studentAcademy = new Map();
for (const u of users) if (u.role === 'student' && u.academy_id) studentAcademy.set(u.id, u.academy_id);

const academyHasActivity = new Set();
const academyRecentActivity = new Set();
const academyActiveStudents = new Map();

function markActivity(rows, timeField) {
  for (const r of rows || []) {
    const ac = studentAcademy.get(r.student_id);
    if (!ac) continue;
    academyHasActivity.add(ac);
    if (!academyActiveStudents.has(ac)) academyActiveStudents.set(ac, new Set());
    academyActiveStudents.get(ac).add(r.student_id);
    const t = r[timeField];
    if (t && t >= since7d) academyRecentActivity.add(ac);
  }
}
markActivity(dailyLog.data, 'date');
markActivity(passages.data, 'created_at');
markActivity(problems.data, 'created_at');
markActivity(vocabSets.data, 'created_at');
markActivity(videos.data, 'updated_at');
markActivity(memory.data, 'updated_at');

// Funnel 단계 (v2)
const funnel = {
  s1_signup: [], // 학원 생성
  s2_owner_login: [], // 원장이 실제 로그인 1회 이상
  s2b_owner_recent: [], // 원장이 최근 7일 내 로그인
  s3_invited_student: [], // 학생 1명 이상 생성
  s4_student_login: [], // 학생 1명 이상 실제 로그인
  s5_student_textbook: [], // 학생이 교과서 선택
  s6_any_activity: [], // 학생 학습 활동 있음
  s7_multi_student_active: [], // 2명+ 학생 활동
  s8_recent_activity: [], // 최근 7일 활동
};

const details = {};

for (const a of academies) {
  const rec = {
    id: a.id,
    name: a.name,
    created: a.created_at.slice(0, 10),
    ageInDays: Math.floor((now - new Date(a.created_at)) / 864e5),
  };
  funnel.s1_signup.push(rec);

  // 원장
  const owners = ownersByAcademy.get(a.id) || [];
  const ownerAuth = owners.map((o) => authById.get(o.id)).filter(Boolean);
  const ownerLastSignIn = ownerAuth
    .map((u) => u?.last_sign_in_at)
    .filter(Boolean)
    .sort()
    .pop();
  rec.ownerLastSignIn = ownerLastSignIn ? ownerLastSignIn.slice(0, 10) : null;
  rec.ownerCount = owners.length;

  if (!ownerLastSignIn) {
    details[a.id] = { ...rec, dropAt: 's2_owner_login' };
    continue;
  }
  funnel.s2_owner_login.push(rec);

  if (ownerLastSignIn >= since7d) funnel.s2b_owner_recent.push(rec);

  // 학생 초대
  const students = studentsByAcademy.get(a.id) || [];
  rec.studentCount = students.length;
  if (students.length === 0) {
    details[a.id] = { ...rec, dropAt: 's3_invited_student' };
    continue;
  }
  funnel.s3_invited_student.push(rec);

  // 학생 로그인
  const studentLoggedIn = students.filter((s) => authById.get(s.id)?.last_sign_in_at);
  rec.studentLoggedInCount = studentLoggedIn.length;
  if (studentLoggedIn.length === 0) {
    details[a.id] = { ...rec, dropAt: 's4_student_login' };
    continue;
  }
  funnel.s4_student_login.push(rec);

  // 교과서
  const withBook = students.filter((s) => studentsWithTextbook.has(s.id));
  rec.studentsWithTextbook = withBook.length;
  if (withBook.length === 0) {
    details[a.id] = { ...rec, dropAt: 's5_student_textbook' };
    continue;
  }
  funnel.s5_student_textbook.push(rec);

  // 활동
  if (!academyHasActivity.has(a.id)) {
    details[a.id] = { ...rec, dropAt: 's6_any_activity' };
    continue;
  }
  funnel.s6_any_activity.push(rec);

  const active = (academyActiveStudents.get(a.id) || new Set()).size;
  rec.activeCount = active;
  if (active < 2) {
    details[a.id] = { ...rec, dropAt: 's7_multi_student_active' };
    continue;
  }
  funnel.s7_multi_student_active.push(rec);

  if (!academyRecentActivity.has(a.id)) {
    details[a.id] = { ...rec, dropAt: 's8_recent_activity' };
    continue;
  }
  funnel.s8_recent_activity.push(rec);
  details[a.id] = { ...rec, dropAt: 'survived' };
}

function pct(a, b) {
  return b === 0 ? '0%' : `${Math.round((a / b) * 100)}%`;
}

console.log('\n═══════════════════════════════════════════════════════════════════');
console.log('학원 실사용 Funnel v2 (auth.last_sign_in_at + 실활동 기반)');
console.log('═══════════════════════════════════════════════════════════════════\n');

const steps = [
  ['S1', '학원 가입', 's1_signup'],
  ['S2', '원장이 실제로 로그인한 적 있음', 's2_owner_login'],
  ['S2b', '└ 원장이 최근 7일 내 로그인', 's2b_owner_recent'],
  ['S3', '학생 계정 1명 이상 생성', 's3_invited_student'],
  ['S4', '학생 1명이라도 실제 로그인', 's4_student_login'],
  ['S5', '학생이 교과서 선택', 's5_student_textbook'],
  ['S6', '학생이 학습 활동 1회 이상', 's6_any_activity'],
  ['S7', '2명+ 학생이 활동', 's7_multi_student_active'],
  ['S8', '최근 7일 내 활동', 's8_recent_activity'],
];

const baseline = funnel.s1_signup.length;
let prev = baseline;
for (const [label, desc, key] of steps) {
  const n = funnel[key].length;
  const pctTotal = pct(n, baseline);
  const pctPrev = pct(n, prev);
  const drop = prev - n;
  const isBranch = label === 'S2b';
  console.log(
    `${label.padEnd(4)}${desc.padEnd(40)}  ${String(n).padStart(2)}/${baseline}  (${pctTotal.padStart(4)} total${isBranch ? '' : `, ${pctPrev.padStart(4)} prev`})${!isBranch && drop > 0 ? `  ❌ drop ${drop}` : ''}`
  );
  if (!isBranch) prev = n;
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('학원별 드롭 지점');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const dropLabels = {
  s2_owner_login: '❌ 원장이 한 번도 로그인 안 함',
  s3_invited_student: '❌ 학생 초대 전혀 안 함',
  s4_student_login: '❌ 학생 초대했지만 학생 로그인 0',
  s5_student_textbook: '❌ 학생 로그인했지만 교과서 선택 안 함',
  s6_any_activity: '❌ 교과서는 선택했지만 학습 0',
  s7_multi_student_active: '⚠️  1명만 활동 (혼자 테스트?)',
  s8_recent_activity: '⚠️  예전엔 썼지만 최근 7일 dead',
  survived: '✅ 현재 사용 중',
};

const byDrop = {};
for (const r of Object.values(details)) {
  if (!byDrop[r.dropAt]) byDrop[r.dropAt] = [];
  byDrop[r.dropAt].push(r);
}

for (const key of ['s2_owner_login', 's3_invited_student', 's4_student_login', 's5_student_textbook', 's6_any_activity', 's7_multi_student_active', 's8_recent_activity', 'survived']) {
  const list = byDrop[key];
  if (!list || list.length === 0) continue;
  console.log(`\n${dropLabels[key]} — ${list.length}곳`);
  for (const r of list) {
    const parts = [];
    parts.push(`원장로그인:${r.ownerLastSignIn || '없음'}`);
    parts.push(`학생${r.studentCount ?? 0}명`);
    if (r.studentLoggedInCount !== undefined) parts.push(`로그인${r.studentLoggedInCount}`);
    if (r.studentsWithTextbook !== undefined) parts.push(`교과서${r.studentsWithTextbook}`);
    if (r.activeCount !== undefined) parts.push(`활동${r.activeCount}명`);
    console.log(`    ${r.name.padEnd(22)} ${r.ageInDays}일  [${parts.join(' / ')}]`);
  }
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('핵심 인사이트');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
const transitions = [
  ['S1→S2', 's1_signup', 's2_owner_login', '가입은 했는데 원장이 로그인 안 함'],
  ['S2→S3', 's2_owner_login', 's3_invited_student', '로그인은 했는데 학생 초대 안 함'],
  ['S3→S4', 's3_invited_student', 's4_student_login', '학생 초대했는데 학생이 로그인 안 함'],
  ['S4→S5', 's4_student_login', 's5_student_textbook', '학생 로그인했는데 교과서 선택 안 함'],
  ['S5→S6', 's5_student_textbook', 's6_any_activity', '교과서 선택했는데 학습 0'],
  ['S6→S7', 's6_any_activity', 's7_multi_student_active', '1명만 활동 (진짜 도입 못함)'],
  ['S7→S8', 's7_multi_student_active', 's8_recent_activity', '과거엔 사용했지만 최근 dead'],
];
console.log('');
const rates = transitions.map(([label, from, to, desc]) => {
  const f = funnel[from].length;
  const t = funnel[to].length;
  const drop = f - t;
  return { label, desc, f, t, drop, rate: f > 0 ? drop / f : 0 };
});
rates.sort((a, b) => b.drop - a.drop);
for (const r of rates) {
  if (r.drop === 0) continue;
  console.log(`  ${r.label}  ${r.drop}곳 드롭 (${Math.round(r.rate * 100)}%)  — ${r.desc}`);
}
