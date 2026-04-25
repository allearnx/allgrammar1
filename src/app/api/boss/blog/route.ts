import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api/handler';
import { blogCreateSchema, blogPatchSchema, idSchema } from '@/lib/api/schemas';
import { dbResult } from '@/lib/api/errors';
import { sanitizeHtml } from '@/lib/sanitize-html';

export const GET = createApiHandler(
  { roles: ['boss'], hasBody: false },
  async ({ supabase }) => {
    const data = dbResult(
      await supabase
        .from('blog_posts')
        .select('id, slug, title, excerpt, category, thumbnail_url, is_published, published_at, view_count, sort_order, created_at, updated_at')
        .order('created_at', { ascending: false })
    );
    return NextResponse.json(data);
  }
);

export const POST = createApiHandler(
  { roles: ['boss'], schema: blogCreateSchema },
  async ({ body, supabase, user }) => {
    const insertData = {
      ...body,
      content: sanitizeHtml(body.content),
      author_id: user.id,
      published_at: body.is_published ? new Date().toISOString() : null,
    };
    const data = dbResult(
      await supabase.from('blog_posts').insert(insertData).select().single()
    );
    return NextResponse.json(data, { status: 201 });
  }
);

export const PATCH = createApiHandler(
  { roles: ['boss'], schema: blogPatchSchema },
  async ({ body, supabase }) => {
    const { id, ...updates } = body;
    const cleanUpdates: Record<string, unknown> = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );

    // Sanitize content if provided
    if (typeof cleanUpdates.content === 'string') {
      cleanUpdates.content = sanitizeHtml(cleanUpdates.content as string);
    }

    // Auto-set published_at when publishing for the first time
    if (cleanUpdates.is_published === true) {
      const existing = dbResult(
        await supabase.from('blog_posts').select('published_at').eq('id', id).single()
      );
      if (!existing?.published_at) {
        cleanUpdates.published_at = new Date().toISOString();
      }
    }

    cleanUpdates.updated_at = new Date().toISOString();

    const data = dbResult(
      await supabase.from('blog_posts').update(cleanUpdates).eq('id', id).select().single()
    );
    return NextResponse.json(data);
  }
);

export const DELETE = createApiHandler(
  { roles: ['boss'], schema: idSchema, hasBody: true },
  async ({ body, supabase }) => {
    dbResult(await supabase.from('blog_posts').delete().eq('id', body.id));
    return NextResponse.json({ success: true });
  }
);
