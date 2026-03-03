import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const VALID_ROLES = ['student', 'teacher', 'admin', 'boss'];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'boss') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();

  const updates: Record<string, any> = {};

  if ('role' in body) {
    if (!VALID_ROLES.includes(body.role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }
    updates.role = body.role;
  }

  if ('academy_id' in body) {
    if (body.academy_id !== null) {
      // Verify academy exists
      const { data: academy } = await admin
        .from('academies')
        .select('id')
        .eq('id', body.academy_id)
        .single();

      if (!academy) {
        return NextResponse.json({ error: 'Academy not found' }, { status: 404 });
      }
    }
    updates.academy_id = body.academy_id;
  }

  if ('is_active' in body) {
    if (typeof body.is_active !== 'boolean') {
      return NextResponse.json({ error: 'Invalid is_active value' }, { status: 400 });
    }
    updates.is_active = body.is_active;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const { error } = await admin
    .from('users')
    .update(updates)
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
