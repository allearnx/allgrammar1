'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import { UsersFilterBar } from './users-filter-bar';
import { UserCard } from './user-card';

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
      if (currentService) {
        await fetchWithToast('/api/service-assignments', {
          method: 'DELETE',
          body: { studentId, service: currentService },
          successMessage: '',
          errorMessage: '서비스 해제 실패',
        });
      }
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
      <UsersFilterBar
        nameSearch={nameSearch}
        onNameSearchChange={setNameSearch}
        roleFilter={roleFilter}
        onRoleFilterChange={setRoleFilter}
        academyFilter={academyFilter}
        onAcademyFilterChange={setAcademyFilter}
        academies={academies}
        filteredCount={filteredUsers.length}
      />

      <div className="space-y-3">
        {filteredUsers.map((u) => (
          <UserCard
            key={u.id}
            user={u}
            academies={academies}
            academyName={u.academy_id ? academyMap.get(u.academy_id) : undefined}
            currentService={serviceMap.get(u.id)}
            updating={updating}
            onUpdate={handleUpdate}
            onServiceChange={handleServiceChange}
            onDelete={setDeleteTarget}
          />
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
