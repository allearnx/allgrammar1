'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MessageSquare, StickyNote } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { GRADE_OPTIONS } from '@/types/public';

interface ConsultationItem {
  id: string;
  created_at: string;
  student_name: string;
  grade: string;
  parent_phone: string;
  interest_course_ids: string[];
  interest_courses: string;
  status: string;
  memo: string;
}

const STATUS_OPTIONS = [
  { value: 'new', label: '신규', color: 'bg-blue-100 text-blue-700' },
  { value: 'contacted', label: '연락완료', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'enrolled', label: '등록완료', color: 'bg-green-100 text-green-700' },
  { value: 'closed', label: '종료', color: 'bg-gray-100 text-gray-700' },
];

function getStatusBadge(status: string) {
  const opt = STATUS_OPTIONS.find((o) => o.value === status) || STATUS_OPTIONS[0];
  return <Badge className={`${opt.color} border-0`}>{opt.label}</Badge>;
}

function getGradeLabel(grade: string) {
  return GRADE_OPTIONS.find((o) => o.value === grade)?.label || grade;
}

export function ConsultationsClient({ consultations }: { consultations: ConsultationItem[] }) {
  const [saving, setSaving] = useState(false);
  const [memoOpen, setMemoOpen] = useState(false);
  const [selected, setSelected] = useState<ConsultationItem | null>(null);
  const [memo, setMemo] = useState('');
  const router = useRouter();

  async function handleStatusChange(id: string, status: string) {
    setSaving(true);
    try {
      const res = await fetch('/api/boss/consultations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error((await res.json()).error || '상태 변경 실패');
      toast.success('상태가 변경되었습니다');
      router.refresh();
    } catch (err) {
      toast.error('변경 실패', { description: err instanceof Error ? err.message : '알 수 없는 오류' });
    } finally {
      setSaving(false);
    }
  }

  async function handleMemoSave() {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch('/api/boss/consultations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selected.id, memo }),
      });
      if (!res.ok) throw new Error((await res.json()).error || '메모 저장 실패');
      toast.success('메모가 저장되었습니다');
      setMemoOpen(false);
      router.refresh();
    } catch (err) {
      toast.error('저장 실패', { description: err instanceof Error ? err.message : '알 수 없는 오류' });
    } finally {
      setSaving(false);
    }
  }

  const newCount = consultations.filter((c) => c.status === 'new').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <p className="text-muted-foreground">총 {consultations.length}건</p>
          {newCount > 0 && (
            <Badge variant="destructive">{newCount}건 신규</Badge>
          )}
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>학생 이름</TableHead>
              <TableHead>학년</TableHead>
              <TableHead className="hidden md:table-cell">전화번호</TableHead>
              <TableHead className="hidden lg:table-cell">관심 코스</TableHead>
              <TableHead>상태</TableHead>
              <TableHead className="hidden md:table-cell">신청일</TableHead>
              <TableHead className="w-[60px]">메모</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {consultations.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.student_name}</TableCell>
                <TableCell>{getGradeLabel(c.grade)}</TableCell>
                <TableCell className="hidden md:table-cell">{c.parent_phone}</TableCell>
                <TableCell className="hidden lg:table-cell max-w-[200px] truncate">
                  {c.interest_courses || '-'}
                </TableCell>
                <TableCell>
                  <Select
                    value={c.status}
                    onValueChange={(v) => handleStatusChange(c.id, v)}
                    disabled={saving}
                  >
                    <SelectTrigger className="w-[120px] h-8">
                      <SelectValue>{getStatusBadge(c.status)}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                  {format(new Date(c.created_at), 'yyyy-MM-dd HH:mm')}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setSelected(c);
                      setMemo(c.memo || '');
                      setMemoOpen(true);
                    }}
                  >
                    <StickyNote className={`h-4 w-4 ${c.memo ? 'text-yellow-500' : 'text-muted-foreground'}`} />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {consultations.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  상담 신청이 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet open={memoOpen} onOpenChange={setMemoOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>메모 — {selected?.student_name}</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            <div className="text-sm text-muted-foreground space-y-1">
              <p>학년: {selected ? getGradeLabel(selected.grade) : ''}</p>
              <p>전화: {selected?.parent_phone}</p>
              <p>관심 코스: {selected?.interest_courses || '-'}</p>
            </div>
            <div className="space-y-2">
              <Label>메모</Label>
              <Textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="상담 메모를 입력하세요..."
                rows={6}
              />
            </div>
            <Button onClick={handleMemoSave} className="w-full" disabled={saving}>
              {saving ? '저장 중...' : '메모 저장'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
