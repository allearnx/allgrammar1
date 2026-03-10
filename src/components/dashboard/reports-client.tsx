'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, FileText, History, ChevronRight, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import type { EnhancedReportData, WeeklyReportRow } from '@/types/report';
import { ReportDisplay } from './report-display';

// ── 타입 ──

interface Student {
  id: string;
  full_name: string;
  email: string;
}

interface ReportsClientProps {
  students: Student[];
}

export function ReportsClient({ students }: ReportsClientProps) {
  const [selectedStudent, setSelectedStudent] = useState('');
  const [reportType, setReportType] = useState<'all' | 'naesin' | 'voca'>('all');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<EnhancedReportData | null>(null);
  const [history, setHistory] = useState<WeeklyReportRow[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [currentReportId, setCurrentReportId] = useState<string | null>(null);

  async function handleGenerate() {
    if (!selectedStudent) return;
    setLoading(true);
    setShowHistory(false);

    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: selectedStudent, reportType }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => null);
        throw new Error(err?.error || '리포트 생성에 실패했습니다');
      }

      const data: EnhancedReportData = await response.json();
      setReport(data);
      setCurrentReportId(data.reportId || null);
      toast.success('리포트가 생성되었습니다');
    } catch (err) {
      console.error(err);
      toast.error('리포트 생성 실패');
    } finally {
      setLoading(false);
    }
  }

  const handleHistory = useCallback(async () => {
    if (!selectedStudent) {
      toast.error('학생을 먼저 선택하세요');
      return;
    }
    setHistoryLoading(true);
    setShowHistory(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('weekly_reports')
        .select('*')
        .eq('student_id', selectedStudent)
        .order('week_start', { ascending: false })
        .limit(10);

      if (error) throw error;
      setHistory((data as WeeklyReportRow[]) || []);
    } catch (err) {
      console.error(err);
      toast.error('이력 조회 실패');
    } finally {
      setHistoryLoading(false);
    }
  }, [selectedStudent]);

  function loadHistoryReport(row: WeeklyReportRow) {
    setReport(row.stats);
    setCurrentReportId(row.id);
    setShowHistory(false);
  }

  async function handleDelete(reportId: string) {
    try {
      const res = await fetch(`/api/reports/${reportId}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || '삭제 실패');
      }
      setHistory((prev) => prev.filter((r) => r.id !== reportId));
      if (currentReportId === reportId) {
        setReport(null);
        setCurrentReportId(null);
      }
      toast.success('리포트가 삭제되었습니다');
    } catch (err) {
      console.error(err);
      toast.error('리포트 삭제 실패');
    }
  }

  function handleCopyShareLink() {
    if (!currentReportId) return;
    const url = `${window.location.origin}/report/${currentReportId}`;
    navigator.clipboard.writeText(url);
    toast.success('공유 링크가 복사되었습니다');
  }

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        학생을 선택하고 리포트를 생성하세요.
      </p>

      {/* 상단 액션 바 */}
      <div className="flex flex-wrap gap-3">
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
        <Select value={reportType} onValueChange={(v) => setReportType(v as 'all' | 'naesin' | 'voca')}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="naesin">내신</SelectItem>
            <SelectItem value="voca">올톡보카</SelectItem>
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
        <Button
          variant="outline"
          onClick={handleHistory}
          disabled={!selectedStudent || historyLoading}
        >
          {historyLoading ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <History className="h-4 w-4 mr-1" />
          )}
          리포트 이력
        </Button>
      </div>

      {/* 리포트 이력 패널 */}
      {showHistory && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">리포트 이력 (최근 10건)</CardTitle>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground">저장된 리포트가 없습니다.</p>
            ) : (
              <div className="space-y-1">
                {history.map((row) => (
                  <div
                    key={row.id}
                    className="flex w-full items-center justify-between rounded-md border px-4 py-2 text-sm hover:bg-muted transition-colors"
                  >
                    <button
                      onClick={() => loadHistoryReport(row)}
                      className="flex flex-1 items-center justify-between mr-2"
                    >
                      <span>
                        {row.week_start} ~ {row.week_end}
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => handleDelete(row.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1"
                      title="삭제"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {report && (
        <ReportDisplay
          report={report}
          currentReportId={currentReportId}
          onCopyShareLink={handleCopyShareLink}
        />
      )}
    </div>
  );
}
