'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SubscriptionRow {
  id: string;
  status: string;
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

export default function BossSubscriptionsPage() {
  const [subs, setSubs] = useState<SubscriptionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchSubs = useCallback(async () => {
    const params = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
    const res = await fetch(`/api/boss/subscriptions${params}`);
    if (res.ok) setSubs(await res.json());
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { fetchSubs(); }, [fetchSubs]);

  if (loading) return <div className="p-6">로딩 중...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">구독 관리</h1>
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

      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">구독자</th>
              <th className="px-4 py-3 text-left font-medium">요금제</th>
              <th className="px-4 py-3 text-left font-medium">상태</th>
              <th className="px-4 py-3 text-left font-medium">카드</th>
              <th className="px-4 py-3 text-left font-medium">기간</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {subs.map((sub) => {
              const statusInfo = STATUS_LABELS[sub.status] || { label: sub.status, variant: 'outline' as const };
              return (
                <tr key={sub.id}>
                  <td className="px-4 py-3">
                    {sub.academy ? (
                      <div>
                        <span className="font-medium">{sub.academy.name}</span>
                        <span className="text-xs text-muted-foreground ml-1">(학원)</span>
                      </div>
                    ) : sub.student ? (
                      <div>
                        <span className="font-medium">{sub.student.full_name}</span>
                        <span className="text-xs text-muted-foreground block">{sub.student.email}</span>
                      </div>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-3">{sub.plan?.name || '-'}</td>
                  <td className="px-4 py-3">
                    <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                    {sub.failed_payment_count > 0 && (
                      <span className="text-xs text-destructive ml-1">
                        (실패 {sub.failed_payment_count}회)
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {sub.billing_key ? '등록됨' : '미등록'}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(sub.current_period_start).toLocaleDateString('ko')} ~{' '}
                    {new Date(sub.current_period_end).toLocaleDateString('ko')}
                  </td>
                </tr>
              );
            })}
            {subs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  구독 내역이 없습니다
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
