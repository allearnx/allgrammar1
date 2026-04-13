import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api';
import { createAdminClient } from '@/lib/supabase/admin';

export const PATCH = createApiHandler(
  { hasBody: false, rateLimit: { max: 5, windowMs: 60_000 } },
  async ({ user }) => {
    const admin = createAdminClient();
    await admin
      .from('users')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', user.id);
    return new NextResponse(null, { status: 204 });
  }
);
