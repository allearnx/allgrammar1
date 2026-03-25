import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api/handler';
import { teacherProfileCreateSchema, teacherProfilePatchSchema, idSchema } from '@/lib/api/schemas';
import { dbResult } from '@/lib/api/errors';

export const GET = createApiHandler(
  { roles: ['boss'], allowHomepageManager: true, hasBody: false },
  async ({ supabase }) => {
    const data = dbResult(
      await supabase
        .from('teacher_profiles')
        .select('*')
        .order('sort_order', { ascending: true })
    );
    return NextResponse.json(data);
  }
);

export const POST = createApiHandler(
  { roles: ['boss'], allowHomepageManager: true, schema: teacherProfileCreateSchema },
  async ({ body, supabase }) => {
    const data = dbResult(
      await supabase.from('teacher_profiles').insert(body).select().single()
    );
    return NextResponse.json(data, { status: 201 });
  }
);

export const PATCH = createApiHandler(
  { roles: ['boss'], allowHomepageManager: true, schema: teacherProfilePatchSchema },
  async ({ body, supabase }) => {
    const { id, ...updates } = body;
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    const data = dbResult(
      await supabase.from('teacher_profiles').update(cleanUpdates).eq('id', id).select().single()
    );
    return NextResponse.json(data);
  }
);

export const DELETE = createApiHandler(
  { roles: ['boss'], allowHomepageManager: true, schema: idSchema },
  async ({ body, supabase }) => {
    dbResult(await supabase.from('teacher_profiles').delete().eq('id', body.id));
    return NextResponse.json({ success: true });
  }
);
