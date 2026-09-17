'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Search, UserRound } from 'lucide-react';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import { toast } from 'sonner';

interface Student {
  id: string;
  full_name: string;
}

interface AssignClinicDialogProps {
  templateId: string;
  templateTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * 단원 전체가 아니라 "특정 학생에게만" 템플릿 사본을 배정 (클리닉/집중훈련).
 * 배정 즉시 학생의 /student/naesin 홈 "선생님이 보낸 보충 문제"에 나타난다.
 */
export function AssignClinicDialog({ templateId, templateTitle, open, onOpenChange }: AssignClinicDialogProps) {
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [note, setNote] = useState('');
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelected(new Set());
    setSearch('');
    setNote('');
    setLoading(true);
    fetchWithToast<{ students: Student[] }>('/api/naesin/clinics/students', {
      silent: true,
      logContext: 'assign_clinic.load_students',
    })
      .then((data) => setStudents(data.students))
      .catch(() => setStudents([]))
      .finally(() => setLoading(false));
  }, [open]);

  const filtered = useMemo(() => {
    if (!search.trim()) return students;
    const q = search.trim();
    return students.filter((s) => s.full_name.includes(q));
  }, [students, search]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleAssign() {
    if (selected.size === 0) return;
    setAssigning(true);
    try {
      const res = await fetchWithToast<{ assigned: number; skipped: string[] }>('/api/naesin/clinics/assign', {
        body: { templateId, studentIds: [...selected], note: note.trim() || undefined },
        errorMessage: '배정에 실패했습니다.',
        logContext: 'assign_clinic.assign',
      });
      if (res.assigned > 0) {
        toast.success(`${res.assigned}명에게 배정했습니다.`);
      }
      if (res.skipped.length > 0) {
        toast.info(`${res.skipped.length}명은 이미 배정되어 아직 안 풀어서 건너뛰었습니다.`);
      }
      onOpenChange(false);
    } catch {
      // fetchWithToast가 에러 토스트 표시
    } finally {
      setAssigning(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>학생에게 배정</DialogTitle>
          <DialogDescription>
            &ldquo;{templateTitle}&rdquo;을 선택한 학생에게만 보냅니다. 단원에는 붙지 않고,
            학생 홈의 &ldquo;내신 콕콕&rdquo;에만 나타납니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="학생 이름 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="max-h-56 overflow-y-auto rounded-md border divide-y">
              {filtered.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">학생이 없습니다.</p>
              ) : (
                filtered.map((s) => (
                  <label
                    key={s.id}
                    className="flex items-center gap-2.5 px-3 py-2 hover:bg-muted/50 cursor-pointer text-sm"
                  >
                    <Checkbox checked={selected.has(s.id)} onCheckedChange={() => toggle(s.id)} />
                    <UserRound className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{s.full_name}</span>
                  </label>
                ))
              )}
            </div>
          )}

          <Textarea
            placeholder="배정 이유 (학생 화면에 짧게 표시됩니다. 예: 관계부사=전치사+관계대명사 유형을 자주 틀려서)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="text-sm"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>취소</Button>
          <Button onClick={handleAssign} disabled={selected.size === 0 || assigning}>
            {assigning ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
            {selected.size > 0 ? `${selected.size}명에게 배정` : '배정'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
