'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, Download } from 'lucide-react';
import { toast } from 'sonner';

interface Student {
  id: string;
  full_name: string;
  email: string;
}

interface ReportData {
  student: string;
  generatedAt: string;
  videoProgress: { completed: number; total: number };
  memoryProgress: { mastered: number; total: number; dueReviews: number };
  textbookProgress: { completed: number };
  totalWatchedMinutes: number;
  quizAccuracy: number;
}

interface ReportsClientProps {
  students: Student[];
}

export function ReportsClient({ students }: ReportsClientProps) {
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ReportData | null>(null);

  async function handleGenerate() {
    if (!selectedStudent) return;
    setLoading(true);

    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: selectedStudent }),
      });

      if (!response.ok) throw new Error('Failed to generate report');

      const data = await response.json();
      setReport(data);
      toast.success('리포트가 생성되었습니다');
    } catch {
      toast.error('리포트 생성 실패');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        학생을 선택하고 리포트를 생성하세요.
      </p>

      <div className="flex gap-3">
        <Select value={selectedStudent} onValueChange={setSelectedStudent}>
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="학생 선택" />
          </SelectTrigger>
          <SelectContent>
            {students.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.full_name} ({s.email})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handleGenerate} disabled={!selectedStudent || loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              생성 중...
            </>
          ) : (
            <>
              <FileText className="h-4 w-4 mr-1" />
              리포트 생성
            </>
          )}
        </Button>
      </div>

      {report && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>학습 리포트</CardTitle>
              <Badge variant="secondary">{report.generatedAt}</Badge>
            </div>
            <p className="text-muted-foreground">{report.student}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">영상 학습</p>
                <p className="text-2xl font-bold mt-1">
                  {report.videoProgress.completed}/{report.videoProgress.total}
                </p>
                <p className="text-xs text-muted-foreground">완료/전체</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">암기 마스터</p>
                <p className="text-2xl font-bold mt-1">
                  {report.memoryProgress.mastered}/{report.memoryProgress.total}
                </p>
                <p className="text-xs text-muted-foreground">복습 대기: {report.memoryProgress.dueReviews}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">총 학습 시간</p>
                <p className="text-2xl font-bold mt-1">{report.totalWatchedMinutes}분</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">퀴즈 정답률</p>
                <p className="text-2xl font-bold mt-1">{report.quizAccuracy}%</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground">교과서 학습</p>
                <p className="text-2xl font-bold mt-1">{report.textbookProgress.completed}</p>
                <p className="text-xs text-muted-foreground">완료 지문</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
