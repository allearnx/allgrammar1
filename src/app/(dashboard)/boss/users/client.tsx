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
import { ServiceAssignmentToggle } from '@/components/dashboard/service-assignment-toggle';

interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
  academy_id: string | null;
  is_active: boolean;
  created_at: string;
}

interface Academy {
  id: string;
  name: string;
}

interface UsersClientProps {
  users: User[];
  academies: Academy[];
  serviceMap?: Record<string, string[]>;
}

const ROLE_LABELS: Record<string, string> = {
  student: '학생',
  teacher: '선생님',
  admin: '관리자',
  boss: '총관리자',
};

const ROLE_OPTIONS = ['student', 'teacher', 'admin', 'boss'];

export function UsersClient({ users, academies, serviceMap = {} }: UsersClientProps) {
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [academyFilter, setAcademyFilter] = useState<string>('all');
  const [updating, setUpdating] = useState<string | null>(null);
  const router = useRouter();

  const academyMap = useMemo(() => {
    const map = new Map<string, string>();
    academies.forEach((a) => map.set(a.id, a.name));
    return map;
  }, [academies]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (academyFilter !== 'all' && u.academy_id !== academyFilter) return false;
      return true;
    });
  }, [users, roleFilter, academyFilter]);

  async function handleUpdate(userId: string, updates: Record<string, unknown>) {
    setUpdating(userId);

    try {
      const res = await fetch(`/api/boss/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update');
      }

      toast.success('사용자 정보가 변경되었습니다');
      router.refresh();
    } catch (err) {
      toast.error('변경 실패', { description: err instanceof Error ? err.message : '알 수 없는 오류' });
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-muted-foreground">
          총 {filteredUsers.length}명
        </p>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="역할 필터" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 역할</SelectItem>
            {ROLE_OPTIONS.map((role) => (
              <SelectItem key={role} value={role}>
                {ROLE_LABELS[role]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={academyFilter} onValueChange={setAcademyFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="학원 필터" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 학원</SelectItem>
            {academies.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filteredUsers.map((u) => (
          <Card key={u.id}>
            <CardContent className="py-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium truncate">{u.full_name}</span>
                    <Badge variant="outline" className="text-xs">
                      {ROLE_LABELS[u.role] || u.role}
                    </Badge>
                    <Badge
                      variant={u.is_active ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {u.is_active ? '활성' : '비활성'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{u.email}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    학원: {u.academy_id ? academyMap.get(u.academy_id) || '-' : '미배정'}
                  </p>
                  {u.role === 'student' && (
                    <div className="mt-1.5">
                      <ServiceAssignmentToggle
                        studentId={u.id}
                        assignedServices={serviceMap[u.id] || []}
                      />
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <Select
                    value={u.role}
                    onValueChange={(role) => handleUpdate(u.id, { role })}
                    disabled={updating === u.id}
                  >
                    <SelectTrigger className="w-[120px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map((role) => (
                        <SelectItem key={role} value={role}>
                          {ROLE_LABELS[role]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={u.academy_id || 'none'}
                    onValueChange={(val) =>
                      handleUpdate(u.id, { academy_id: val === 'none' ? null : val })
                    }
                    disabled={updating === u.id}
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
                  <Button
                    variant={u.is_active ? 'destructive' : 'default'}
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => handleUpdate(u.id, { is_active: !u.is_active })}
                    disabled={updating === u.id}
                  >
                    {u.is_active ? '비활성화' : '활성화'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredUsers.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            조건에 맞는 사용자가 없습니다.
          </p>
        )}
      </div>
    </div>
  );
}
