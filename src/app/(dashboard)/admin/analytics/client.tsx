'use client';

import { useEffect, useState } from 'react';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import { Users, Activity, TrendingUp, BookMarked, BookA } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface AnalyticsData {
  totalStudents: number;
  activeStudents: number;
  weeklyActiveStudents: number;
  naesinCount: number;
  vocaCount: number;
  dailyActivity: { date: string; count: number }[];
  rankings: { id: string; name: string; completedStages: number }[];
}

import { StatCard } from '@/components/shared/stat-card';

export function AdminAnalyticsClient() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchWithToast<AnalyticsData>('/api/admin/analytics', { method: 'GET', silent: true })
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

  const participationRate = data.totalStudents > 0
    ? Math.round((data.weeklyActiveStudents / data.totalStudents) * 100)
    : 0;

  const avgCompletion = data.rankings.length > 0
    ? Math.round(data.rankings.reduce((sum, r) => sum + r.completedStages, 0) / data.rankings.length)
    : 0;

  return (
    <div className="space-y-5">
      {/* ── 스탯 카드 ── */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="총 학생"
          value={data.totalStudents}
          sub={`활성 ${data.activeStudents}명`}
          color="#7C3AED"
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          label="주간 활성"
          value={data.weeklyActiveStudents}
          sub={`${participationRate}% 참여율`}
          color="#56C9A0"
          icon={<Activity className="h-5 w-5" />}
        />
        <StatCard
          label="평균 완료"
          value={`${avgCompletion}단계`}
          sub={`내신 ${data.naesinCount}명 · 보카 ${data.vocaCount}명`}
          color="#06B6D4"
          icon={<TrendingUp className="h-5 w-5" />}
        />
      </div>

      {/* ── 서비스 사용 현황 ── */}
      <div className="grid gap-3 grid-cols-2">
        <div
          className="rounded-xl p-4"
          style={{ background: 'linear-gradient(120deg, #F5F3FF, #EDE9FE)' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <BookMarked className="h-4 w-4 text-violet-500" />
            <span className="text-sm font-semibold text-gray-700">올인내신</span>
          </div>
          <div className="text-2xl font-bold tracking-tight">{data.naesinCount}명</div>
          <p className="text-xs text-gray-400 mt-0.5">
            {data.totalStudents > 0 ? Math.round((data.naesinCount / data.totalStudents) * 100) : 0}% 사용 중
          </p>
        </div>
        <div
          className="rounded-xl p-4"
          style={{ background: 'linear-gradient(120deg, #ECFEFF, #CFFAFE)' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <BookA className="h-4 w-4 text-cyan-500" />
            <span className="text-sm font-semibold text-gray-700">올킬보카</span>
          </div>
          <div className="text-2xl font-bold tracking-tight">{data.vocaCount}명</div>
          <p className="text-xs text-gray-400 mt-0.5">
            {data.totalStudents > 0 ? Math.round((data.vocaCount / data.totalStudents) * 100) : 0}% 사용 중
          </p>
        </div>
      </div>

      {/* ── 주간 활동 차트 ── */}
      <div className="rounded-xl border bg-white p-5">
        <h3 className="text-sm font-bold mb-4">주간 학습 활동</h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.dailyActivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis
                dataKey="date"
                tickFormatter={(v) => {
                  const d = new Date(v);
                  return `${d.getMonth() + 1}/${d.getDate()}`;
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
                labelFormatter={(v) => {
                  const d = new Date(v as string);
                  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
                }}
              />
              <Bar dataKey="count" fill="#7C3AED" radius={[6, 6, 0, 0]} name="활동 수" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── 학생 랭킹 ── */}
      <div className="rounded-xl border bg-white p-5">
        <h3 className="text-sm font-bold mb-4">학생 랭킹 <span className="text-gray-400 font-normal">(완료 단계 기준)</span></h3>
        {data.rankings.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">아직 학습 데이터가 없습니다.</p>
        ) : (
          <div className="space-y-1">
            {data.rankings.map((r, i) => {
              const isTop3 = i < 3;
              const medalColors = ['#F59E0B', '#9CA3AF', '#CD7F32'];
              return (
                <div
                  key={r.id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg transition-colors hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold"
                      style={{
                        background: isTop3 ? medalColors[i] : '#F3F4F6',
                        color: isTop3 ? 'white' : '#6B7280',
                      }}
                    >
                      {i + 1}
                    </span>
                    <span className="text-sm font-medium">{r.name}</span>
                  </div>
                  <span
                    className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold"
                    style={{
                      background: r.completedStages > 0 ? '#F5F3FF' : '#F3F4F6',
                      color: r.completedStages > 0 ? '#7C3AED' : '#9CA3AF',
                    }}
                  >
                    {r.completedStages}단계
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
