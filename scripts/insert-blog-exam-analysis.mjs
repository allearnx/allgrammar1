#!/usr/bin/env node
/**
 * 동탄국제고 시험 분석 HTML → blog_posts 테이블 삽입 (초안)
 * Usage: node scripts/insert-blog-exam-analysis.mjs [path-to-html]
 */
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const SCOPE = 'bea'; // blog-exam-analysis
const htmlPath =
  process.argv[2] || '/Users/mckenna/Downloads/dongtan_test_analysis_6.html';

const html = fs.readFileSync(htmlPath, 'utf-8');

/* ================================================================
   CSS Scoping
   ================================================================ */

const SKIP_RE = [
  /^\*$/, /^html$/, /^\.container/, /^\.header/, /^\.footer/,
  /^\.print-watermark/,
];

function shouldSkip(sel) {
  const s = sel.trim();
  return SKIP_RE.some((r) => r.test(s));
}

function prefixSel(sel) {
  const s = sel.trim();
  if (!s) return null;
  if (shouldSkip(s)) return null;
  if (s === ':root' || s === 'body') return `.${SCOPE}`;
  return `.${SCOPE} ${s}`;
}

function findClose(str, open) {
  let d = 0;
  for (let i = open; i < str.length; i++) {
    if (str[i] === '{') d++;
    if (str[i] === '}') { d--; if (d === 0) return i; }
  }
  return str.length - 1;
}

function skipBlock(str, from) {
  const b = str.indexOf('{', from);
  return b === -1 ? str.length : findClose(str, b) + 1;
}

/** Scope a set of rules (no @-rule wrapping) */
function scopeRules(src) {
  const out = [];
  let i = 0;
  while (i < src.length) {
    while (i < src.length && /\s/.test(src[i])) i++;
    if (i >= src.length) break;

    // Skip CSS comments
    if (src[i] === '/' && src[i + 1] === '*') {
      const end = src.indexOf('*/', i + 2);
      i = end === -1 ? src.length : end + 2;
      continue;
    }

    const braceAt = src.indexOf('{', i);
    if (braceAt === -1) break;

    const selStr = src.slice(i, braceAt).trim();
    const closeAt = findClose(src, braceAt);
    const decls = src.slice(braceAt + 1, closeAt).trim();

    const scoped = selStr.split(',').map(prefixSel).filter(Boolean);
    if (scoped.length > 0) {
      out.push(`${scoped.join(',\n')} {\n  ${decls}\n}`);
    }
    i = closeAt + 1;
  }
  return out.join('\n\n');
}

function scopeCSS(raw) {
  const out = [];
  let i = 0;
  while (i < raw.length) {
    while (i < raw.length && /\s/.test(raw[i])) i++;
    if (i >= raw.length) break;

    // Comments
    if (raw[i] === '/' && raw[i + 1] === '*') {
      const end = raw.indexOf('*/', i + 2);
      i = end === -1 ? raw.length : end + 2;
      continue;
    }

    // @-rules
    if (raw[i] === '@') {
      let nameEnd = i;
      while (nameEnd < raw.length && raw[nameEnd] !== '{' && raw[nameEnd] !== ';') nameEnd++;
      const atRule = raw.slice(i, nameEnd).trim();

      // Drop @page, @media print
      if (atRule.startsWith('@page') || atRule.startsWith('@media print')) {
        i = skipBlock(raw, nameEnd);
        continue;
      }

      // Keep @media (max-width: …) with scoped inner rules
      if (atRule.startsWith('@media')) {
        const bOpen = raw.indexOf('{', nameEnd);
        const bClose = findClose(raw, bOpen);
        const inner = raw.slice(bOpen + 1, bClose);
        out.push(`${atRule} {\n${scopeRules(inner)}\n}`);
        i = bClose + 1;
        continue;
      }

      // Other @-rules (shouldn't happen, but keep)
      if (raw[nameEnd] === ';') {
        out.push(raw.slice(i, nameEnd + 1));
        i = nameEnd + 1;
      } else {
        i = skipBlock(raw, nameEnd);
      }
      continue;
    }

    // Regular rule
    const braceAt = raw.indexOf('{', i);
    if (braceAt === -1) break;

    const selStr = raw.slice(i, braceAt).trim();
    const closeAt = findClose(raw, braceAt);
    const decls = raw.slice(braceAt + 1, closeAt).trim();

    const scoped = selStr.split(',').map(prefixSel).filter(Boolean);
    if (scoped.length > 0) {
      out.push(`${scoped.join(',\n')} {\n  ${decls}\n}`);
    }
    i = closeAt + 1;
  }
  return out.join('\n\n');
}

/* ================================================================
   Extract & Build
   ================================================================ */

// 1. Extract raw CSS
const cssMatch = html.match(/<style>([\s\S]*?)<\/style>/);
if (!cssMatch) throw new Error('No <style> found');

const scopedCSS = scopeCSS(cssMatch[1]);

// Google Fonts import (needed for Noto Serif KR / Noto Sans KR / EB Garamond)
const fontsImport = `@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@300;400;500;600;700;900&family=Noto+Sans+KR:wght@300;400;500;700&family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400&display=swap');`;

// 2. Extract body content (between </header> and <footer)
const hEnd = html.indexOf('</header>');
const fStart = html.indexOf('<footer');
if (hEnd === -1 || fStart === -1) throw new Error('Cannot find header/footer boundaries');

const bodyContent = html.slice(hEnd + '</header>'.length, fStart).trim();

// 3. Combine: <style> + wrapper div (with not-prose to escape Tailwind prose)
const blogContent = [
  `<style>${fontsImport}\n\n${scopedCSS}</style>`,
  `<div class="not-prose ${SCOPE}">`,
  bodyContent,
  `</div>`,
].join('\n');

console.log(`Content size: ${blogContent.length} chars`);

/* ================================================================
   Insert into Supabase
   ================================================================ */

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// Find boss user for author_id
const { data: boss, error: bossErr } = await sb
  .from('users')
  .select('id')
  .eq('role', 'boss')
  .single();

if (bossErr || !boss) {
  console.error('Boss user not found:', bossErr?.message);
  process.exit(1);
}

const { data, error } = await sb
  .from('blog_posts')
  .insert({
    slug: '2026-dongtan-global-high-1-midterm-english',
    title: '2026 동탄국제고 1학년 1학기 중간고사 영어 시험 분석',
    excerpt:
      '동탄국제고등학교 1학년 1학기 1차 영어 시험 28문항 유형별 분석. 수능 킬러 유형 50% 이상, 어휘력·추론력 중심 출제.',
    content: blogContent,
    category: 'exam_prep',
    meta_title: '2026 동탄국제고 1학년 영어 중간고사 — 28문항 완전 분석',
    meta_description:
      '동탄국제고등학교 1학년 1학기 1차 영어 시험 28문항을 유형별로 분석합니다. 빈칸추론·글의순서·문장삽입 등 수능 킬러 유형이 50% 이상.',
    is_published: false,
    author_id: boss.id,
  })
  .select('id, slug')
  .single();

if (error) {
  console.error('Insert failed:', error.message);
  process.exit(1);
}

console.log('Blog post created as DRAFT');
console.log('  id   :', data.id);
console.log('  slug :', data.slug);
console.log('\n→ 5월 5일에 /boss/blog 에서 "게시" 토글하면 공개됩니다.');
