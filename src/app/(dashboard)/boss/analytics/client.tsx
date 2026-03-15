'use client';

import { useEffect, useState } from 'react';
import { Building2, Users, TrendingUp } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface AcademyHealth {
  id: string;
  name: string;
  totalUsers: number;
  students: number;
  activeStudents: number;
  maxStudents: number | null;
  weeklyActive: number;
}

interface BossAnalyticsData {
  totalAcademies: number;
  totalStudents: number;
  totalActive: number;
  academyHealth: AcademyHealth[];
  monthlyGrowth: { month: string; count: number }[];
  subscriptionDistribution: Record<string, number>;
}

const SUB_STATUS_LABELS: Record<string, string> = {
  trialing: '체험',
  active: '활성',
  past_due: '연체',
  canceled: '취소',
  expired: '만료',
};

const SUB_STATUS_COLORS: Record<string, string> = {
  trialing: '#F59E0B',
  active: '#22C55E',
  past_due: '#F43F5E',
  canceled: '#9CA3AF',
  expired: '#6B7280',
};

import { StatCard } from '@/components/shared/stat-card';

export function BossAnalyticsClient() {
  const [data, setData] = useState<BossAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/boss/analytics')
      .then((res) => {
        if (!res.ok) throw new Error('fetch failed');
        return res.json();
      })
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-white p-3.5 animate-pulse" style={{ borderLeftWidth: 4, borderLeftColor: '#E5E7EB' }}>
              <div className="h-3 w-16 bg-gray-100 rounded mb-3" />
              <div className="h-7 w-10 bg-gray-100 rounded mb-1" />
              <div className="h-3 w-20 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
        <div className="rounded-xl border bg-white p-5 animate-pulse">
          <div className="h-4 w-28 bg-gray-100 rounded mb-4" />
          <div className="h-56 bg-gray-50 rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return <p className="text-center text-rose-500 py-8">통계 데이터를 불러올 수 없습니다.</p>;
  }
  if (!data) return null;

  const totalSubs = Object.values(data.subscriptionDistribution).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-5">
      {/* ── 스탯 카드 ── */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="총 학원"
          value={data.totalAcademies}
          sub="등록된 학원"
          color="#56C9A0"
          icon={<Building2 className="h-5 w-5" />}
        />
        <StatCard
          label="총 학생"
          value={data.totalStudents}
          sub={`활성 ${data.totalActive}명`}
          color="#7C3AED"
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          label="총 구독"
          value={totalSubs}
          sub={totalSubs > 0 ? `활성 ${data.subscriptionDistribution.active || 0}건` : '구독 없음'}
          color="#06B6D4"
          icon={<TrendingUp className="h-5 w-5" />}
        />
      </div>

      {/* ── 구독 분포 ── */}
      {totalSubs > 0 && (
        <div className="rounded-xl border bg-white p-5">
          <h3 className="text-sm font-bold mb-3">구독 현황</h3>
          <div className="flex gap-2 flex-wrap">
            {Object.entries(data.subscriptionDistribution).map(([status, count]) => (
              <div
                key={status}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold"
                style={{
                  background: `${SUB_STATUS_COLORS[status]}15`,
                  color: SUB_STATUS_COLORS[status] || '#6B7280',
                }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: SUB_STATUS_COLORS[status] || '#6B7280' }}
                />
                {SUB_STATUS_LABELS[status] || status} {count}건
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 월별 성장 차트 ── */}
      <div className="rounded-xl border bg-white p-5">
        <h3 className="text-sm font-bold mb-4">월별 학생 가입 추이</h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.monthlyGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis
                dataKey="month"
                tickFormatter={(v) => {
                  const [, m] = v.split('-');
                  return `${parseInt(m)}월`;
                }}
                fontSize={11}
                tick={{ fill: '#9CA3AF' }}
                axisLine={{ stroke: '#E5E7EB' }}
              />
              <YAxis
                fontSize={11}
                allowDecimals={false}
                tick={{ fill: '#9CA3AF' }}
                axisLine={{ stroke: '#E5E7EB' }}
              />
              <Tooltip
                contentStyle={{ borderRadius: 10, border: '1px solid #E5E7EB', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
              />
              <Bar dataKey="count" fill="#7C3AED" radius={[6, 6, 0, 0]} name="신규 학생" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── 학원 건강 테이블 ── */}
      <div className="rounded-xl border bg-white p-5">
        <h3 className="text-sm font-bold mb-4">학원 건강 현황</h3>
        {data.academyHealth.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">등록된 학원이 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="pb-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">학원</th>
                  <th className="pb-2.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">학생</th>
                  <th className="pb-2.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">활성</th>
                  <th className="pb-2.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">좌석</th>
                  <th className="pb-2.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">주간 활동</th>
                </tr>
              </thead>
              <tbody>
                {data.academyHealth.map((a) => {
                  const seatPct = a.maxStudents ? Math.round((a.students / a.maxStudents) * 100) : null;
                  return (
                    <tr key={a.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="py-3 font-medium">{a.name}</td>
                      <td className="py-3 text-right text-gray-600">{a.students}</td>
                      <td className="py-3 text-right text-gray-600">{a.activeStudents}</td>
                      <td className="py-3 text-right">
                        {a.maxStudents ? (
                          <span className="inline-flex items-center gap-1.5">
                            <span className="text-gray-600">{a.students}/{a.maxStudents}</span>
                            <span
                              className="inline-block w-12 h-1.5 rounded-full bg-gray-100 overflow-hidden"
                            >
                              <span
                                className="block h-full rounded-full"
                                style={{
                                  width: `${Math.min(seatPct!, 100)}%`,
                                  background: seatPct! >= 90 ? '#F43F5E' : '#56C9A0',
                                }}
                              />
                            </span>
                          </span>
                        ) : (
                          <span className="text-gray-400">무제한</span>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        <span
                          className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold"
                          style={{
                            background: a.weeklyActive > 0 ? '#F0FDF4' : '#F3F4F6',
                            color: a.weeklyActive > 0 ? '#22C55E' : '#9CA3AF',
                          }}
                        >
                          {a.weeklyActive}명
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
