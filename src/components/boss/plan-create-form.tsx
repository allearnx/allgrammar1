'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PlanCreateFormProps {
  onSubmit: (form: FormData) => void;
}

export function PlanCreateForm({ onSubmit }: PlanCreateFormProps) {
  return (
    <Card>
      <CardHeader><CardTitle>새 요금제 생성</CardTitle></CardHeader>
      <CardContent>
        <form action={onSubmit} className="grid gap-4 sm:grid-cols-2">
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
  );
}
