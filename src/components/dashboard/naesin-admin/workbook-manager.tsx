'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Plus, Trash2, BookOpen, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import type { NaesinWorkbook, NaesinWorkbookOmrSheet } from '@/types/naesin';

export function WorkbookManager() {
  const [workbooks, setWorkbooks] = useState<NaesinWorkbook[]>([]);
  const [selectedWorkbook, setSelectedWorkbook] = useState<NaesinWorkbook | null>(null);
  const [sheets, setSheets] = useState<NaesinWorkbookOmrSheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'workbook' | 'sheet'; id: string } | null>(null);

  useEffect(() => {
    loadWorkbooks();
  }, []);

  useEffect(() => {
    if (selectedWorkbook) loadSheets(selectedWorkbook.id);
    else setSheets([]);
  }, [selectedWorkbook?.id]);

  async function loadWorkbooks() {
    setLoading(true);
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data } = await supabase
        .from('naesin_workbooks')
        .select('*')
        .order('grade')
        .order('sort_order');
      setWorkbooks((data || []) as NaesinWorkbook[]);
    } catch (err) {
      console.error(err);
      toast.error('교재 목록을 불러오지 못했습니다');
    } finally {
      setLoading(false);
    }
  }

  async function loadSheets(workbookId: string) {
    try {
      const res = await fetch(`/api/naesin/workbook-omr-sheets?workbookId=${workbookId}`);
      if (!res.ok) throw new Error();
      setSheets(await res.json());
    } catch (err) {
      console.error(err);
      toast.error('시트 목록을 불러오지 못했습니다');
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const { type, id } = deleteTarget;
    setDeleteTarget(null);

    try {
      const endpoint = type === 'workbook'
        ? '/api/naesin/workbooks'
        : '/api/naesin/workbook-omr-sheets';

      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) throw new Error();

      if (type === 'workbook') {
        setWorkbooks((prev) => prev.filter((w) => w.id !== id));
        if (selectedWorkbook?.id === id) setSelectedWorkbook(null);
        toast.success('교재가 삭제되었습니다');
      } else {
        setSheets((prev) => prev.filter((s) => s.id !== id));
        toast.success('시트가 삭제되었습니다');
      }
    } catch (err) {
      console.error(err);
      toast.error('삭제 중 오류가 발생했습니다');
    }
  }

  if (loading) {
    return <p className="text-center text-muted-foreground py-8">로딩 중...</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">교재 OMR 관리</h2>
        <AddWorkbookDialog onAdd={(wb) => setWorkbooks([...workbooks, wb])} />
      </div>

      {workbooks.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          등록된 교재가 없습니다. 교재를 추가해주세요.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {workbooks.map((wb) => (
            <Card
              key={wb.id}
              className={`cursor-pointer transition-shadow hover:shadow-md ${
                selectedWorkbook?.id === wb.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedWorkbook(wb)}
            >
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">{wb.title}</p>
                      <p className="text-sm text-muted-foreground">중{wb.grade} · {wb.publisher}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget({ type: 'workbook', id: wb.id });
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* OMR Sheets for selected workbook */}
      {selectedWorkbook && (
        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              {selectedWorkbook.title} - OMR 시트
            </h3>
            <AddSheetDialog
              workbookId={selectedWorkbook.id}
              onAdd={(sheet) => setSheets([...sheets, sheet])}
            />
          </div>

          {sheets.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              OMR 시트가 없습니다. 시트를 추가해주세요.
            </p>
          ) : (
            <div className="space-y-2">
              {sheets.map((sheet) => (
                <Card key={sheet.id}>
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="font-medium">{sheet.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {sheet.total_questions}문항 · 정답: [{sheet.answer_key.join(', ')}]
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setDeleteTarget({ type: 'sheet', id: sheet.id })}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        description={deleteTarget?.type === 'workbook' ? '이 교재를 삭제하시겠습니까? 관련 OMR 시트도 함께 삭제됩니다.' : '이 OMR 시트를 삭제하시겠습니까?'}
        onConfirm={handleDelete}
      />
    </div>
  );
}

// ── Add Workbook Dialog ──

function AddWorkbookDialog({ onAdd }: { onAdd: (wb: NaesinWorkbook) => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [publisher, setPublisher] = useState('');
  const [grade, setGrade] = useState('1');
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    if (!title.trim()) { toast.error('교재명을 입력해주세요'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/naesin/workbooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), publisher: publisher.trim(), grade: Number(grade) }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      onAdd(data);
      setOpen(false);
      setTitle('');
      setPublisher('');
      setGrade('1');
      toast.success('교재가 추가되었습니다');
    } catch (err) {
      console.error(err);
      toast.error('교재 추가에 실패했습니다');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" />
          교재 추가
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>교재 추가</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>교재명</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 마더텅 중2" />
          </div>
          <div>
            <Label>출판사</Label>
            <Input value={publisher} onChange={(e) => setPublisher(e.target.value)} placeholder="예: 마더텅" />
          </div>
          <div>
            <Label>학년</Label>
            <Select value={grade} onValueChange={setGrade}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">중1</SelectItem>
                <SelectItem value="2">중2</SelectItem>
                <SelectItem value="3">중3</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">취소</Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? '저장 중...' : '추가'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Add OMR Sheet Dialog ──

function AddSheetDialog({ workbookId, onAdd }: { workbookId: string; onAdd: (sheet: NaesinWorkbookOmrSheet) => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [totalQuestions, setTotalQuestions] = useState('');
  const [answerKeyStr, setAnswerKeyStr] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    if (!title.trim()) { toast.error('시트 제목을 입력해주세요'); return; }

    const total = Number(totalQuestions);
    if (!total || total < 1) { toast.error('문항 수를 입력해주세요'); return; }

    const answerKey = answerKeyStr
      .split(/[,\s]+/)
      .map(Number)
      .filter((n) => !isNaN(n) && n >= 1 && n <= 5);

    if (answerKey.length !== total) {
      toast.error(`정답 수(${answerKey.length})가 문항 수(${total})와 일치하지 않습니다`);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/naesin/workbook-omr-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workbook_id: workbookId,
          title: title.trim(),
          total_questions: total,
          answer_key: answerKey,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      onAdd(data);
      setOpen(false);
      setTitle('');
      setTotalQuestions('');
      setAnswerKeyStr('');
      toast.success('OMR 시트가 추가되었습니다');
    } catch (err) {
      console.error(err);
      toast.error('시트 추가에 실패했습니다');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" />
          시트 추가
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>OMR 시트 추가</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>시트 제목</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: Chapter 1 단원평가" />
          </div>
          <div>
            <Label>문항 수</Label>
            <Input
              type="number"
              value={totalQuestions}
              onChange={(e) => setTotalQuestions(e.target.value)}
              placeholder="예: 20"
              min={1}
              max={200}
            />
          </div>
          <div>
            <Label>정답 (쉼표 또는 공백으로 구분)</Label>
            <Input
              value={answerKeyStr}
              onChange={(e) => setAnswerKeyStr(e.target.value)}
              placeholder="예: 3 1 2 4 5 1 3 2 4 5 ..."
            />
            <p className="text-xs text-muted-foreground mt-1">1~5 사이 숫자를 문항 수만큼 입력</p>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">취소</Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? '저장 중...' : '추가'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
