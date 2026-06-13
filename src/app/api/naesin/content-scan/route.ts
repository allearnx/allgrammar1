import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createApiHandler } from '@/lib/api';
import { requireContentPermission } from '@/lib/api/require-content-permission';
import { createAdminClient } from '@/lib/supabase/admin';
import { runContentScan } from '@/lib/validation';

export const maxDuration = 120;

const scanSchema = z.object({}).optional();

// 콘텐츠 헬스 스캔 — 학생 노출 전 전수 검사. boss / 콘텐츠권한 선생님 전용.
// 응답은 correctness(진짜 버그) 상세 + 전체 카운트(quality는 숫자만, 1만 건 JSON 방지).
export const POST = createApiHandler(
  { schema: scanSchema, roles: ['teacher', 'admin', 'boss'] },
  async ({ user, supabase }) => {
    await requireContentPermission(user, supabase);

    const full = await runContentScan(createAdminClient(), { correctnessOnly: false });

    return NextResponse.json({
      rowsScanned: full.rowsScanned,
      countsByCategory: full.countsByCategory,
      countsByCode: full.countsByCode,
      // 상세는 correctness만 (quality는 카운트로만 — NO_EXPLANATION 1만 건 JSON 방지)
      issues: full.issues.filter((i) => i.category === 'correctness'),
    });
  },
);
