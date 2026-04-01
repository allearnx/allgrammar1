'use client';

import { useEffect, useState, useCallback } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { StatCard } from '@/components/shared/stat-card';
import { SubscriptionTableRow, type SubscriptionRow } from '@/components/boss/subscription-table-row';
import { SubscriptionsSkeleton } from '@/components/boss/subscriptions-skeleton';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import { CreditCard, Crown, Users, Inbox, Zap } from 'lucide-react';

export default function BossSubscriptionsPage() {
  const [subs, setSubs] = useState<SubscriptionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [changingTier, setChangingTier] = useState<string | null>(null);
  const [pendingTierChange, setPendingTierChange] = useState<{ subId: string; newTier: 'free' | 'paid' } | null>(null);

  const fetchSubs = useCallback(async () => {
    try {
      const params = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const data = await fetchWithToast<SubscriptionRow[]>(`/api/boss/subscriptions${params}`, {
        method: 'GET',
        silent: true,
      });
      setSubs(data);
    } catch {
      // silently ignore fetch errors
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchSubs(); }, [fetchSubs]);

  const requestTierChange = (subId: string, newTier: 'free' | 'paid') => {
    if (newTier === 'free') {
      setPendingTierChange({ subId, newTier });
      return;
    }
    executeTierChange(subId, newTier);
  };

  const executeTierChange = async (subId: string, newTier: 'free' | 'paid') => {
    setPendingTierChange(null);
    setChangingTier(subId);
    try {
      await fetchWithToast(`/api/boss/subscriptions/${subId}`, {
        method: 'PATCH',
        body: { tier: newTier },
        errorMessage: '변경에 실패했습니다.',
      });
      await fetchSubs();
    } catch {
      // fetchWithToast already shows error toast
    } finally {
      setChangingTier(null);
    }
  };

  if (loading) return <SubscriptionsSkeleton />;

  const totalCount = subs.length;
  const paidCount = subs.filter((s) => s.tier === 'paid').length;
  const freeCount = subs.filter((s) => s.tier === 'free').length;
  const activeCount = subs.filter((s) => s.status === 'active' || s.status === 'trialing').length;

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* ── 그라데이션 헤더 ── */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 text-white"
        style={{ background: 'linear-gradient(135deg, #A78BFA 0%, #7C3AED 50%, #6D28D9 100%)' }}
      >
        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-xl p-2.5" style={{ background: 'rgba(255,255,255,0.15)' }}>
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
        <StatCard label="전체 구독" value={totalCount} sub="등록된 구독" color="#7C3AED" icon={<Users className="h-5 w-5" />} />
        <StatCard label="유료 구독" value={paidCount} sub="프리미엄 사용 중" color="#10B981" icon={<Crown className="h-5 w-5" />} />
        <StatCard label="무료 구독" value={freeCount} sub="무료 플랜" color="#06B6D4" icon={<Zap className="h-5 w-5" />} />
        <StatCard label="활성 구독" value={activeCount} sub="활성 + 체험 중" color="#F59E0B" icon={<CreditCard className="h-5 w-5" />} />
      </div>

      {/* ── 필터 + 테이블 ── */}
      <div className="rounded-xl border bg-white">
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
                  {['구독자', '요금제', '티어', '상태', '카드', '기간'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">{h}</th>
                  ))}
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {subs.map((sub) => (
                  <SubscriptionTableRow
                    key={sub.id}
                    sub={sub}
                    isChanging={changingTier === sub.id}
                    onTierChange={requestTierChange}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!pendingTierChange}
        onOpenChange={(open) => { if (!open) setPendingTierChange(null); }}
        title="티어 변경"
        description="무료로 전환하면 유료 기능이 제한됩니다. 계속하시겠습니까?"
        confirmText="전환"
        destructive={false}
        onConfirm={() => {
          if (pendingTierChange) executeTierChange(pendingTierChange.subId, pendingTierChange.newTier);
        }}
      />
    </div>
  );
}
