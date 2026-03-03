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
import { Plus, Pencil, Trash2, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Academy {
  id: string;
  name: string;
  created_at: string;
  user_count: number;
}

interface AcademiesClientProps {
  academies: Academy[];
}

export function AcademiesClient({ academies }: AcademiesClientProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingAcademy, setEditingAcademy] = useState<Academy | null>(null);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
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
    } catch (err: any) {
      toast.error('추가 실패', { description: err.message });
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
        body: JSON.stringify({ name }),
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
    } catch (err: any) {
      toast.error('변경 실패', { description: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(academyId: string) {
    if (!confirm('정말 이 학원을 삭제하시겠습니까?')) return;
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
    } catch (err: any) {
      toast.error('삭제 실패', { description: err.message });
    } finally {
      setDeleting(null);
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
                  <div className="flex gap-3 text-sm text-muted-foreground mt-1">
                    <span>회원 {academy.user_count}명</span>
                    <span>생성일: {format(new Date(academy.created_at), 'yyyy-MM-dd')}</span>
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
                    setEditOpen(true);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(academy.id)}
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
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? '저장 중...' : '변경'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
