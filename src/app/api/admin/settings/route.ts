import { NextResponse } from 'next/server';
import { createApiHandler, dbResult } from '@/lib/api';
import { createAdminClient } from '@/lib/supabase/admin';
import { academySettingsSchema } from '@/lib/api/schemas';

export const GET = createApiHandler(
  { roles: ['admin', 'boss'], hasBody: false },
  async ({ user }) => {
    if (!user.academy_id) {
      return NextResponse.json({ error: '학원에 소속되어 있지 않습니다.' }, { status: 400 });
    }
    const admin = createAdminClient();
    const data = dbResult(await admin
      .from('academies')
      .select('id, name, invite_code, contact_phone, contact_email, address, logo_url, business_number, max_students, onboarding_completed_at, created_at, updated_at')
      .eq('id', user.academy_id)
      .single());

    // Get current student count for seat display
    const { count } = await admin
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('academy_id', user.academy_id)
      .eq('role', 'student')
      .eq('is_active', true);

    return NextResponse.json({ ...data, current_students: count || 0 });
  }
);

export const PATCH = createApiHandler(
  { roles: ['admin', 'boss'], schema: academySettingsSchema },
  async ({ user, body }) => {
    if (!user.academy_id) {
      return NextResponse.json({ error: '학원에 소속되어 있지 않습니다.' }, { status: 400 });
    }
    const admin = createAdminClient();
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.name !== undefined && body.name !== null) updates.name = body.name.trim();
    if (body.contact_phone !== undefined) updates.contact_phone = body.contact_phone;
    if (body.contact_email !== undefined) updates.contact_email = body.contact_email;
    if (body.address !== undefined) updates.address = body.address;
    if (body.logo_url !== undefined) updates.logo_url = body.logo_url;
    if (body.business_number !== undefined) updates.business_number = body.business_number;

    dbResult(await admin
      .from('academies')
      .update(updates)
      .eq('id', user.academy_id));

    return NextResponse.json({ success: true });
  }
);
