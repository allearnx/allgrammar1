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
import { fetchWithToast } from '@/lib/fetch-with-toast';
import { format } from 'date-fns';
import { Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

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
  const [deleteTarget, setDeleteTarget] = useState<Teacher | null>(null);
  const router = useRouter();

  const academyMap = useMemo(() => {
    const map = new Map<string, string>();
    academies?.forEach((a) => map.set(a.id, a.name));
    return map;
  }, [academies]);

  async function handleToggle(teacherId: string, currentActive: boolean) {
    setUpdating(teacherId);

    try {
      await fetchWithToast(`/api/admin/teachers/${teacherId}`, {
        method: 'PATCH',
        body: { is_active: !currentActive },
        successMessage: !currentActive ? '선생님 활성화' : '선생님 비활성화',
        errorMessage: '변경 실패',
      });
      router.refresh();
    } catch {
      // fetchWithToast already showed toast
    } finally {
      setUpdating(null);
    }
  }

  async function handleDelete(teacherId: string) {
    setUpdating(teacherId);
    try {
      await fetchWithToast(`/api/boss/users/${teacherId}`, {
        method: 'DELETE',
        successMessage: '선생님이 삭제되었습니다',
        errorMessage: '삭제 실패',
      });
      setDeleteTarget(null);
      router.refresh();
    } catch {
      // fetchWithToast already showed toast
    } finally {
      setUpdating(null);
    }
  }

  async function handleAcademyChange(teacherId: string, academyId: string) {
    setUpdating(teacherId);

    try {
      await fetchWithToast(`/api/boss/users/${teacherId}`, {
        method: 'PATCH',
        body: { academy_id: academyId === 'none' ? null : academyId },
        successMessage: '학원이 변경되었습니다',
        errorMessage: '변경 실패',
      });
      router.refresh();
    } catch {
      // fetchWithToast already showed toast
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
                {academies && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                    onClick={() => setDeleteTarget(teacher)}
                    disabled={updating === teacher.id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>선생님 삭제</DialogTitle>
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
