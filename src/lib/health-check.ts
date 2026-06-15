import { createAdminClient } from '@/lib/supabase/admin';

export interface HealthIssue {
  code: string;
  severity: 'error' | 'warning';
  message: string;
}

// ── 2. answer ↔ answer_key 불일치 ──
async function checkAnswerKeyMismatch(admin: ReturnType<typeof createAdminClient>): Promise<HealthIssue[]> {
  const { data: sheets } = await admin
    .from('naesin_problem_sheets')
    .select('id, title, questions, answer_key');

  const issues: HealthIssue[] = [];
  for (const sheet of sheets || []) {
    const qs = sheet.questions as { answer?: string }[];
    const ak = sheet.answer_key as (string | number | null)[];
    if (!qs?.length || !ak?.length) continue;

    const mismatched: number[] = [];
    for (let i = 0; i < Math.min(qs.length, ak.length); i++) {
      const raw = qs[i].answer;
      // 배열 정답 ["2","3"] ↔ "2, 3" 형식 차이는 무시
      const qAnswer = Array.isArray(raw) ? (raw as string[]).join(', ') : String(raw ?? '');
      const akAnswer = String(ak[i] ?? '');
      if (qAnswer !== akAnswer && qAnswer !== '' && akAnswer !== '') {
        mismatched.push(i + 1);
      }
    }
    if (mismatched.length > 0) {
      issues.push({
        code: 'ANSWER_KEY_MISMATCH',
        severity: 'error',
        message: `"${sheet.title}" — Q${mismatched.join(', Q')} answer≠answer_key`,
      });
    }
  }
  return issues;
}

// ── 5. 점수 0% 탐지 (최근 7일) ──
async function checkZeroScores(admin: ReturnType<typeof createAdminClient>): Promise<HealthIssue[]> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: attempts } = await admin
    .from('naesin_problem_attempts')
    .select('id, student_id, sheet_id, score, total_questions, created_at')
    .eq('score', 0)
    .gte('created_at', sevenDaysAgo)
    .gt('total_questions', 0);

  if (!attempts?.length) return [];

  const sheetIds = [...new Set(attempts.map(a => a.sheet_id))];
  const studentIds = [...new Set(attempts.map(a => a.student_id))];

  const { data: sheets } = await admin
    .from('naesin_problem_sheets')
    .select('id, title')
    .in('id', sheetIds);
  const sheetMap = Object.fromEntries((sheets || []).map(s => [s.id, s.title]));

  const { data: users } = await admin
    .from('users')
    .select('id, full_name')
    .in('id', studentIds);
  const userMap = Object.fromEntries((users || []).map(u => [u.id, u.full_name]));

  return attempts.map(a => ({
    code: 'ZERO_SCORE',
    severity: 'warning' as const,
    message: `${userMap[a.student_id] || '?'} → "${sheetMap[a.sheet_id] || '?'}" 0점 (${a.total_questions}문항)`,
  }));
}

// ── 6. attempts ↔ wrong_answers 테이블 불일치 ──
async function checkWrongAnswerSync(admin: ReturnType<typeof createAdminClient>): Promise<HealthIssue[]> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: recentAttempts } = await admin
    .from('naesin_problem_attempts')
    .select('id, student_id, sheet_id, wrong_answers')
    .gte('created_at', sevenDaysAgo)
    .order('created_at', { ascending: true });

  if (!recentAttempts?.length) return [];

  const issues: HealthIssue[] = [];
  // 최신 시도만 (student+sheet 기준) — created_at 오름차순이라 마지막 set이 최신
  const latestMap = new Map<string, typeof recentAttempts[0]>();
  for (const a of recentAttempts) {
    const key = `${a.student_id}:${a.sheet_id}`;
    latestMap.set(key, a);
  }

  for (const [, attempt] of latestMap) {
    const jsonbCount = ((attempt.wrong_answers ?? []) as { retryCorrect?: boolean }[])
      .filter(w => !w.retryCorrect).length;

    const { count } = await admin
      .from('naesin_wrong_answers')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', attempt.student_id)
      .eq('sheet_id', attempt.sheet_id);

    if (count !== null && count !== jsonbCount) {
      issues.push({
        code: 'WRONG_ANSWER_SYNC',
        severity: 'error',
        message: `attempt ${attempt.id.substring(0, 8)}: JSONB ${jsonbCount}건 ≠ 테이블 ${count}건`,
      });
    }
  }
  return issues;
}

// ── 7. 동일 시트 다수 저점 ──
async function checkLowScoreCluster(admin: ReturnType<typeof createAdminClient>): Promise<HealthIssue[]> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: attempts } = await admin
    .from('naesin_problem_attempts')
    .select('sheet_id, score')
    .gte('created_at', sevenDaysAgo)
    .lte('score', 50)
    .gt('total_questions', 0);

  if (!attempts?.length) return [];

  const bySheet = new Map<string, number>();
  for (const a of attempts) {
    bySheet.set(a.sheet_id, (bySheet.get(a.sheet_id) || 0) + 1);
  }

  const issues: HealthIssue[] = [];
  for (const [sheetId, count] of bySheet) {
    if (count >= 3) {
      const { data: sheet } = await admin
        .from('naesin_problem_sheets')
        .select('title')
        .eq('id', sheetId)
        .single();
      issues.push({
        code: 'LOW_SCORE_CLUSTER',
        severity: 'warning',
        message: `"${sheet?.title || sheetId.substring(0, 8)}" — ${count}명 50점 이하 (시트 오류 의심)`,
      });
    }
  }
  return issues;
}

// ── 전체 실행 ──
export async function runHealthCheck(): Promise<HealthIssue[]> {
  const admin = createAdminClient();

  // 전수 콘텐츠 스캔은 야간에서 제외 — 저장 시점 검사(A)가 새/수정 콘텐츠를 잡고,
  // 학생-신호 검사(특히 LOW_SCORE_CLUSTER)가 실제 학생을 때리는 버그를 싸게 잡음.
  // 전수 스캔이 필요하면 관리자 "콘텐츠 검사" 버튼(온디맨드)으로.
  const results = await Promise.all([
    checkAnswerKeyMismatch(admin), // answer↔answer_key 값 불일치
    checkZeroScores(admin),        // 학생 신호: 0점
    checkWrongAnswerSync(admin),   // 학생 신호: 오답 테이블 동기화
    checkLowScoreCluster(admin),   // 학생 신호: 동일 시트 다수 저점 (콘텐츠 버그 간접 탐지)
  ]);

  return results.flat();
}

// ── 텔레그램 알림 ──
export async function sendTelegramAlert(issues: HealthIssue[]): Promise<boolean> {
  const token = process.env.TELEGRAM_HEALTH_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_HEALTH_CHAT_ID;
  if (!token || !chatId) return false;

  const errors = issues.filter(i => i.severity === 'error');
  const warnings = issues.filter(i => i.severity === 'warning');

  let text = `⚠️ 올그래머 헬스체크 — ${issues.length}건 발견\n\n`;

  if (errors.length > 0) {
    text += `🔴 오류 ${errors.length}건\n`;
    for (const e of errors) text += `• ${e.message}\n`;
    text += '\n';
  }

  if (warnings.length > 0) {
    text += `🟡 경고 ${warnings.length}건\n`;
    for (const w of warnings) text += `• ${w.message}\n`;
  }

  // 텔레그램 메시지 4096자 제한
  if (text.length > 4000) {
    text = text.substring(0, 3950) + '\n\n... 외 추가 항목 생략';
  }

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  });

  return res.ok;
}
