import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api/handler';
import { announcementCreateSchema, announcementPatchSchema, idSchema } from '@/lib/api/schemas';
import { dbResult } from '@/lib/api/errors';

export const GET = createApiHandler(
  { roles: ['boss'], hasBody: false },
  async ({ supabase }) => {
    const data = dbResult(
      await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })
    );
    return NextResponse.json(data);
  }
);

export const POST = createApiHandler(
  { roles: ['boss'], schema: announcementCreateSchema },
  async ({ body, supabase }) => {
    const insertData = {
      ...body,
      published_at: body.is_published ? new Date().toISOString() : null,
    };
    const data = dbResult(
      await supabase.from('announcements').insert(insertData).select().single()
    );
    return NextResponse.json(data, { status: 201 });
  }
);

export const PATCH = createApiHandler(
  { roles: ['boss'], schema: announcementPatchSchema },
  async ({ body, supabase }) => {
    const { id, ...updates } = body;
    const cleanUpdates: Record<string, unknown> = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );

    // Auto-set published_at when publishing for the first time
    if (cleanUpdates.is_published === true) {
      // Only set if not already published
      const existing = dbResult(
        await supabase.from('announcements').select('published_at').eq('id', id).single()
      );
      if (!existing?.published_at) {
        cleanUpdates.published_at = new Date().toISOString();
      }
    }

    cleanUpdates.updated_at = new Date().toISOString();

    const data = dbResult(
      await supabase.from('announcements').update(cleanUpdates).eq('id', id).select().single()
    );
    return NextResponse.json(data);
  }
);

export const DELETE = createApiHandler(
  { roles: ['boss'], schema: idSchema },
  async ({ body, supabase }) => {
    dbResult(await supabase.from('announcements').delete().eq('id', body.id));
    return NextResponse.json({ success: true });
  }
);
