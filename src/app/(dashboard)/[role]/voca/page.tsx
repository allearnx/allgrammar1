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

  const [{ data: books }, { data: allDays }] = await Promise.all([
    supabase.from('voca_books').select(VOCA_BOOKS_COLUMNS).order('sort_order'),
    supabase.from('voca_days').select('book_id'),
  ]);

  // 교재별 Day 수 — 비슷한 이름의 빈 교재를 진짜 교재로 착각하는 혼동 방지용 배지
  const dayCounts: Record<string, number> = {};
  for (const d of allDays || []) {
    dayCounts[d.book_id] = (dayCounts[d.book_id] ?? 0) + 1;
  }

  return (
    <>
      <Topbar user={user} title="올킬보카 관리" />
      <div className="p-4 md:p-6">
        <VocaAdminClient books={books || []} dayCounts={dayCounts} />
      </div>
    </>
  );
}
