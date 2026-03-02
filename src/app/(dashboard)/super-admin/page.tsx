import { requireRole } from '@/lib/auth/helpers';
import { Topbar } from '@/components/layout/topbar';

export default async function SuperAdminDashboard() {
  const user = await requireRole(['super_admin']);

  return (
    <>
      <Topbar user={user} title="슈퍼관리자 대시보드" />
      <div className="p-4 md:p-6">
        <h2 className="text-2xl font-bold mb-4">전체 시스템 관리</h2>
        <p className="text-muted-foreground">
          슈퍼관리자 기능은 Phase 3에서 확장됩니다.
        </p>
      </div>
    </>
  );
}
