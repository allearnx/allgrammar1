import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Crown,
  Users,
  ArrowUpCircle,
  ArrowDownCircle,
  Loader2,
  Building2,
} from 'lucide-react';

export interface SubscriptionRow {
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

/* ── 구독자 셀 ── */
function SubscriberCell({ academy, student }: Pick<SubscriptionRow, 'academy' | 'student'>) {
  if (academy) {
    return (
      <div className="flex items-center gap-2.5">
        <div
          className="flex items-center justify-center h-8 w-8 rounded-lg shrink-0"
          style={{ background: 'linear-gradient(120deg, #F5F3FF, #EDE9FE)' }}
        >
          <Building2 className="h-4 w-4 text-violet-500" />
        </div>
        <div className="min-w-0">
          <span className="font-medium text-gray-900 truncate block">{academy.name}</span>
          <span className="text-xs text-gray-400">학원</span>
        </div>
      </div>
    );
  }

  if (student) {
    return (
      <div className="flex items-center gap-2.5">
        <div
          className="flex items-center justify-center h-8 w-8 rounded-lg shrink-0"
          style={{ background: 'linear-gradient(120deg, #ECFEFF, #CFFAFE)' }}
        >
          <Users className="h-4 w-4 text-cyan-500" />
        </div>
        <div className="min-w-0">
          <span className="font-medium text-gray-900 truncate block">{student.full_name}</span>
          <span className="text-xs text-gray-400 truncate block">{student.email}</span>
        </div>
      </div>
    );
  }

  return <span className="text-gray-300">-</span>;
}

/* ── 티어 뱃지 ── */
function TierBadge({ isFree }: { isFree: boolean }) {
  return isFree ? (
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
  );
}

/* ── 티어 변경 버튼 ── */
function TierChangeButton({
  isFree,
  isChanging,
  onUpgrade,
  onDowngrade,
}: {
  isFree: boolean;
  isChanging: boolean;
  onUpgrade: () => void;
  onDowngrade: () => void;
}) {
  if (isFree) {
    return (
      <Button
        size="sm"
        className="text-white text-xs h-8"
        style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}
        disabled={isChanging}
        onClick={onUpgrade}
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
    );
  }

  return (
    <Button
      size="sm"
      variant="outline"
      className="text-xs h-8 text-gray-500 hover:text-gray-700"
      disabled={isChanging}
      onClick={onDowngrade}
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
  );
}

/* ── 테이블 행 ── */
export function SubscriptionTableRow({
  sub,
  isChanging,
  onTierChange,
}: {
  sub: SubscriptionRow;
  isChanging: boolean;
  onTierChange: (subId: string, newTier: 'free' | 'paid') => void;
}) {
  const statusInfo = STATUS_LABELS[sub.status] || { label: sub.status, variant: 'outline' as const };
  const isFree = sub.tier === 'free';

  return (
    <tr className="transition-colors hover:bg-gray-50/60">
      <td className="px-5 py-3.5">
        <SubscriberCell academy={sub.academy} student={sub.student} />
      </td>
      <td className="px-5 py-3.5">
        <span className="text-gray-700">{sub.plan?.name || '-'}</span>
      </td>
      <td className="px-5 py-3.5">
        <TierBadge isFree={isFree} />
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
        <TierChangeButton
          isFree={isFree}
          isChanging={isChanging}
          onUpgrade={() => onTierChange(sub.id, 'paid')}
          onDowngrade={() => onTierChange(sub.id, 'free')}
        />
      </td>
    </tr>
  );
}
