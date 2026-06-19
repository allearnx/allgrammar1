/**
 * MULTI_ANSWER_UNDERCOUNT 일괄 수정 + 관대 재채점.
 *   node scripts/fix-multi-undercount.mjs            # dry-run 분석
 *   node scripts/fix-multi-undercount.mjs --apply    # 자동수정 43건 적용 + 재채점
 *
 * 자동수정: 현재 단일정답이 해설 2마커(또는 명시개수)에 포함 → 정답=마커집합, type=multi_choice.
 * 동기화: 템플릿이면 source_template_id 복사 시트까지. 단독 시트는 그 시트만.
 * 재채점(공정): 전환된 문항은 "학생이 고른 게 정답집합의 부분집합이면 정답"(단일 UI 보정).
 *   → 점수는 오르거나 유지만 됨. 수동확인 22건은 건드리지 않고 보고만.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';
for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_0-9]+)=(.*)$/); if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, '');
}
const APPLY = process.argv.includes('--apply');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const MARKER_RE = /[①-⑩ⓐ-ⓩ㉠-㉤]/g;
const CIRC = { '①':1,'②':2,'③':3,'④':4,'⑤':5,'⑥':6,'⑦':7,'⑧':8,'⑨':9,'⑩':10 };
function markerNum(ch) { if (CIRC[ch]) return CIRC[ch]; const c = ch.codePointAt(0); if (c>=0x24D0&&c<=0x24E9) return c-0x24D0+1; if (c>=0x3260&&c<=0x3269) return c-0x3260+1; return null; }
const uncircleAns = (s) => String(s).replace(/[①②③④⑤⑥⑦⑧⑨⑩]+/g, (m) => [...m].map((c) => CIRC[c]).join(','));
function expectedCount(q) { let m; if (m=q.match(/정답\s*(\d+)\s*개/)) return +m[1]; if (m=q.match(/\(\s*(?:정답\s*)?(\d+)\s*개\s*\)/)) return +m[1]; if (m=q.match(/(\d+)\s*개\s*(?:이상\s*)?(?:고르|선택|찾)/)) return +m[1]; if (/(?:^|[^가-힣\d])두\s*개/.test(q)) return 2; return null; }
function analyzeQ(q) {
  if (!(q.options && q.options.length >= 2) || q.answer == null) return null;
  const ansStr = uncircleAns(q.answer);
  const numAns = ansStr.split(',').map((p) => p.trim()).filter((p) => /^\d+$/.test(p)).length;
  const qt = q.question || ''; const exp = expectedCount(qt); const isModu = /모두\s*고르|모두\s*골|all that apply/i.test(qt);
  const markerNums = [...new Set((q.explanation || '').match(MARKER_RE) || [])].map(markerNum).filter((x) => x != null && x >= 1 && x <= q.options.length).sort((a, b) => a - b);
  let trigger = null, expect = null;
  if (exp != null && exp >= 2 && numAns < exp) { trigger = `명시${exp}개`; expect = exp; }
  else if (numAns === 1 && isModu && markerNums.length === 2) { trigger = '모두+해설2'; expect = 2; }
  if (!trigger) return null;
  const curNum = parseInt(ansStr, 10);
  const autoFix = markerNums.length === expect && markerNums.includes(curNum);
  return { trigger, expect, curAnswer: String(q.answer), markerNums, derived: markerNums.join(', '), autoFix };
}
async function fetchAll(t, cols) { let out = [], from = 0; for (;;) { const { data } = await sb.from(t).select(cols).range(from, from + 999); if (!data?.length) break; out.push(...data); if (data.length < 1000) break; from += 1000; } return out; }

// 관대 매칭: 전환 문항은 학생이 고른 번호들이 정답집합 부분집합이면 정답
function lenientCorrect(userAns, correctSet) {
  const u = String(userAns ?? '').split(',').map((x) => x.trim()).filter((x) => /^\d+$/.test(x)).map(Number);
  return u.length > 0 && u.every((x) => correctSet.has(x));
}
const CIRC2 = { '①':'1','②':'2','③':'3','④':'4','⑤':'5','⑥':'6','⑦':'7','⑧':'8','⑨':'9','⑩':'10' };
const unc = (s) => String(s).replace(/[①②③④⑤⑥⑦⑧⑨⑩]+/g, (m) => [...m].map((c) => CIRC2[c]).join(','));
function normMulti(s){const p=String(s).split(',').map(v=>v.trim());if(p.length<=1)return String(s).trim().toLowerCase();if(p.every(x=>/^\d+$/.test(x)))return p.sort((a,b)=>+a-+b).join(', ');return p.map(x=>x.toLowerCase()).sort().join(', ');}
function matchMcq(u0,c0,opt){const u=unc(u0).trim().toLowerCase(),c=unc(c0).trim().toLowerCase();if(u===c)return true;if(c.includes(',')||u.includes(','))if(normMulti(u)===normMulti(c))return true;if(!opt||!opt.length)return false;const i=parseInt(u,10);if(!isNaN(i)&&i>=1&&i<=opt.length&&opt[i-1].trim().toLowerCase()===c)return true;return false;}
const extractAns = (v) => v == null ? '' : typeof v === 'object' && 'answer' in v ? String(v.answer ?? '') : String(v);

async function run() {
  const templates = await fetchAll('naesin_templates', 'id, title, questions, answer_key');
  const sheets = await fetchAll('naesin_problem_sheets', 'id, title, source_template_id, unit_id, mode, category, questions, answer_key');
  const groups = new Map();
  for (const t of templates) groups.set(t.id, { rootId: t.id, template: t, sheets: [] });
  for (const s of sheets) { if (s.source_template_id && groups.has(s.source_template_id)) groups.get(s.source_template_id).sheets.push(s); else groups.set(s.id, { rootId: s.id, template: null, sheets: [s] }); }

  const auto = [], manual = [];
  for (const g of groups.values()) {
    const ref = g.template || g.sheets[0]; if (!ref?.questions) continue;
    for (const q of ref.questions) { const a = analyzeQ(q); if (!a) continue;
      (a.autoFix ? auto : manual).push({ group: g, title: ref.title, number: q.number, ...a }); }
  }
  console.log(`자동수정 ${auto.length} / 수동확인 ${manual.length}`);
  writeFileSync(new URL('../scripts/multi-undercount-plan.json', import.meta.url),
    JSON.stringify({ auto: auto.map(({group,...r})=>({rootId:group.rootId,...r})), manual: manual.map(({group,...r})=>({rootId:group.rootId,...r})) }, null, 2));

  if (!APPLY) { console.log('[dry-run] --apply 로 적용'); return; }

  // 1) 콘텐츠 적용 + 전환맵(sheetId → {qNum → correctSet}) 구축
  const backup = {}; const convertedBySheet = new Map(); // sheetId -> Map(qNum -> Set)
  const writeQ = async (table, row, fixes) => {
    backup[`${table}_${row.id}`] = JSON.parse(JSON.stringify({ questions: row.questions, answer_key: row.answer_key }));
    for (const f of fixes) { const idx = row.questions.findIndex((x) => x.number === f.number); if (idx < 0) continue;
      row.questions[idx].answer = f.derived; row.questions[idx].type = 'multi_choice'; row.answer_key[idx] = f.derived;
      if (table === 'naesin_problem_sheets') { if (!convertedBySheet.has(row.id)) convertedBySheet.set(row.id, new Map()); convertedBySheet.get(row.id).set(f.number, new Set(f.markerNums)); }
    }
    await sb.from(table).update({ questions: row.questions, answer_key: row.answer_key }).eq('id', row.id);
  };
  // 그룹별로 묶어서 적용
  const byGroup = new Map();
  for (const r of auto) { if (!byGroup.has(r.group.rootId)) byGroup.set(r.group.rootId, { group: r.group, fixes: [] }); byGroup.get(r.group.rootId).fixes.push(r); }
  for (const { group, fixes } of byGroup.values()) {
    if (group.template) await writeQ('naesin_templates', group.template, fixes);
    for (const s of group.sheets) await writeQ('naesin_problem_sheets', s, fixes);
  }
  console.log(`✓ 콘텐츠 적용: ${auto.length}문항 (그룹 ${byGroup.size})`);

  // 2) 시도 있는 시트 관대 재채점
  console.log('\n=== 재채점 (관대 매칭) ===');
  for (const [sheetId, convMap] of convertedBySheet) {
    const { data: sheet } = await sb.from('naesin_problem_sheets').select('id, unit_id, answer_key, questions, mode, category').eq('id', sheetId).single();
    const { data: attempts } = await sb.from('naesin_problem_attempts').select('id, student_id, answers, score, total_questions').eq('sheet_id', sheetId).order('created_at');
    if (!attempts?.length) continue;
    const ak = sheet.answer_key, qs = sheet.questions, stage = sheet.category === 'mock_exam' ? 'mockExam' : 'problem';
    for (const at of attempts) {
      let correct = 0; const wrongs = [];
      for (let i = 0; i < at.total_questions; i++) { const ua = (at.answers || [])[i]; const q = qs[i]; const qn = q?.number;
        let ok; if (convMap.has(qn)) ok = lenientCorrect(ua, convMap.get(qn)); else ok = matchMcq(String(ua ?? ''), extractAns(ak[i]), q?.options);
        if (ok) correct++; else wrongs.push({ number: i + 1, userAnswer: ua ?? '', correctAnswer: extractAns(ak[i]), question: q?.question }); }
      const ns = Math.round((correct / at.total_questions) * 100);
      console.log(`  [${sheet.id.slice(0,8)}] stu=${at.student_id.slice(0,8)} ${at.score}→${ns}`);
      await sb.from('naesin_problem_attempts').update({ score: ns, wrong_answers: wrongs }).eq('id', at.id);
      await sb.from('naesin_wrong_answers').delete().eq('student_id', at.student_id).eq('sheet_id', sheetId);
      if (wrongs.length) await sb.from('naesin_wrong_answers').insert(wrongs.map((wa) => { const q = qs[wa.number - 1]; return { student_id: at.student_id, unit_id: sheet.unit_id, stage, source_type: sheet.mode, question_data: { ...wa, ...(q?.options ? { options: q.options } : {}) }, sheet_id: sheetId }; }));
    }
  }
  writeFileSync(new URL('../scripts/multi-undercount-backup.json', import.meta.url), JSON.stringify(backup, null, 2));
  console.log('\n✓ 완료 (백업: scripts/multi-undercount-backup.json)');
}
await run();
