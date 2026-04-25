import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth/helpers';
import { createAdminClient } from '@/lib/supabase/admin';
import { Topbar } from '@/components/layout/topbar';
import { BlogClient } from './client';

export default async function BossBlogPage() {
  const user = await requireUser();
  if (user.role !== 'boss') redirect('/login');
  const admin = createAdminClient();

  const { data: posts } = await admin
    .from('blog_posts')
    .select(
      'id, slug, title, excerpt, category, thumbnail_url, is_published, published_at, view_count, sort_order, created_at, updated_at',
    )
    .order('created_at', { ascending: false });

  return (
    <>
      <Topbar user={user} title="블로그 관리" />
      <div className="p-4 md:p-6">
        <BlogClient posts={posts || []} />
      </div>
    </>
  );
}
