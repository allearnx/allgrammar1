import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api/handler';
import { consultationPatchSchema } from '@/lib/api/schemas';
import { dbResult } from '@/lib/api/errors';

export const GET = createApiHandler(
  { roles: ['boss'], allowHomepageManager: true, hasBody: false },
  async ({ supabase }) => {
    const data = dbResult(
      await supabase
        .from('consultations')
        .select('*')
        .order('created_at', { ascending: false })
    );

    const rows = (data ?? []) as Array<Record<string, unknown> & { interest_course_ids: string[] }>;

    // Resolve course names from interest_course_ids
    const allCourseIds = [...new Set(rows.flatMap((c) => c.interest_course_ids || []))];
    let courseMap: Record<string, string> = {};
    if (allCourseIds.length > 0) {
      const courses = dbResult(
        await supabase
          .from('courses')
          .select('id, title')
          .in('id', allCourseIds)
      );
      const courseRows = (courses ?? []) as Array<{ id: string; title: string }>;
      courseMap = Object.fromEntries(courseRows.map((c) => [c.id, c.title]));
    }

    const enriched = rows.map((c) => ({
      ...c,
      interest_courses: (c.interest_course_ids || []).map((id: string) => courseMap[id] || '삭제된 코스').join(', '),
    }));

    return NextResponse.json(enriched);
  }
);

export const PATCH = createApiHandler(
  { roles: ['boss'], allowHomepageManager: true, schema: consultationPatchSchema },
  async ({ body, supabase }) => {
    const { id, ...updates } = body;
    // Remove nullish values
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined && v !== null)
    );

    const data = dbResult(
      await supabase
        .from('consultations')
        .update(cleanUpdates)
        .eq('id', id)
        .select()
        .single()
    );

    return NextResponse.json(data);
  }
);
