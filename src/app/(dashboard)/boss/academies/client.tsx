'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Building2, Copy, RefreshCw, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';

interface Academy {
  id: string;
  name: string;
  invite_code: string;
  created_at: string;
  user_count: number;
  student_count: number;
  max_students: number | null;
  teachers: string[];
}

interface AcademiesClientProps {
  academies: Academy[];
}

export function AcademiesClient({ academies }: AcademiesClientProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingAcademy, setEditingAcademy] = useState<Academy | null>(null);
  const [name, setName] = useState('');
  const [maxStudents, setMaxStudents] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [regenerateConfirmId, setRegenerateConfirmId] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState<string | null>(null);
  const router = useRouter();

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch('/api/boss/academies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create');
      }

      toast.success('학원이 추가되었습니다');
      setName('');
      setAddOpen(false);
      router.refresh();
    } catch (err) {
      toast.error('추가 실패', { description: err instanceof Error ? err.message : '알 수 없는 오류' });
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingAcademy) return;
    setSaving(true);

    try {
      const res = await fetch(`/api/boss/academies/${editingAcademy.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          max_students: maxStudents ? parseInt(maxStudents, 10) : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update');
      }

      toast.success('학원 이름이 변경되었습니다');
      setEditOpen(false);
      setEditingAcademy(null);
      setName('');
      router.refresh();
    } catch (err) {
      toast.error('변경 실패', { description: err instanceof Error ? err.message : '알 수 없는 오류' });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(academyId: string) {
    setDeleting(academyId);

    try {
      const res = await fetch(`/api/boss/academies/${academyId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete');
      }

      toast.success('학원이 삭제되었습니다');
      router.refresh();
    } catch (err) {
      toast.error('삭제 실패', { description: err instanceof Error ? err.message : '알 수 없는 오류' });
    } finally {
      setDeleting(null);
    }
  }

  function handleCopyCode(code: string) {
    navigator.clipboard.writeText(code);
    toast.success('초대 코드가 복사되었습니다');
  }

  async function handleRegenerateCode(academyId: string) {
    setRegenerating(academyId);

    try {
      const res = await fetch(`/api/boss/academies/${academyId}`, {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to regenerate');
      }

      toast.success('초대 코드가 재생성되었습니다');
      router.refresh();
    } catch (err) {
      toast.error('재생성 실패', { description: err instanceof Error ? err.message : '알 수 없는 오류' });
    } finally {
      setRegenerating(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">
          총 {academies.length}개 학원
        </p>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-1" />
              학원 추가
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>학원 추가</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-2">
                <Label>학원 이름</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="예: 올라영어학원"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? '저장 중...' : '추가'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {academies.map((academy) => (
        <Card key={academy.id}>
          <CardContent className="py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Building2 className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <span className="font-medium truncate block">{academy.name}</span>
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      초대 코드: <code className="font-mono font-semibold text-foreground bg-muted px-1.5 py-0.5 rounded">{academy.invite_code}</code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleCopyCode(academy.invite_code)}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setRegenerateConfirmId(academy.id)}
                        disabled={regenerating === academy.id}
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${regenerating === academy.id ? 'animate-spin' : ''}`} />
                      </Button>
                    </span>
                    <span>회원 {academy.user_count}명</span>
                    {academy.max_students && (
                      <span>좌석 {academy.student_count}/{academy.max_students}명</span>
                    )}
                    <span>생성일: {format(new Date(academy.created_at), 'yyyy-MM-dd')}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                    <GraduationCap className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      선생님 {academy.teachers.length}명
                      {academy.teachers.length > 0 && (
                        <span className="text-foreground ml-1">
                          ({academy.teachers.join(', ')})
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingAcademy(academy);
                    setName(academy.name);
                    setMaxStudents(academy.max_students?.toString() || '');
                    setEditOpen(true);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteConfirmId(academy.id)}
                  disabled={deleting === academy.id}
                >
                  {deleting === academy.id ? '...' : <Trash2 className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {academies.length === 0 && (
        <p className="text-center text-muted-foreground py-8">
          등록된 학원이 없습니다.
        </p>
      )}

      <ConfirmDialog
        open={deleteConfirmId !== null}
        onOpenChange={(open) => { if (!open) setDeleteConfirmId(null); }}
        description="정말 이 학원을 삭제하시겠습니까?"
        onConfirm={() => {
          const id = deleteConfirmId;
          setDeleteConfirmId(null);
          if (id) handleDelete(id);
        }}
      />

      <ConfirmDialog
        open={regenerateConfirmId !== null}
        onOpenChange={(open) => { if (!open) setRegenerateConfirmId(null); }}
        description="초대 코드를 재생성하시겠습니까? 기존 코드는 더 이상 사용할 수 없습니다."
        onConfirm={() => {
          const id = regenerateConfirmId;
          setRegenerateConfirmId(null);
          if (id) handleRegenerateCode(id);
        }}
      />

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>학원 이름 변경</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label>학원 이름</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>최대 학생 수 (좌석)</Label>
              <Input
                type="number"
                min="1"
                value={maxStudents}
                onChange={(e) => setMaxStudents(e.target.value)}
                placeholder="비워두면 무제한"
              />
            </div>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? '저장 중...' : '변경'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
