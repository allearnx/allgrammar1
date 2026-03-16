'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, X, Check } from 'lucide-react';
import type { SubscriptionPlan } from '@/types/billing';

interface PlanCardProps {
  plan: SubscriptionPlan;
  isEditing: boolean;
  onToggleEdit: () => void;
  onToggleActive: () => void;
}

export function PlanCard({ plan, isEditing, onToggleEdit, onToggleActive }: PlanCardProps) {
  return (
    <Card className={!plan.is_active ? 'opacity-50' : ''}>
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
          <Button variant="ghost" size="icon" onClick={onToggleEdit}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onToggleActive}>
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
          <p className="text-sm text-muted-foreground mt-1">최소 {plan.min_students}명</p>
        )}
        {plan.description && (
          <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
        )}
      </CardContent>
    </Card>
  );
}
