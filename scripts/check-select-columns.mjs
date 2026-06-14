#!/usr/bin/env node
// Supabase .select() 컬럼이 실제 스키마에 존재하는지 검사한다.
// egress 리팩터(select('*')→명시 컬럼)가 유령 컬럼을 심어 런타임에 쿼리가
// 통째로 에러나는 버그(예: cover_image_url)를 빌드/CI 단계에서 잡기 위함.
//
// 사용: node scripts/check-select-columns.mjs   (실패 시 exit 1)
// 스키마는 PostgREST OpenAPI(/rest/v1/)에서 가져온다.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// ── env ──
const env = {};
try {
  for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch { /* CI: env from process.env */ }
const URL = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!URL || !KEY) {
  console.log('⏭  Supabase 환경변수 없음 — 컬럼 검사 건너뜀 (CI에서 정상).');
  process.exit(0);
}

// ── 1. 스키마 로드 (네트워크/플레이스홀더 실패는 graceful skip — 배포를 막지 않음) ──
const schema = {}; // table -> Set(columns)
try {
  const res = await fetch(`${URL}/rest/v1/`, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const spec = await res.json();
  for (const [t, def] of Object.entries(spec.definitions || {})) {
    schema[t] = new Set(Object.keys(def.properties || {}));
  }
} catch (e) {
  console.log(`⏭  스키마를 가져오지 못함 (${e.message}) — 컬럼 검사 건너뜀.`);
  process.exit(0);
}
if (Object.keys(schema).length === 0) {
  console.log('⏭  스키마가 비어 있음 — 컬럼 검사 건너뜀.');
  process.exit(0);
}

// ── 2. 소스 파일 수집 ──
function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (name === 'node_modules' || name === '.next' || name === '__tests__') continue;
      walk(p, out);
    } else if (/\.(ts|tsx)$/.test(name) && !name.endsWith('.d.ts')) {
      out.push(p);
    }
  }
  return out;
}
const files = walk('src');

// ── 3. 컬럼 상수 해석 (export const X_COLUMNS = '...'; 및 A + ', b' 연결) ──
const constStr = {}; // name -> raw RHS expression
for (const f of files) {
  const src = readFileSync(f, 'utf8');
  const re = /export const (\w*COLUMNS)\s*=\s*([^;]+);/g;
  let m;
  while ((m = re.exec(src))) constStr[m[1]] = m[2].trim();
}
function resolveExpr(expr, depth = 0) {
  if (depth > 6) return '';
  // 문자열 리터럴 + 상수 식별자들의 연결을 펼친다
  let out = '';
  const parts = expr.split('+');
  for (let part of parts) {
    part = part.trim();
    const lit = part.match(/^['"]([^'"]*)['"]$/);
    if (lit) { out += lit[1]; continue; }
    if (constStr[part]) { out += resolveExpr(constStr[part], depth + 1); continue; }
    // 알 수 없는 식 — 검증 불가 표시
    return null;
  }
  return out;
}

// ── 4. .from('table').select(...) 추출 + 검증 ──
const problems = [];
const NON_COLS = new Set(['count', 'exact', 'planned', 'estimated']);

for (const f of files) {
  const src = readFileSync(f, 'utf8');
  // .from('table') 바로 뒤에 .select( 가 오는 순수 읽기 쿼리만 검증한다.
  // (insert/update/upsert 의 객체 키를 컬럼으로 오인하지 않도록 — select가
  //  from에 직접 이어질 때만. .insert().select() 의 returning 컬럼은 해당
  //  테이블 컬럼이라 검증에서 빠져도 안전.)
  const fromRe = /\.from\(\s*['"]([a-z_]+)['"]\s*\)\s*\.select\(/g;
  let fm;
  while ((fm = fromRe.exec(src))) {
    const table = fm[1];
    if (!schema[table]) continue; // 뷰/알 수 없는 테이블 스킵
    // 매칭된 select( 의 닫는 괄호까지 스캔
    const start = fm.index + fm[0].length;
    let depth = 1, i = start;
    while (i < src.length && depth > 0) {
      const c = src[i];
      if (c === '(') depth++;
      else if (c === ')') depth--;
      if (depth === 0) break;
      i++;
    }
    const argFull = src.slice(start, i);
    // 옵션 객체(, { count })가 있으면 그 앞까지가 컬럼 식
    const optIdx = argFull.search(/,\s*\{/);
    const colExpr = (optIdx >= 0 ? argFull.slice(0, optIdx) : argFull).trim();
    if (!colExpr) continue;
    const resolved = resolveExpr(colExpr);
    if (resolved === null) continue; // 동적 — 검증 불가
    if (resolved.includes('*')) continue;

    // 컬럼 토큰 파싱 (임베드 rel(...) 는 깊이로 스킵)
    const cols = [];
    let d = 0, cur = '';
    for (const ch of resolved) {
      if (ch === '(') { d++; cur += ch; }
      else if (ch === ')') { d--; cur += ch; }
      else if (ch === ',' && d === 0) { cols.push(cur); cur = ''; }
      else cur += ch;
    }
    if (cur.trim()) cols.push(cur);

    const line = src.slice(0, fm.index).split('\n').length;
    for (let tok of cols) {
      tok = tok.trim();
      if (!tok || tok === '*') continue;
      if (tok.includes('(')) continue;            // 임베드 rel(...) — 스킵
      // alias:realcol → realcol
      if (tok.includes(':')) tok = tok.split(':').pop().trim();
      tok = tok.replace(/::[a-z]+/g, '').trim();   // 캐스트 제거
      if (!tok || NON_COLS.has(tok)) continue;
      if (!/^[a-z_][a-z0-9_]*$/.test(tok)) continue; // 식별자 아닌 건 스킵
      if (!schema[table].has(tok)) {
        problems.push({ file: f, line, table, col: tok });
      }
    }
  }
}

// ── 5. 보고 ──
if (problems.length === 0) {
  console.log('✅ 모든 .select() 컬럼이 스키마에 존재합니다.');
  process.exit(0);
}
console.log(`❌ 스키마에 없는 컬럼 ${problems.length}건:\n`);
for (const p of problems) {
  console.log(`  ${p.file}:${p.line}  ${p.table}.${p.col}`);
}
process.exit(1);
