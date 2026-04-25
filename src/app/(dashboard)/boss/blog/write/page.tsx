import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth/helpers';
import { createAdminClient } from '@/lib/supabase/admin';
import { Topbar } from '@/components/layout/topbar';
import { BlogEditor } from './editor';
import type { BlogPost } from '@/types/blog';

export default async function BossBlogWritePage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  const user = await requireUser();
  if (user.role !== 'boss') redirect('/login');

  let post: BlogPost | null = null;

  if (id) {
    const admin = createAdminClient();
    const { data } = await admin
      .from('blog_posts')
      .select('*')
      .eq('id', id)
      .single();
    post = data;
    if (!post) redirect('/boss/blog');
  }

  return (
    <>
      <Topbar user={user} title={post ? '글 수정' : '새 글 작성'} />
      <div className="p-4 md:p-6">
        <BlogEditor post={post} />
      </div>
    </>
  );
}
