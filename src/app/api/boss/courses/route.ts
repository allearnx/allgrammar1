import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api/handler';
import { courseCreateSchema, coursePatchSchema, idSchema } from '@/lib/api/schemas';
import { dbResult } from '@/lib/api/errors';

export const GET = createApiHandler(
  { roles: ['boss'], allowHomepageManager: true, hasBody: false },
  async ({ supabase }) => {
    const courses = dbResult(
      await supabase
        .from('courses')
        .select('*')
        .order('sort_order', { ascending: true })
    );

    const rows = (courses ?? []) as Array<Record<string, unknown> & { teacher_id: string | null }>;

    // Resolve teacher names via teacher_profiles (courses.teacher_id → teacher_profiles.id)
    const teacherIds = [...new Set(rows.map((c) => c.teacher_id).filter(Boolean))] as string[];
    let teacherMap: Record<string, string> = {};
    if (teacherIds.length > 0) {
      const profiles = dbResult(
        await supabase
          .from('teacher_profiles')
          .select('id, display_name')
          .in('id', teacherIds)
      );
      const profileRows = (profiles ?? []) as Array<{ id: string; display_name: string }>;
      teacherMap = Object.fromEntries(
        profileRows.map((p) => [p.id, p.display_name])
      );
    }

    const enriched = rows.map((c) => ({
      ...c,
      teacher_name: c.teacher_id ? teacherMap[c.teacher_id] || null : null,
    }));

    return NextResponse.json(enriched);
  }
);

export const POST = createApiHandler(
  { roles: ['boss'], allowHomepageManager: true, schema: courseCreateSchema },
  async ({ body, supabase }) => {
    const data = dbResult(
      await supabase.from('courses').insert(body).select().single()
    );
    return NextResponse.json(data, { status: 201 });
  }
);

export const PATCH = createApiHandler(
  { roles: ['boss'], allowHomepageManager: true, schema: coursePatchSchema },
  async ({ body, supabase }) => {
    const { id, ...updates } = body;
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    const data = dbResult(
      await supabase.from('courses').update(cleanUpdates).eq('id', id).select().single()
    );
    return NextResponse.json(data);
  }
);

export const DELETE = createApiHandler(
  { roles: ['boss'], allowHomepageManager: true, schema: idSchema },
  async ({ body, supabase }) => {
    dbResult(await supabase.from('courses').delete().eq('id', body.id));
    return NextResponse.json({ success: true });
  }
);
