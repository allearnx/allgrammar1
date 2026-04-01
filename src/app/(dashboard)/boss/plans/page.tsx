'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import { Plus, X } from 'lucide-react';
import { PlanCreateForm } from '@/components/boss/plan-create-form';
import { PlanCard } from '@/components/boss/plan-card';
import type { SubscriptionPlan, PlanTarget } from '@/types/billing';

export default function BossPlansPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const fetchPlans = useCallback(async () => {
    try {
      const data = await fetchWithToast<SubscriptionPlan[]>('/api/boss/plans', {
        method: 'GET',
        silent: true,
      });
      setPlans(data);
    } catch {
      // silently ignore fetch errors
    } finally {
      setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  async function handleCreate(form: FormData) {
    const body = {
      name: form.get('name') as string,
      target: form.get('target') as PlanTarget,
      services: (form.get('services') as string).split(','),
      price_per_unit: Number(form.get('price_per_unit')),
      min_students: form.get('min_students') ? Number(form.get('min_students')) : null,
      description: form.get('description') as string || null,
    };

    try {
      await fetchWithToast('/api/boss/plans', {
        body,
        successMessage: '요금제가 생성되었습니다',
        errorMessage: '생성 실패',
      });
      setShowCreate(false);
      fetchPlans();
    } catch {
      // fetchWithToast already shows error toast
    }
  }

  async function handleToggleActive(plan: SubscriptionPlan) {
    try {
      await fetchWithToast('/api/boss/plans', {
        method: 'PATCH',
        body: { id: plan.id, is_active: !plan.is_active },
        successMessage: plan.is_active ? '비활성화됨' : '활성화됨',
      });
      fetchPlans();
    } catch {
      // fetchWithToast already shows error toast
    }
  }

  if (loading) return <div className="p-6">로딩 중...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">요금 플랜 관리</h1>
        <Button onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? <X className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
          {showCreate ? '취소' : '새 요금제'}
        </Button>
      </div>

      {showCreate && <PlanCreateForm onSubmit={handleCreate} />}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isEditing={editingId === plan.id}
            onToggleEdit={() => setEditingId(editingId === plan.id ? null : plan.id)}
            onToggleActive={() => handleToggleActive(plan)}
          />
        ))}
      </div>
    </div>
  );
}
