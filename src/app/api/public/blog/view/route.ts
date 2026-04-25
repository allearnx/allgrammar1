import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit } from '@/lib/api/rate-limit';
import { blogViewSchema } from '@/lib/api/schemas';

export async function POST(request: NextRequest) {
  try {
    const raw = await request.json();
    const parsed = blogViewSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid slug' }, { status: 400 });
    }

    const { slug } = parsed.data;

    // Rate limit by IP — 10 views per minute per slug
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const limited = await checkRateLimit(`blog-view:${ip}:${slug}`, '/api/public/blog/view', 10, 60_000);
    if (limited) return limited;

    const admin = createAdminClient();
    await admin.rpc('increment_blog_view', { post_slug: slug });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
