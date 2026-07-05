import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth/helpers';
import { createClient } from '@/lib/supabase/server';
import { Topbar } from '@/components/layout/topbar';
import { VocaAdminClient } from '@/components/dashboard/voca-admin';
import { getRoleConfig } from '@/lib/auth/role-page-config';
import { VOCA_BOOKS_COLUMNS } from '@/types/voca';

interface Props {
  params: Promise<{ role: string }>;
}

export default async function VocaPage({ params }: Props) {
  const { role } = await params;
  const { allowedRoles } = getRoleConfig(role);
  const user = await requireRole(allowedRoles);

  // 교재·단어는 전역 공유 콘텐츠 — 콘텐츠 권한 학원(올라영)+보스만 편집 화면 접근
  if (user.role !== 'boss' && !user.can_manage_content) {
    redirect(`/${role}`);
  }

  const supabase = await createClient();

  const { data: books } = await supabase
    .from('voca_books')
    .select(VOCA_BOOKS_COLUMNS)
    .order('sort_order');

  return (
    <>
      <Topbar user={user} title="올킬보카 관리" />
      <div className="p-4 md:p-6">
        <VocaAdminClient books={books || []} />
      </div>
    </>
  );
}
