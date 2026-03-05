import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api';
import { createAdminClient } from '@/lib/supabase/admin';
import { academyCreateSchema } from '@/lib/api/schemas';

export const GET = createApiHandler(
  { roles: ['boss'] },
  async () => {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('academies')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }
);

export const POST = createApiHandler(
  { roles: ['boss'], schema: academyCreateSchema },
  async ({ body }) => {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('academies')
      .insert({ name: body.name.trim() })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  }
);
