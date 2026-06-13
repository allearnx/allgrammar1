import { NextRequest, NextResponse } from 'next/server';
import { runHealthCheck, sendTelegramAlert } from '@/lib/health-check';

// 콘텐츠 전수 스캔(runContentScan) 포함 → 기본 타임아웃보다 여유 필요
export const maxDuration = 300;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const issues = await runHealthCheck();

  if (issues.length > 0) {
    await sendTelegramAlert(issues);
  }

  return NextResponse.json({
    ok: true,
    issueCount: issues.length,
    issues,
  });
}
