'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Plus, Pencil, X, Check } from 'lucide-react';
import type { SubscriptionPlan, PlanTarget } from '@/types/billing';

export default function BossPlansPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const fetchPlans = useCallback(async () => {
    const res = await fetch('/api/boss/plans');
    if (res.ok) setPlans(await res.json());
    setLoading(false);
  }, []);

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

    const res = await fetch('/api/boss/plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      toast.success('요금제가 생성되었습니다');
      setShowCreate(false);
      fetchPlans();
    } else {
      const data = await res.json();
      toast.error(data.error || '생성 실패');
    }
  }

  async function handleToggleActive(plan: SubscriptionPlan) {
    const res = await fetch('/api/boss/plans', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: plan.id, is_active: !plan.is_active }),
    });

    if (res.ok) {
      toast.success(plan.is_active ? '비활성화됨' : '활성화됨');
      fetchPlans();
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

      {showCreate && (
        <Card>
          <CardHeader><CardTitle>새 요금제 생성</CardTitle></CardHeader>
          <CardContent>
            <form action={handleCreate} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>이름</Label>
                <Input name="name" required placeholder="예: 학원 기본" />
              </div>
              <div className="space-y-2">
                <Label>대상</Label>
                <Select name="target" required>
                  <SelectTrigger><SelectValue placeholder="선택" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="academy">학원</SelectItem>
                    <SelectItem value="individual">개인</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>서비스 (콤마 구분)</Label>
                <Input name="services" required placeholder="naesin,voca" />
              </div>
              <div className="space-y-2">
                <Label>단가 (원)</Label>
                <Input name="price_per_unit" type="number" required placeholder="15000" />
              </div>
              <div className="space-y-2">
                <Label>최소 학생 수 (학원만)</Label>
                <Input name="min_students" type="number" placeholder="5" />
              </div>
              <div className="space-y-2">
                <Label>설명</Label>
                <Input name="description" placeholder="요금제 설명" />
              </div>
              <div className="sm:col-span-2 flex justify-end">
                <Button type="submit">생성</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.id} className={!plan.is_active ? 'opacity-50' : ''}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <div className="flex gap-1 mt-1">
                  <Badge variant={plan.target === 'academy' ? 'default' : 'secondary'}>
                    {plan.target === 'academy' ? '학원' : '개인'}
                  </Badge>
                  {plan.services.map((s) => (
                    <Badge key={s} variant="outline">{s}</Badge>
                  ))}
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditingId(editingId === plan.id ? null : plan.id)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleToggleActive(plan)}
                >
                  {plan.is_active ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {plan.price_per_unit.toLocaleString()}원
                <span className="text-sm font-normal text-muted-foreground">
                  {plan.target === 'academy' ? ' / 학생' : ' / 월'}
                </span>
              </p>
              {plan.min_students && (
                <p className="text-sm text-muted-foreground mt-1">
                  최소 {plan.min_students}명
                </p>
              )}
              {plan.description && (
                <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
