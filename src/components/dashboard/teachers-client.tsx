'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Teacher {
  id: string;
  full_name: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

interface TeachersClientProps {
  teachers: Teacher[];
}

export function TeachersClient({ teachers }: TeachersClientProps) {
  const [updating, setUpdating] = useState<string | null>(null);
  const router = useRouter();

  async function handleToggle(teacherId: string, currentActive: boolean) {
    setUpdating(teacherId);

    try {
      const res = await fetch(`/api/admin/teachers/${teacherId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentActive }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update');
      }

      toast.success(!currentActive ? '선생님 활성화' : '선생님 비활성화');
      router.refresh();
    } catch (err: any) {
      toast.error('변경 실패', { description: err.message });
    } finally {
      setUpdating(null);
    }
  }

  if (teachers.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        등록된 선생님이 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground">
        총 {teachers.length}명의 선생님
      </p>
      {teachers.map((teacher) => (
        <Card key={teacher.id}>
          <CardContent className="py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium truncate">{teacher.full_name}</span>
                  <Badge
                    variant={teacher.is_active ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {teacher.is_active ? '활성' : '비활성'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground truncate">{teacher.email}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  가입일: {format(new Date(teacher.created_at), 'yyyy-MM-dd')}
                </p>
              </div>
              <Button
                variant={teacher.is_active ? 'destructive' : 'default'}
                size="sm"
                onClick={() => handleToggle(teacher.id, teacher.is_active)}
                disabled={updating === teacher.id}
              >
                {updating === teacher.id
                  ? '변경 중...'
                  : teacher.is_active
                    ? '비활성화'
                    : '활성화'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
