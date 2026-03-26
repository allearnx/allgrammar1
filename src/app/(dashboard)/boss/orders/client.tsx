'use client';

import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/shared/stat-card';
import { Receipt, DollarSign, CheckCircle2, XCircle, RotateCcw, Inbox, ExternalLink } from 'lucide-react';
import type { Order, OrderStatus } from '@/types/billing';

interface OrderWithJoins extends Order {
  user: { full_name: string; email: string } | null;
  course: { title: string } | null;
}

interface OrdersClientProps {
  orders: OrderWithJoins[];
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: '대기',
  paid: '완료',
  failed: '실패',
  refunded: '환불',
  canceled: '취소',
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-blue-100 text-blue-700',
  canceled: 'bg-gray-100 text-gray-600',
};

function formatKRW(amount: number) {
  return amount.toLocaleString('ko-KR') + '원';
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function OrdersClient({ orders }: OrdersClientProps) {
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = statusFilter === 'all'
    ? orders
    : orders.filter((o) => o.status === statusFilter);

  const totalRevenue = orders
    .filter((o) => o.status === 'paid')
    .reduce((sum, o) => sum + o.amount, 0);
  const paidCount = orders.filter((o) => o.status === 'paid').length;
  const failedCount = orders.filter((o) => o.status === 'failed').length;
  const refundedCount = orders.filter((o) => o.status === 'refunded').length;

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* ── 그라데이션 헤더 ── */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 text-white"
        style={{ background: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 50%, #D97706 100%)' }}
      >
        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-xl p-2.5" style={{ background: 'rgba(255,255,255,0.15)' }}>
            <Receipt className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">주문 관리</h2>
            <p className="text-sm text-white/70">코스 일회성 결제 주문 내역을 확인합니다</p>
          </div>
        </div>
      </div>

      {/* ── 스탯 카드 ── */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <StatCard label="총 매출" value={formatKRW(totalRevenue)} sub="결제완료 기준" color="#D97706" icon={<DollarSign className="h-5 w-5" />} />
        <StatCard label="결제완료" value={paidCount} sub="성공 건수" color="#10B981" icon={<CheckCircle2 className="h-5 w-5" />} />
        <StatCard label="실패" value={failedCount} sub="결제 실패" color="#EF4444" icon={<XCircle className="h-5 w-5" />} />
        <StatCard label="환불" value={refundedCount} sub="환불 처리" color="#3B82F6" icon={<RotateCcw className="h-5 w-5" />} />
      </div>

      {/* ── 필터 + 테이블 ── */}
      <div className="rounded-xl border bg-white">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="font-semibold text-gray-900">주문 목록</h3>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="pending">대기</SelectItem>
              <SelectItem value="paid">완료</SelectItem>
              <SelectItem value="failed">실패</SelectItem>
              <SelectItem value="refunded">환불</SelectItem>
              <SelectItem value="canceled">취소</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filtered.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <div
              className="inline-flex rounded-full p-4 mb-3"
              style={{ background: 'linear-gradient(120deg, #FFFBEB, #FEF3C7)' }}
            >
              <Inbox className="h-7 w-7 text-amber-400" />
            </div>
            <p className="text-sm font-medium text-gray-700">주문 내역이 없습니다</p>
            <p className="text-xs text-gray-400 mt-1">홈페이지에서 코스 결제가 발생하면 표시됩니다</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50/80">
                  {['주문자', '주문명', '금액', '상태', '결제일', '영수증'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="font-medium text-gray-900">{order.user?.full_name || '-'}</div>
                      <div className="text-xs text-gray-400">{order.user?.email || '-'}</div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="text-gray-900">{order.order_name}</div>
                      {order.course && (
                        <div className="text-xs text-gray-400">{order.course.title}</div>
                      )}
                    </td>
                    <td className="px-5 py-3 font-medium text-gray-900">{formatKRW(order.amount)}</td>
                    <td className="px-5 py-3">
                      <Badge variant="secondary" className={`border-0 ${STATUS_COLORS[order.status]}`}>
                        {STATUS_LABELS[order.status]}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-gray-500 whitespace-nowrap">{formatDate(order.paid_at || order.created_at)}</td>
                    <td className="px-5 py-3">
                      {order.receipt_url ? (
                        <a
                          href={order.receipt_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-amber-600 hover:text-amber-700 text-xs font-medium"
                        >
                          영수증 <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-gray-300 text-xs">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
