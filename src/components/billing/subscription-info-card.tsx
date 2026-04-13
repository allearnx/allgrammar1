'use client';

import { CreditCard, Calendar, Wallet, XCircle } from 'lucide-react';

interface SubscriptionInfoCardProps {
  planName: string;
  status: string;
  priceLabel: string;
  hasCard: boolean;
  periodStart: string;
  periodEnd: string;
  onRegisterCard: () => void;
  onCancel: () => void;
}

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: '이용 중', color: 'text-emerald-700', bg: 'bg-emerald-50' },
  trialing: { label: '체험 중', color: 'text-blue-700', bg: 'bg-blue-50' },
  past_due: { label: '결제 실패', color: 'text-red-700', bg: 'bg-red-50' },
  canceled: { label: '해지됨', color: 'text-gray-500', bg: 'bg-gray-100' },
  expired: { label: '만료됨', color: 'text-gray-500', bg: 'bg-gray-100' },
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('ko', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function SubscriptionInfoCard({
  planName,
  status,
  priceLabel,
  hasCard,
  periodStart,
  periodEnd,
  onRegisterCard,
  onCancel,
}: SubscriptionInfoCardProps) {
  const isCancellable = status !== 'canceled' && status !== 'expired';
  const s = STATUS_LABELS[status] || STATUS_LABELS.active;

  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden">
      {/* 헤더 */}
      <div className="px-6 pt-6 pb-5">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-[15px] font-semibold text-gray-400">현재 구독</h3>
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.color} ${s.bg}`}>
            {s.label}
          </span>
        </div>
        <div className="flex items-baseline gap-2 mt-3">
          <span className="text-2xl font-bold text-gray-900">{planName}</span>
          <span className="text-sm text-gray-400">{priceLabel}</span>
        </div>
      </div>

      {/* 정보 rows */}
      <div className="border-t border-gray-50">
        <InfoRow icon={<Calendar className="h-[18px] w-[18px] text-gray-400" />} label="이용 기간" value={`${formatDate(periodStart)} — ${formatDate(periodEnd)}`} />
        <InfoRow
          icon={<Wallet className="h-[18px] w-[18px] text-gray-400" />}
          label="결제 수단"
          value={hasCard ? '카드 등록됨' : '미등록'}
          valueColor={hasCard ? 'text-gray-900' : 'text-amber-600'}
        />
      </div>

      {/* 액션 */}
      <div className="px-6 py-4 flex gap-2.5">
        <button
          onClick={onRegisterCard}
          className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-[13px] font-semibold transition-all ${
            hasCard
              ? 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              : 'bg-[#3182F6] text-white hover:bg-[#2272EB]'
          }`}
        >
          <CreditCard className="h-4 w-4" />
          {hasCard ? '카드 변경' : '카드 등록'}
        </button>
        {isCancellable && (
          <button
            onClick={onCancel}
            className="flex items-center justify-center gap-1.5 rounded-xl px-5 py-3 text-[13px] font-semibold bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
          >
            <XCircle className="h-4 w-4" />
            해지
          </button>
        )}
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value, valueColor = 'text-gray-900' }: { icon: React.ReactNode; label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex items-center justify-between px-6 py-3.5 border-b border-gray-50 last:border-0">
      <div className="flex items-center gap-2.5">
        {icon}
        <span className="text-[13px] text-gray-500">{label}</span>
      </div>
      <span className={`text-[13px] font-medium ${valueColor}`}>{value}</span>
    </div>
  );
}
