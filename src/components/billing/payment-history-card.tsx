'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Receipt } from 'lucide-react';
import type { PaymentHistory } from '@/types/billing';

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'destructive' }> = {
  success: { label: '성공', variant: 'default' },
  failed: { label: '실패', variant: 'destructive' },
  refunded: { label: '환불', variant: 'destructive' },
};

export function PaymentHistoryCard({ payments }: { payments: PaymentHistory[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          결제 내역
        </CardTitle>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">결제 내역이 없습니다</p>
        ) : (
          <div className="space-y-2">
            {payments.map((p) => {
              const info = STATUS_MAP[p.status] || { label: p.status, variant: 'destructive' as const };
              return (
                <div key={p.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <span className="text-sm">
                      {new Date(p.paid_at || p.created_at).toLocaleDateString('ko')}
                    </span>
                    <Badge variant={info.variant} className="ml-2">{info.label}</Badge>
                  </div>
                  <div className="text-right">
                    <span className="font-medium">{p.amount.toLocaleString()}원</span>
                    {p.receipt_url && (
                      <a
                        href={p.receipt_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary ml-2 hover:underline"
                      >
                        영수증
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
