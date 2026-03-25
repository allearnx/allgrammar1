import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api/handler';
import { faqCreateSchema, faqPatchSchema, idSchema } from '@/lib/api/schemas';
import { dbResult } from '@/lib/api/errors';

export const GET = createApiHandler(
  { roles: ['boss'], allowHomepageManager: true, hasBody: false },
  async ({ supabase }) => {
    const data = dbResult(
      await supabase
        .from('faqs')
        .select('*')
        .order('display_order', { ascending: true })
    );
    return NextResponse.json(data);
  }
);

export const POST = createApiHandler(
  { roles: ['boss'], allowHomepageManager: true, schema: faqCreateSchema },
  async ({ body, supabase }) => {
    const data = dbResult(
      await supabase.from('faqs').insert(body).select().single()
    );
    return NextResponse.json(data, { status: 201 });
  }
);

export const PATCH = createApiHandler(
  { roles: ['boss'], allowHomepageManager: true, schema: faqPatchSchema },
  async ({ body, supabase }) => {
    const { id, ...updates } = body;
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    const data = dbResult(
      await supabase.from('faqs').update(cleanUpdates).eq('id', id).select().single()
    );
    return NextResponse.json(data);
  }
);

export const DELETE = createApiHandler(
  { roles: ['boss'], allowHomepageManager: true, schema: idSchema },
  async ({ body, supabase }) => {
    dbResult(await supabase.from('faqs').delete().eq('id', body.id));
    return NextResponse.json({ success: true });
  }
);
