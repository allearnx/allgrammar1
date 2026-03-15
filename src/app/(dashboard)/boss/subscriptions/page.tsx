'use client';

import { useEffect, useState, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  CreditCard,
  Crown,
  Users,
  ArrowUpCircle,
  ArrowDownCircle,
  Loader2,
  Inbox,
  Building2,
  Zap,
} from 'lucide-react';

interface SubscriptionRow {
  id: string;
  status: string;
  tier: string;
  customer_key: string;
  billing_key: string | null;
  current_period_start: string;
  current_period_end: string;
  trial_end: string | null;
  failed_payment_count: number;
  created_at: string;
  plan: { name: string; target: string; price_per_unit: number } | null;
  academy: { id: string; name: string } | null;
  student: { id: string; full_name: string; email: string } | null;
}

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  trialing: { label: '체험 중', variant: 'secondary' },
  active: { label: '활성', variant: 'default' },
  past_due: { label: '결제 실패', variant: 'destructive' },
  canceled: { label: '해지', variant: 'outline' },
  expired: { label: '만료', variant: 'outline' },
};

function StatCard({
  label,
  value,
  sub,
  color,
  icon,
}: {
  label: string;
  value: string | number;
  sub: string;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl border bg-white p-3.5"
      style={{ borderLeftWidth: 4, borderLeftColor: color }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          {label}
        </span>
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="text-2xl font-bold tracking-tight">{value}</div>
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
    </div>
  );
}

export default function BossSubscriptionsPage() {
  const [subs, setSubs] = useState<SubscriptionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [changingTier, setChangingTier] = useState<string | null>(null);

  const fetchSubs = useCallback(async () => {
    const params = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
    const res = await fetch(`/api/boss/subscriptions${params}`);
    if (res.ok) setSubs(await res.json());
    setLoading(false);
  }, [statusFilter]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchSubs(); }, [fetchSubs]);

  const handleTierChange = async (subId: string, newTier: 'free' | 'paid') => {
    if (newTier === 'free') {
      if (!confirm('무료로 전환하면 유료 기능이 제한됩니다. 계속하시겠습니까?')) return;
    }
    setChangingTier(subId);
    try {
      const res = await fetch(`/api/boss/subscriptions/${subId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: newTier }),
      });
      if (res.ok) {
        await fetchSubs();
      } else {
        const data = await res.json();
        alert(data.error || '변경에 실패했습니다.');
      }
    } finally {
      setChangingTier(null);
    }
  };

  // Stats
  const totalCount = subs.length;
  const paidCount = subs.filter((s) => s.tier === 'paid').length;
  const freeCount = subs.filter((s) => s.tier === 'free').length;
  const activeCount = subs.filter((s) => s.status === 'active' || s.status === 'trialing').length;

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-5">
        {/* 헤더 스켈레톤 */}
        <div className="rounded-2xl p-6 animate-pulse" style={{ background: '#E9D5FF' }}>
          <div className="h-6 w-32 bg-white/40 rounded mb-2" />
          <div className="h-4 w-56 bg-white/30 rounded" />
        </div>
        {/* 스탯 스켈레톤 */}
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-white p-3.5 animate-pulse" style={{ borderLeftWidth: 4 }}>
              <div className="h-3 w-16 bg-gray-100 rounded mb-3" />
              <div className="h-7 w-10 bg-gray-100 rounded mb-1" />
              <div className="h-3 w-20 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
        {/* 테이블 스켈레톤 */}
        <div className="rounded-xl border bg-white p-4 animate-pulse">
          <div className="h-5 w-24 bg-gray-100 rounded mb-4" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-50 rounded mb-2" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* ── 그라데이션 헤더 ── */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 text-white"
        style={{ background: 'linear-gradient(135deg, #A78BFA 0%, #7C3AED 50%, #6D28D9 100%)' }}
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
          <div
            className="inline-flex rounded-xl p-2.5"
            style={{ background: 'rgba(255,255,255,0.15)' }}
          >
            <CreditCard className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">구독 관리</h2>
            <p className="text-sm text-white/70">학원별 구독 현황 및 티어를 관리합니다</p>
          </div>
        </div>
      </div>

      {/* ── 스탯 카드 ── */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="전체 구독"
          value={totalCount}
          sub="등록된 구독"
          color="#7C3AED"
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          label="유료 구독"
          value={paidCount}
          sub="프리미엄 사용 중"
          color="#10B981"
          icon={<Crown className="h-5 w-5" />}
        />
        <StatCard
          label="무료 구독"
          value={freeCount}
          sub="무료 플랜"
          color="#06B6D4"
          icon={<Zap className="h-5 w-5" />}
        />
        <StatCard
          label="활성 구독"
          value={activeCount}
          sub="활성 + 체험 중"
          color="#F59E0B"
          icon={<CreditCard className="h-5 w-5" />}
        />
      </div>

      {/* ── 필터 + 테이블 ── */}
      <div className="rounded-xl border bg-white">
        {/* 테이블 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="font-semibold text-gray-900">구독 목록</h3>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="trialing">체험 중</SelectItem>
              <SelectItem value="active">활성</SelectItem>
              <SelectItem value="past_due">결제 실패</SelectItem>
              <SelectItem value="canceled">해지</SelectItem>
              <SelectItem value="expired">만료</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {subs.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <div
              className="inline-flex rounded-full p-4 mb-3"
              style={{ background: 'linear-gradient(120deg, #F5F3FF, #EDE9FE)' }}
            >
              <Inbox className="h-7 w-7 text-violet-400" />
            </div>
            <p className="text-sm font-medium text-gray-700">구독 내역이 없습니다</p>
            <p className="text-xs text-gray-400 mt-1">새 학원을 등록하면 자동으로 생성됩니다</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50/80">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    구독자
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    요금제
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    티어
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    상태
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    카드
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    기간
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">
                    관리
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {subs.map((sub) => {
                  const statusInfo = STATUS_LABELS[sub.status] || { label: sub.status, variant: 'outline' as const };
                  const isFree = sub.tier === 'free';
                  const isChanging = changingTier === sub.id;
                  return (
                    <tr key={sub.id} className="transition-colors hover:bg-gray-50/60">
                      <td className="px-5 py-3.5">
                        {sub.academy ? (
                          <div className="flex items-center gap-2.5">
                            <div
                              className="flex items-center justify-center h-8 w-8 rounded-lg shrink-0"
                              style={{ background: 'linear-gradient(120deg, #F5F3FF, #EDE9FE)' }}
                            >
                              <Building2 className="h-4 w-4 text-violet-500" />
                            </div>
                            <div className="min-w-0">
                              <span className="font-medium text-gray-900 truncate block">
                                {sub.academy.name}
                              </span>
                              <span className="text-xs text-gray-400">학원</span>
                            </div>
                          </div>
                        ) : sub.student ? (
                          <div className="flex items-center gap-2.5">
                            <div
                              className="flex items-center justify-center h-8 w-8 rounded-lg shrink-0"
                              style={{ background: 'linear-gradient(120deg, #ECFEFF, #CFFAFE)' }}
                            >
                              <Users className="h-4 w-4 text-cyan-500" />
                            </div>
                            <div className="min-w-0">
                              <span className="font-medium text-gray-900 truncate block">
                                {sub.student.full_name}
                              </span>
                              <span className="text-xs text-gray-400 truncate block">
                                {sub.student.email}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-gray-700">{sub.plan?.name || '-'}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        {isFree ? (
                          <span
                            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                            style={{ background: '#F0F9FF', color: '#0284C7' }}
                          >
                            무료
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                            style={{ background: '#F5F3FF', color: '#7C3AED' }}
                          >
                            <Crown className="h-3 w-3" />
                            유료
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                        {sub.failed_payment_count > 0 && (
                          <span className="text-xs text-destructive ml-1">
                            (실패 {sub.failed_payment_count}회)
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={sub.billing_key ? 'text-green-600 font-medium text-xs' : 'text-gray-400 text-xs'}>
                          {sub.billing_key ? '등록됨' : '미등록'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-500 whitespace-nowrap">
                        {new Date(sub.current_period_start).toLocaleDateString('ko')} ~{' '}
                        {new Date(sub.current_period_end).toLocaleDateString('ko')}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {isFree ? (
                          <Button
                            size="sm"
                            className="text-white text-xs h-8"
                            style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}
                            disabled={isChanging}
                            onClick={() => handleTierChange(sub.id, 'paid')}
                          >
                            {isChanging ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <>
                                <ArrowUpCircle className="h-3.5 w-3.5 mr-1" />
                                유료 전환
                              </>
                            )}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-8 text-gray-500 hover:text-gray-700"
                            disabled={isChanging}
                            onClick={() => handleTierChange(sub.id, 'free')}
                          >
                            {isChanging ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <>
                                <ArrowDownCircle className="h-3.5 w-3.5 mr-1" />
                                무료 전환
                              </>
                            )}
                          </Button>
                        )}
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
