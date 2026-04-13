#!/usr/bin/env node
// 학원별 활성도 리포트 — 16개 학원 실사용 현황 분석
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

// 1. 학원 목록
const { data: academies, error: acErr } = await supabase
  .from('academies')
  .select('id, name, created_at, services, free_service, can_manage_content, owner_id')
  .order('created_at', { ascending: true });
if (acErr) throw acErr;

console.log(`\n📊 총 학원 수: ${academies.length}개\n`);

// 2. 모든 학생 조회
const { data: allUsers, error: uErr } = await supabase
  .from('users')
  .select('id, academy_id, role, created_at, is_active');
if (uErr) throw uErr;

const usersByAcademy = new Map();
for (const u of allUsers) {
  if (!u.academy_id) continue;
  if (!usersByAcademy.has(u.academy_id)) usersByAcademy.set(u.academy_id, []);
  usersByAcademy.get(u.academy_id).push(u);
}

// 3. 활동 데이터 병렬 조회 (전체)
const since30d = daysAgo(30);
const since7d = daysAgo(7);

const [
  dailyLog30d,
  vocabQuizSetResults,
  passageAttempts,
  problemAttempts,
  grammarVideoProgress,
  wrongAnswers,
  grammarChatSessions,
  dialogueAttempts,
  memoryProgress,
] = await Promise.all([
  supabase.from('learning_daily_log').select('student_id, date, context_type, seconds').gte('date', since30d.slice(0, 10)),
  supabase.from('naesin_vocab_quiz_set_results').select('student_id, created_at').gte('created_at', since30d),
  supabase.from('naesin_passage_attempts').select('student_id, created_at, type, score').gte('created_at', since30d),
  supabase.from('naesin_problem_attempts').select('student_id, created_at, score, total_questions').gte('created_at', since30d),
  supabase.from('naesin_grammar_video_progress').select('student_id, updated_at, completed').gte('updated_at', since30d),
  supabase.from('naesin_wrong_answers').select('student_id, stage, created_at').gte('created_at', since30d),
  supabase.from('naesin_grammar_chat_sessions').select('student_id, created_at').gte('created_at', since30d),
  supabase.from('naesin_dialogue_attempts').select('student_id, created_at').gte('created_at', since30d),
  supabase.from('student_memory_progress').select('student_id, updated_at').gte('updated_at', since30d),
]);

const errs = { dailyLog30d, vocabQuizSetResults, passageAttempts, problemAttempts, grammarVideoProgress, wrongAnswers, grammarChatSessions, dialogueAttempts, memoryProgress };
for (const [k, v] of Object.entries(errs)) if (v.error) console.error(`⚠️  ${k}:`, v.error.message);

function bucket(rows, keyFn) {
  const m = new Map();
  for (const r of rows || []) {
    const k = keyFn(r);
    if (!k) continue;
    m.set(k, (m.get(k) || 0) + 1);
  }
  return m;
}

// student_id → academy_id map
const studentAcademy = new Map();
for (const u of allUsers) {
  if (u.academy_id && u.role === 'student') studentAcademy.set(u.id, u.academy_id);
}

function aggregateByAcademy(rows, valueFn = () => 1) {
  const m = new Map();
  for (const r of rows || []) {
    const ac = studentAcademy.get(r.student_id);
    if (!ac) continue;
    m.set(ac, (m.get(ac) || 0) + valueFn(r));
  }
  return m;
}

// 집계
const secondsByAcademy = (() => {
  const m = new Map();
  for (const r of dailyLog30d.data || []) {
    const ac = studentAcademy.get(r.student_id);
    if (!ac) continue;
    if (!m.has(ac)) m.set(ac, { naesin: 0, voca: 0, days: new Set() });
    const rec = m.get(ac);
    rec[r.context_type] = (rec[r.context_type] || 0) + r.seconds;
    rec.days.add(r.date);
  }
  return m;
})();

const vocabSetCounts = aggregateByAcademy(vocabQuizSetResults.data); // 내신 어휘 테스트
const passageCounts = aggregateByAcademy(passageAttempts.data); // 교과서 암기
const problemCounts = aggregateByAcademy(problemAttempts.data); // 문제풀이
const videoCounts = aggregateByAcademy(grammarVideoProgress.data); // 문법 영상
const chatCounts = aggregateByAcademy(grammarChatSessions.data); // 문법 챗봇
const dialogueCounts = aggregateByAcademy(dialogueAttempts.data); // 대화문
const memoryCounts = aggregateByAcademy(memoryProgress.data); // 올킬보카(레벨/올킬 단어)

