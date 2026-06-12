import { NextResponse } from 'next/server';
import { createApiHandler, dbResult } from '@/lib/api';
import { similarProblemPatchSchema, idSchema } from '@/lib/api/schemas';
import { createAdminClient } from '@/lib/supabase/admin';
import { cached, TTL } from '@/lib/cache/server-cache';
import { cacheTags } from '@/lib/cache/tags';
import { invalidateUnitContent } from '@/lib/cache/invalidate';

const ADMIN_ROLES = ['teacher', 'admin', 'boss'] as const;

const getCachedSimilarProblems = cached(
  async (unitId: string, status: string) => {
    const admin = createAdminClient();
    let query = admin
      .from('naesin_similar_problems')
      .select('id, unit_id, grammar_tag, question_data, status, reviewed_by, rejection_reason, created_at, updated_at')
      .eq('unit_id', unitId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data } = await query;
    return data || [];
  },
  'similar-problems',
  TTL.LIVE,
  (unitId) => [cacheTags.unitContent(unitId)],
);

export const GET = createApiHandler(
  {},
  async ({ request }) => {
    const unitId = request.nextUrl.searchParams.get('unitId');
    const status = request.nextUrl.searchParams.get('status');
    if (!unitId) return NextResponse.json({ error: 'Missing unitId' }, { status: 400 });

    const data = await getCachedSimilarProblems(unitId, status || '');
    return NextResponse.json(data);
  }
);

export const PATCH = createApiHandler(
  { roles: [...ADMIN_ROLES], schema: similarProblemPatchSchema },
  async ({ user, body, supabase }) => {
    const { id, status, questionData, rejectionReason } = body;

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (status) {
      updates.status = status;
      updates.reviewed_by = user.id;
    }
    if (questionData) updates.question_data = questionData;
    if (rejectionReason) updates.rejection_reason = rejectionReason;

    const data = dbResult(await supabase
      .from('naesin_similar_problems')
      .update(updates)
      .eq('id', id)
      .select()
      .single());

    if (data.unit_id) invalidateUnitContent(data.unit_id);
    return NextResponse.json(data);
  }
);

export const DELETE = createApiHandler(
  { roles: [...ADMIN_ROLES], schema: idSchema, hasBody: true },
  async ({ body, supabase }) => {
    // 삭제 전 unitId 조회 (캐시 무효화용)
    const { data: problem } = await supabase
      .from('naesin_similar_problems')
      .select('unit_id')
      .eq('id', body.id)
      .single();

    dbResult(await supabase
      .from('naesin_similar_problems')
      .delete()
      .eq('id', body.id));

    if (problem?.unit_id) invalidateUnitContent(problem.unit_id);
    return NextResponse.json({ success: true });
  }
);
