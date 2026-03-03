import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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
    .select('role, academy_id')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'boss'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { is_active } = await request.json();

  if (typeof is_active !== 'boolean') {
    return NextResponse.json({ error: 'Invalid is_active value' }, { status: 400 });
  }

  // Only update teachers in same academy
  const { data: teacher } = await admin
    .from('users')
    .select('academy_id')
    .eq('id', id)
    .eq('role', 'teacher')
    .single();

  if (!teacher) {
    return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
  }

  if (profile.role !== 'boss' && teacher.academy_id !== profile.academy_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { error } = await admin
    .from('users')
    .update({ is_active })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
