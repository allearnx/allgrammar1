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
import { Input } from '@/components/ui/input';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import { Trash2, Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
interface User {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: string;
  academy_id: string | null;
  is_active: boolean;
  created_at: string;
}

interface Academy {
  id: string;
  name: string;
}

interface ServiceAssignment {
  student_id: string;
  service: string;
}

interface UsersClientProps {
  users: User[];
  academies: Academy[];
  serviceAssignments: ServiceAssignment[];
}

const ROLE_LABELS: Record<string, string> = {
  student: '학생',
  teacher: '선생님',
  admin: '관리자',
  boss: '총관리자',
};

const ROLE_OPTIONS = ['student', 'teacher', 'admin', 'boss'];

const SERVICE_LABELS: Record<string, string> = {
  naesin: '올인내신',
  voca: '올킬보카',
};

export function UsersClient({ users, academies, serviceAssignments }: UsersClientProps) {
  const [nameSearch, setNameSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [academyFilter, setAcademyFilter] = useState<string>('all');
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const router = useRouter();

  const academyMap = useMemo(() => {
    const map = new Map<string, string>();
    academies.forEach((a) => map.set(a.id, a.name));
    return map;
  }, [academies]);

  // 학생별 서비스 매핑 (student_id → service)
  const serviceMap = useMemo(() => {
    const map = new Map<string, string>();
    serviceAssignments.forEach((sa) => map.set(sa.student_id, sa.service));
    return map;
  }, [serviceAssignments]);

  const filteredUsers = useMemo(() => {
    const q = nameSearch.trim().toLowerCase();
    return users.filter((u) => {
      if (q && !u.full_name.toLowerCase().includes(q)) return false;
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (academyFilter !== 'all' && u.academy_id !== academyFilter) return false;
      return true;
    });
  }, [users, nameSearch, roleFilter, academyFilter]);

  async function handleDelete(userId: string) {
    setUpdating(userId);
    try {
      await fetchWithToast(`/api/boss/users/${userId}`, {
        method: 'DELETE',
        successMessage: '사용자가 삭제되었습니다',
        errorMessage: '삭제 실패',
      });
      setDeleteTarget(null);
      router.refresh();
    } catch {
      // error already toasted
    } finally {
      setUpdating(null);
    }
  }

  async function handleUpdate(userId: string, updates: Record<string, unknown>) {
    setUpdating(userId);
    try {
      await fetchWithToast(`/api/boss/users/${userId}`, {
        method: 'PATCH',
        body: updates,
        successMessage: '사용자 정보가 변경되었습니다',
        errorMessage: '변경 실패',
      });
      router.refresh();
    } catch {
      // error already toasted
    } finally {
      setUpdating(null);
    }
  }

  async function handleServiceChange(studentId: string, newService: string) {
    setUpdating(studentId);
    try {
      const currentService = serviceMap.get(studentId);
      // 기존 서비스 해제
      if (currentService) {
        await fetchWithToast('/api/service-assignments', {
          method: 'DELETE',
          body: { studentId, service: currentService },
          successMessage: '',
          errorMessage: '서비스 해제 실패',
        });
      }
      // 새 서비스 배정
      if (newService !== 'none') {
        await fetchWithToast('/api/service-assignments', {
          method: 'POST',
          body: { studentId, service: newService },
          successMessage: '서비스가 변경되었습니다',
          errorMessage: '서비스 변경 실패',
        });
      }
      router.refresh();
    } catch {
      // error already toasted
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="이름 검색"
            value={nameSearch}
            onChange={(e) => setNameSearch(e.target.value)}
            className="pl-8 w-[160px] h-9"
          />
        </div>
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
                  <p className="text-sm text-muted-foreground truncate">
                    {u.email}{u.phone && <span className="ml-2">{u.phone}</span>}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    학원: {u.academy_id ? academyMap.get(u.academy_id) || '-' : '미배정'}
                    {' · '}
                    가입: {new Date(u.created_at).toLocaleDateString('ko-KR')}
                  </p>
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
                  {u.role === 'student' && (
                    <Select
                      value={serviceMap.get(u.id) || 'none'}
                      onValueChange={(val) => handleServiceChange(u.id, val)}
                      disabled={updating === u.id}
                    >
                      <SelectTrigger className="w-[120px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">서비스 없음</SelectItem>
                        <SelectItem value="naesin">올인내신</SelectItem>
                        <SelectItem value="voca">올킬보카</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  <Button
                    variant={u.is_active ? 'destructive' : 'default'}
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => handleUpdate(u.id, { is_active: !u.is_active })}
                    disabled={updating === u.id}
                  >
                    {u.is_active ? '비활성화' : '활성화'}
                  </Button>
                  {u.role !== 'boss' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                      onClick={() => setDeleteTarget(u)}
                      disabled={updating === u.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
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

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>사용자 삭제</DialogTitle>
            <DialogDescription>
              <strong>{deleteTarget?.full_name}</strong> ({deleteTarget?.email})를 삭제하시겠습니까?
              이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>
              취소
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => deleteTarget && handleDelete(deleteTarget.id)}
              disabled={updating === deleteTarget?.id}
            >
              {updating === deleteTarget?.id ? '삭제 중...' : '삭제'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
