'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard } from 'lucide-react';

interface SubscriptionInfoCardProps {
  planName: string;
  status: string;
  priceLabel: string;
  billingKey: string | null;
  periodStart: string;
  periodEnd: string;
  onRegisterCard: () => void;
  onCancel: () => void;
}

export function SubscriptionInfoCard({
  planName,
  status,
  priceLabel,
  billingKey,
  periodStart,
  periodEnd,
  onRegisterCard,
  onCancel,
}: SubscriptionInfoCardProps) {
  const isCancellable = status !== 'canceled' && status !== 'expired';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          구독 정보
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Row label="요금제" value={planName} />
        <div className="flex justify-between">
          <span className="text-muted-foreground">상태</span>
          <Badge>{status}</Badge>
        </div>
        <Row label="금액" value={priceLabel} />
        <Row label="결제 수단" value={billingKey ? '카드 등록됨' : '미등록'} />
        <div className="flex justify-between">
          <span className="text-muted-foreground">현재 기간</span>
          <span className="text-sm">
            {new Date(periodStart).toLocaleDateString('ko')} ~{' '}
            {new Date(periodEnd).toLocaleDateString('ko')}
          </span>
        </div>
        <div className="flex gap-2 pt-2">
          <Button variant={billingKey ? 'outline' : 'default'} onClick={onRegisterCard}>
            {!billingKey && <CreditCard className="h-4 w-4 mr-1" />}
            {billingKey ? '카드 변경' : '카드 등록'}
          </Button>
          {isCancellable && (
            <Button variant="destructive" onClick={onCancel}>
              구독 해지
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
