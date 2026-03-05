'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Teacher {
  id: string;
  full_name: string;
  email: string;
  is_active: boolean;
  created_at: string;
  academy_id: string | null;
}

interface Academy {
  id: string;
  name: string;
}

interface TeachersClientProps {
  teachers: Teacher[];
  academies?: Academy[];
}

export function TeachersClient({ teachers, academies }: TeachersClientProps) {
  const [updating, setUpdating] = useState<string | null>(null);
  const router = useRouter();

  const academyMap = useMemo(() => {
    const map = new Map<string, string>();
    academies?.forEach((a) => map.set(a.id, a.name));
    return map;
  }, [academies]);

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
    } catch (err) {
      toast.error('변경 실패', { description: err instanceof Error ? err.message : '알 수 없는 오류' });
    } finally {
      setUpdating(null);
    }
  }

  async function handleAcademyChange(teacherId: string, academyId: string) {
    setUpdating(teacherId);

    try {
      const res = await fetch(`/api/boss/users/${teacherId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ academy_id: academyId === 'none' ? null : academyId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update');
      }

      toast.success('학원이 변경되었습니다');
      router.refresh();
    } catch (err) {
      toast.error('변경 실패', { description: err instanceof Error ? err.message : '알 수 없는 오류' });
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
                <div className="flex flex-wrap items-center gap-3 mt-1">
                  <span className="text-xs text-muted-foreground">
                    가입일: {format(new Date(teacher.created_at), 'yyyy-MM-dd')}
                  </span>
                  {academies ? (
                    <span className="text-xs text-muted-foreground">
                      학원: {teacher.academy_id ? academyMap.get(teacher.academy_id) || '-' : '미배정'}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {academies && (
                  <Select
                    value={teacher.academy_id || 'none'}
                    onValueChange={(val) => handleAcademyChange(teacher.id, val)}
                    disabled={updating === teacher.id}
                  >
                    <SelectTrigger className="w-[150px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">미배정</SelectItem>
                      {academies.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
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
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
