'use client';

import { Receipt, ExternalLink } from 'lucide-react';
import type { PaymentHistory } from '@/types/billing';

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  success: { label: '완료', color: 'text-emerald-700', bg: 'bg-emerald-50' },
  failed: { label: '실패', color: 'text-red-700', bg: 'bg-red-50' },
  refunded: { label: '환불', color: 'text-amber-700', bg: 'bg-amber-50' },
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('ko', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function PaymentHistoryCard({ payments }: { payments: PaymentHistory[] }) {
  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden">
      <div className="px-6 pt-6 pb-4">
        <h3 className="text-[15px] font-semibold text-gray-400 flex items-center gap-2">
          <Receipt className="h-[18px] w-[18px]" />
          결제 내역
        </h3>
      </div>

      {payments.length === 0 ? (
        <div className="px-6 pb-8 text-center">
          <p className="text-sm text-gray-400 py-4">결제 내역이 없습니다</p>
        </div>
      ) : (
        <div>
          {payments.map((p, idx) => {
            const info = STATUS_MAP[p.status] || STATUS_MAP.failed;
            return (
              <div
                key={p.id}
                className={`flex items-center justify-between px-6 py-4 ${
                  idx < payments.length - 1 ? 'border-b border-gray-50' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex flex-col">
                    <span className="text-[13px] font-medium text-gray-900">
                      {formatDate(p.paid_at || p.created_at)}
                    </span>
                    <span className={`inline-flex items-center w-fit rounded-full px-2 py-0.5 mt-1 text-[11px] font-semibold ${info.color} ${info.bg}`}>
                      {info.label}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[15px] font-bold text-gray-900 tabular-nums">
                    {p.amount.toLocaleString()}원
                  </span>
                  {p.receipt_url && (
                    <a
                      href={p.receipt_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[12px] text-gray-400 hover:text-[#3182F6] transition-colors"
                    >
                      영수증 <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
