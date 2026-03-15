'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, BookOpen, FileText, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { WorkbookOmrView } from './workbook-omr-view';
import type { NaesinWorkbook, NaesinWorkbookOmrSheet, NaesinWorkbookOmrAttempt } from '@/types/naesin';

type Step = 'workbook' | 'sheet' | 'solve';

interface WorkbookOmrClientProps {
  workbooks: NaesinWorkbook[];
}

export function WorkbookOmrClient({ workbooks }: WorkbookOmrClientProps) {
  const [step, setStep] = useState<Step>('workbook');
  const [selectedWorkbook, setSelectedWorkbook] = useState<NaesinWorkbook | null>(null);
  const [sheets, setSheets] = useState<NaesinWorkbookOmrSheet[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<NaesinWorkbookOmrSheet | null>(null);
  const [attempts, setAttempts] = useState<NaesinWorkbookOmrAttempt[]>([]);
  const [loading, setLoading] = useState(false);

  // Load sheets when workbook selected
  useEffect(() => {
    if (!selectedWorkbook) return;
    loadSheets(selectedWorkbook.id);
  }, [selectedWorkbook?.id, selectedWorkbook]);

  async function loadSheets(workbookId: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/naesin/workbook-omr-sheets?workbookId=${workbookId}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSheets(data);
    } catch (err) {
      console.error(err);
      toast.error('시트 목록을 불러오지 못했습니다');
    } finally {
      setLoading(false);
    }
  }

  async function loadAttempts(sheetId: string) {
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data } = await supabase
        .from('naesin_workbook_omr_attempts')
        .select('*')
        .eq('omr_sheet_id', sheetId)
        .order('created_at', { ascending: false });
      setAttempts((data || []) as NaesinWorkbookOmrAttempt[]);
    } catch (err) {
      console.error(err);
      }
  }

  function handleSelectWorkbook(wb: NaesinWorkbook) {
    setSelectedWorkbook(wb);
    setStep('sheet');
  }

  function handleSelectSheet(sheet: NaesinWorkbookOmrSheet) {
    setSelectedSheet(sheet);
    loadAttempts(sheet.id);
    setStep('solve');
  }

  function handleBack() {
    if (step === 'solve') {
      setSelectedSheet(null);
      setAttempts([]);
      setStep('sheet');
    } else if (step === 'sheet') {
      setSelectedWorkbook(null);
      setSheets([]);
      setStep('workbook');
    }
  }

  function handleSubmitComplete(attempt: NaesinWorkbookOmrAttempt) {
    setAttempts((prev) => [attempt, ...prev]);
  }

  // ── Step 1: 교재 선택 ──
  if (step === 'workbook') {
    const gradeWorkbooks: Record<number, NaesinWorkbook[]> = {};
    workbooks.forEach((wb) => {
      if (!gradeWorkbooks[wb.grade]) gradeWorkbooks[wb.grade] = [];
      gradeWorkbooks[wb.grade].push(wb);
    });

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold">교재 선택</h2>
          <p className="text-muted-foreground mt-1">
            풀 교재를 선택하세요.
          </p>
        </div>

        {workbooks.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            등록된 교재가 없습니다. 선생님에게 문의하세요.
          </p>
        ) : (
          <Tabs defaultValue="1">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="1">중1</TabsTrigger>
              <TabsTrigger value="2">중2</TabsTrigger>
              <TabsTrigger value="3">중3</TabsTrigger>
            </TabsList>

            {[1, 2, 3].map((grade) => (
              <TabsContent key={grade} value={String(grade)} className="mt-4">
                {gradeWorkbooks[grade]?.length ? (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {gradeWorkbooks[grade].map((wb) => (
                      <Card
                        key={wb.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => handleSelectWorkbook(wb)}
                      >
                        <CardContent className="py-6 text-center">
                          <BookOpen className="h-10 w-10 mx-auto text-primary mb-3" />
                          <p className="font-medium">{wb.title}</p>
                          <p className="text-sm text-muted-foreground mt-1">{wb.publisher}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    중{grade} 교재가 아직 등록되지 않았습니다.
                  </p>
                )}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    );
  }

  // ── Step 2: 시트 선택 ──
  if (step === 'sheet') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-xl font-bold">{selectedWorkbook?.title}</h2>
            <p className="text-muted-foreground text-sm">{selectedWorkbook?.publisher}</p>
          </div>
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground py-8">로딩 중...</p>
        ) : sheets.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            등록된 OMR 시트가 없습니다.
          </p>
        ) : (
          <div className="space-y-2">
            {sheets.map((sheet) => (
              <Card
                key={sheet.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleSelectSheet(sheet)}
              >
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-500" />
                      <span className="font-medium">{sheet.title}</span>
                    </div>
                    <Badge variant="secondary">{sheet.total_questions}문항</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Step 3: OMR 풀기 ──
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-xl font-bold">{selectedSheet?.title}</h2>
          <p className="text-muted-foreground text-sm">
            {selectedWorkbook?.title} · {selectedSheet?.total_questions}문항
          </p>
        </div>
      </div>

      {/* Past attempts */}
      {attempts.length > 0 && (
        <Card>
          <CardContent className="py-3">
            <p className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <Clock className="h-4 w-4" />
              이전 기록
            </p>
            <div className="flex flex-wrap gap-2">
              {attempts.slice(0, 5).map((a) => (
                <Badge key={a.id} variant={a.score_percent >= 80 ? 'default' : 'secondary'}>
                  {a.score_percent}점 ({a.correct_count}/{a.total_questions})
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <WorkbookOmrView
        sheet={selectedSheet!}
        onSubmitComplete={handleSubmitComplete}
      />
    </div>
  );
}
