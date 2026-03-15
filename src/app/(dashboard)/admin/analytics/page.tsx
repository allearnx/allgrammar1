import { requireRole } from '@/lib/auth/helpers';
import { Topbar } from '@/components/layout/topbar';
import { BarChart3 } from 'lucide-react';
import { AdminAnalyticsClient } from './client';

export default async function AdminAnalyticsPage() {
  const user = await requireRole(['admin', 'boss']);

  return (
    <>
      <Topbar user={user} title="학원 통계" />
      <div className="p-4 md:p-6 space-y-5">
        {/* ── 헤더 ── */}
        <div
          className="relative overflow-hidden rounded-2xl p-6 text-white"
          style={{ background: '#A78BFA' }}
        >
          <div
            className="absolute -top-10 -right-10 h-40 w-40 rounded-full"
            style={{ background: 'rgba(255,255,255,0.1)' }}
          />
          <div
            className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          />
          <div className="relative flex items-center gap-3">
            <div className="inline-flex rounded-xl p-2.5" style={{ background: 'rgba(255,255,255,0.15)' }}>
              <BarChart3 className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">학원 통계</h2>
              <p className="text-sm text-white/70">학생 활동과 학습 현황을 분석합니다</p>
            </div>
          </div>
        </div>

        <AdminAnalyticsClient />
      </div>
    </>
  );
}
