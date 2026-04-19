import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

const SEED_DIR = join(process.cwd(), 'supabase/seeds');

/**
 * 시드 SQL 파일의 answer_key가 비어있으면 학생 채점 시 전원 0점 처리되는
 * 치명적 버그가 발생합니다 (2026-04-19 사건).
 * 이 테스트는 모든 시드 파일에서 빈 answer_key를 탐지합니다.
 */
describe('seed SQL answer_key validation', () => {
  const seedFiles = readdirSync(SEED_DIR)
    .filter((f) => f.startsWith('seed_') && f.endsWith('.sql'));

  it('should find at least one seed file', () => {
    expect(seedFiles.length).toBeGreaterThan(0);
  });

  // answer_key를 사용하는 파일만 검사 (mock_exam, external_passage 등 다른 구조 제외)
  const templateSeedFiles = seedFiles.filter((f) => {
    const content = readFileSync(join(SEED_DIR, f), 'utf-8');
    return content.includes('naesin_templates') && content.includes('answer_key');
  });

  it.each(templateSeedFiles)(
    '%s — answer_key가 비어있으면 안 됨 (빈 answer_key → 전원 0점 버그)',
    (fileName) => {
      const content = readFileSync(join(SEED_DIR, fileName), 'utf-8');

      // 빈 answer_key 패턴 탐지
      const hasEmptyAnswerKey = /a\s*:=\s*jsonb_build_array\(\)\s*;/.test(content);
      expect(
        hasEmptyAnswerKey,
        `${fileName}의 answer_key(a 변수)가 비어있습니다! questions[].answer에서 정답을 추출하여 채워넣으세요.`,
      ).toBe(false);
    },
  );

  // 단일 q 변수 파일만 개수 검증 (q := q || 패턴은 중복 카운트 문제로 제외)
  const singleQFiles = templateSeedFiles.filter((f) => {
    const content = readFileSync(join(SEED_DIR, f), 'utf-8');
    return !content.includes('q := q ||') && !content.includes('q:= q ||');
  });

  it.each(singleQFiles)(
    '%s — answer_key 개수가 questions 개수와 일치해야 함',
    (fileName) => {
      const content = readFileSync(join(SEED_DIR, fileName), 'utf-8');

      // questions 개수: a := 이전 영역에서만 'number',N 또는 'id',N 카운트
      // (answer_key가 jsonb_build_object 형태인 파일은 a := 영역에도 'number'가 있어 중복됨)
      const aPos = content.indexOf('a := jsonb_build_array(');
      const questionArea = aPos > 0 ? content.slice(0, aPos) : content;
      const qMatches = questionArea.match(/'(?:number|id)'\s*,\s*\d+/g) || [];
      const questionCount = qMatches.length;
      if (questionCount === 0) return;

      // answer_key 찾기
      const aStart = content.indexOf('a := jsonb_build_array(');
      if (aStart < 0) return;

      const parenStart = content.indexOf('(', aStart + 'a := jsonb_build_array'.length);
      let depth = 0;
      let aEnd = -1;
      for (let i = parenStart; i < content.length; i++) {
        if (content[i] === '(') depth++;
        if (content[i] === ')') {
          depth--;
          if (depth === 0) { aEnd = i; break; }
        }
      }
      if (aEnd < 0) return;

      const answerStr = content.slice(parenStart + 1, aEnd).trim();
      if (!answerStr) return;

      // 최상위 레벨 쉼표로 항목 수 카운트
      let answerCount = 0;
      let d = 0;
      let inQuote = false;

      for (let i = 0; i < answerStr.length; i++) {
        const ch = answerStr[i];
        if (inQuote) {
          if (ch === '\\') {
            i++; // 백슬래시 이스케이프 (\' 등) 스킵
          } else if (ch === "'" && i + 1 < answerStr.length && answerStr[i + 1] === "'") {
            i++; // 이중 따옴표 이스케이프 ('') 스킵
          } else if (ch === "'") {
            inQuote = false;
          }
          continue;
        }
        if (ch === "'") { inQuote = true; continue; }
        if (ch === '(') d++;
        if (ch === ')') d--;
        if (ch === ',' && d === 0) answerCount++;
      }
      if (answerStr.length > 0) answerCount++;

      expect(
        answerCount,
        `${fileName}: answer_key(${answerCount}개)와 questions(${questionCount}개) 개수 불일치`,
      ).toBe(questionCount);
    },
  );
});
