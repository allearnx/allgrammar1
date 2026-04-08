import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api/handler';
import { createAdminClient } from '@/lib/supabase/admin';
import { computeClassReview } from '@/lib/reports/compute-class-review';

export const GET = createApiHandler(
  { roles: ['teacher', 'admin', 'boss'], hasBody: false },
  async ({ user }) => {
    if (!user.academy_id) {
      return NextResponse.json([]);
    }
    const admin = createAdminClient();
    const result = await computeClassReview(admin, user.academy_id);
    return NextResponse.json(result);
  },
);