// 활성 학생 수 (최근 30일에 뭐라도 한 학생)
const activeStudentsByAc = new Map();
function markActive(rows) {
  for (const r of rows || []) {
    const ac = studentAcademy.get(r.student_id);
    if (!ac) continue;
    if (!activeStudentsByAc.has(ac)) activeStudentsByAc.set(ac, new Set());
    activeStudentsByAc.get(ac).add(r.student_id);
  }
}
markActive(dailyLog30d.data);
markActive(vocabQuizSetResults.data);
markActive(passageAttempts.data);
markActive(problemAttempts.data);
markActive(grammarVideoProgress.data);
markActive(dialogueAttempts.data);
markActive(memoryProgress.data);

// 출력
const rows = [];
for (const a of academies) {
  const students = (usersByAcademy.get(a.id) || []).filter((u) => u.role === 'student');
  const activeStudents = (activeStudentsByAc.get(a.id) || new Set()).size;
  const sec = secondsByAcademy.get(a.id) || { naesin: 0, voca: 0, days: new Set() };
  rows.push({
    name: a.name,
    id: a.id.slice(0, 8),
    plan: (a.services || []).join(',') || (a.free_service ? `free:${a.free_service}` : '-'),
    students: students.length,
    active30d: activeStudents,
    days: sec.days.size,
    naesinMin: Math.round(sec.naesin / 60),
    vocaMin: Math.round(sec.voca / 60),
    stage1_vocab: vocabSetCounts.get(a.id) || 0,
    stage2_passage: passageCounts.get(a.id) || 0,
    stage3_dialogue: dialogueCounts.get(a.id) || 0,
    stage4_video: videoCounts.get(a.id) || 0,
    stage4_chat: chatCounts.get(a.id) || 0,
    stage5_problem: problemCounts.get(a.id) || 0,
    allkill: memoryCounts.get(a.id) || 0,
    created: a.created_at.slice(0, 10),
  });
}

// 활성 순 정렬
rows.sort((a, b) => {
  const scoreA = a.active30d * 1000 + a.stage5_problem + a.stage2_passage;
  const scoreB = b.active30d * 1000 + b.stage5_problem + b.stage2_passage;
  return scoreB - scoreA;
});

console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log('학원별 최근 30일 활성도 (내림차순)');
console.log('═══════════════════════════════════════════════════════════════════════════════\n');

for (const r of rows) {
  console.log(`[${r.name}] (${r.id}, 가입:${r.created}, 플랜:${r.plan})`);
  console.log(`  학생 ${r.students}명 중 활성 ${r.active30d}명 / 학습일수 ${r.days}일 / 시간: 내신${r.naesinMin}분 + 보카${r.vocaMin}분`);
  console.log(`  내신  Step1어휘:${r.stage1_vocab}  Step2본문:${r.stage2_passage}  Step3대화:${r.stage3_dialogue}  Step4영상:${r.stage4_video}/챗봇:${r.stage4_chat}  Step5문제:${r.stage5_problem}`);
  console.log(`  올킬보카 활동: ${r.allkill}`);
  console.log('');
}

// 요약
const active = rows.filter((r) => r.active30d > 0);
const deadZero = rows.filter((r) => r.active30d === 0);
const usesStage5 = rows.filter((r) => r.stage5_problem > 0);
const usesStage3Plus = rows.filter((r) => r.stage3_dialogue + r.stage4_video + r.stage5_problem > 0);

console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log('요약');
console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log(`전체 학원: ${rows.length}`);
console.log(`최근 30일 활성(학생 1명이라도 활동): ${active.length}`);
console.log(`완전 dead (30일 활동 0): ${deadZero.length}`);
console.log(`Step3(대화)+Step4(영상)+Step5(문제) 중 하나라도 사용: ${usesStage3Plus.length}`);
console.log(`Step5(문제풀이) 사용: ${usesStage5.length}`);
console.log('');
console.log('dead 학원 목록:');
for (const r of deadZero) console.log(`  - ${r.name} (학생 ${r.students}, 가입 ${r.created})`);
