import { requireRole } from '@/lib/auth/helpers';
import { Topbar } from '@/components/layout/topbar';
import { BarChart3 } from 'lucide-react';
import { BossAnalyticsClient } from './client';

export default async function BossAnalyticsPage() {
  const user = await requireRole(['boss']);

  return (
    <>
      <Topbar user={user} title="플랫폼 통계" />
      <div className="p-4 md:p-6 space-y-5">
        {/* ── 헤더 ── */}
        <div
          className="relative overflow-hidden rounded-2xl p-6 text-white"
          style={{ background: '#A78BFA' }}
        >
          <div className="flex items-center gap-3">
            <div className="inline-flex rounded-xl p-2.5" style={{ background: 'rgba(255,255,255,0.15)' }}>
              <BarChart3 className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">플랫폼 통계</h2>
              <p className="text-sm text-white/70">전체 학원과 학생 현황을 모니터링합니다</p>
            </div>
          </div>
        </div>

        <BossAnalyticsClient />
      </div>
    </>
  );
}
