import type { NaesinProblemQuestion } from '@/types/naesin';
import { sanitizeQuestions, validateBeforeSave, validateAnswerKey } from './problem-validator';

// ── 콘텐츠 헬스 스캐너 ──
// 손으로 돌리던 전수 검사(빈 정답·MCQ 범위·텍스트 불일치·answer_key 길이 등)를 상설 함수로.
// 설계 원칙 (2026-06-12):
//   1. sanitize → validate 순서. 저장 경로와 동일하게, sanitize가 자동수정할 것(원형숫자 "③",
//      텍스트→번호 등)은 과보고하지 않는다. (안 그러면 원형숫자 160건 같은 가짜 경보가 뜸)
//   2. PARTIAL_ANSWER_KEY만은 RAW 데이터로 검사 — sanitize가 answer_key를 재구축해 가려버리므로.
//   3. correctness(오탐 0, 알림) vs quality(노이즈, 기본 숨김) 분리. "🔴 = 무조건 진짜 버그" 신뢰 유지.

export type IssueCategory = 'correctness' | 'quality';

// 품질(노이즈) 코드 — 채점/표시에 영향 없음. 나머지는 전부 correctness.
const QUALITY_CODES = new Set<string>(['NO_EXPLANATION', 'NO_FORMAT_HINT', 'EMPTY_OPTION']);

function categoryOf(code: string): IssueCategory {
  return QUALITY_CODES.has(code) ? 'quality' : 'correctness';
}

export interface ContentScanIssue {
  source: 'sheet' | 'template';
  id: string;
  title: string;
  questionNumber: number | null;
  code: string;
  severity: 'error' | 'warning';
  category: IssueCategory;
  message: string;
}

export interface ContentScanResult {
  issues: ContentScanIssue[];
  countsByCode: Record<string, number>;
  countsByCategory: { correctness: number; quality: number };
  rowsScanned: number;
}

export interface ScanRow {
  id: string;
  title: string;
  questions: NaesinProblemQuestion[] | null;
  answer_key: (string | number | null)[] | null;
}

/** 한 행(시트/템플릿) 검사 — 순수 함수 (DB 불필요, 테스트 대상). */
export function scanRow(source: 'sheet' | 'template', row: ScanRow): ContentScanIssue[] {
  const rawQuestions = (row.questions ?? []) as NaesinProblemQuestion[];
  const rawAnswerKey = row.answer_key;
  if (!rawQuestions.length) return [];

  // 1) sanitize 후 문항레벨 검사 (원형숫자 등 자동수정 대상은 여기서 사라짐)
  const { questions: sanitized } = sanitizeQuestions(
    rawQuestions,
    Array.isArray(rawAnswerKey) ? rawAnswerKey : undefined,
  );
  const v = validateBeforeSave(sanitized);

  // 2) answer_key 길이는 RAW로 (sanitize가 재구축해 가리므로)
  const akIssues = validateAnswerKey(rawQuestions, rawAnswerKey);

  return [...v.errors, ...v.warnings, ...akIssues].map((iss) => ({
    source,
    id: row.id,
    title: row.title,
    questionNumber: iss.questionNumber,
    code: iss.code,
    severity: iss.severity,
    category: categoryOf(iss.code),
    message: iss.message,
  }));
}

/** 집계 — issues 배열에서 코드별/카테고리별 카운트. */
export function aggregate(issues: ContentScanIssue[], rowsScanned: number): ContentScanResult {
  const countsByCode: Record<string, number> = {};
  const countsByCategory = { correctness: 0, quality: 0 };
  for (const i of issues) {
    countsByCode[i.code] = (countsByCode[i.code] ?? 0) + 1;
    countsByCategory[i.category]++;
  }
  return { issues, countsByCode, countsByCategory, rowsScanned };
}

// 최소한의 Supabase 유사 인터페이스 (테스트에서 mock 가능, env 의존 없음)
interface ScanDb {
  from(table: string): {
    select(cols: string): {
      range(from: number, to: number): Promise<{ data: ScanRow[] | null; error: { message: string } | null }>;
    };
  };
}

async function fetchAll(db: ScanDb, table: string): Promise<ScanRow[]> {
  const rows: ScanRow[] = [];
  let from = 0;
  for (;;) {
    const { data, error } = await db.from(table).select('id, title, questions, answer_key').range(from, from + 999);
    if (error) throw new Error(`${table}: ${error.message}`);
    if (!data?.length) break;
    rows.push(...data);
    if (data.length < 1000) break;
    from += 1000;
  }
  return rows;
}

/**
 * 템플릿 + 시트 전체를 스캔. admin 클라이언트(service-role) 주입.
 * @param opts.correctnessOnly true면 quality 노이즈 제외 (기본 동작 권장)
 */
export async function runContentScan(
  db: ScanDb,
  opts: { correctnessOnly?: boolean } = {},
): Promise<ContentScanResult> {
  const all: ContentScanIssue[] = [];
  let rowsScanned = 0;
  for (const [source, table] of [['sheet', 'naesin_problem_sheets'], ['template', 'naesin_templates']] as const) {
    const rows = await fetchAll(db, table);
    for (const row of rows) {
      rowsScanned++;
      all.push(...scanRow(source, row));
    }
  }
  const issues = opts.correctnessOnly ? all.filter((i) => i.category === 'correctness') : all;
  return aggregate(issues, rowsScanned);
}
