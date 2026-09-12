'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { fetchWithToast } from '@/lib/fetch-with-toast';

interface GradingLog {
  id: string;
  question_number: number | null;
  question: string;
  reference_answer: string;
  student_answer: string;
  ai_score: number;
  ai_feedback: string | null;
  corrected_answer: string | null;
  grading_method: string;
  teacher_score: number | null;
  teacher_feedback: string | null;
  reviewed_at: string | null;
  created_at: string;
  student_name: string;
}

function scoreBadge(score: number) {
  if (score === 100) return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">100 정답</Badge>;
  if (score === 50) return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">50 부분</Badge>;
  return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">0 오답</Badge>;
}

/**
 * 서술형 AI 채점 검수 탭 — AI가 판정한 건을 선생님이 확인·교정한다.
 * 교정 이력은 채점 정확도 검증 데이터로 쌓인다 (AI-선생님 일치율).
 */
export function SubjectiveReviewTab() {
  const [logs, setLogs] = useState<GradingLog[]>([]);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [feedbackDrafts, setFeedbackDrafts] = useState<Record<string, string>>({});

  const load = useCallback(async (f: 'pending' | 'all') => {
    setLoading(true);
    try {
      const data = await fetchWithToast<{ logs: GradingLog[] }>(
        `/api/naesin/grading-review?filter=${f}`,
        { method: 'GET', errorMessage: '검수 목록을 불러오지 못했습니다.', logContext: 'naesin.grading_review' },
      );
      setLogs(data.logs);
    } catch {
      // fetchWithToast가 토스트 처리
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(filter); }, [filter, load]);

  async function review(log: GradingLog, teacherScore: 0 | 50 | 100) {
    setSavingId(log.id);
    try {
      await fetchWithToast(`/api/naesin/grading-review`, {
        method: 'PATCH',
        body: {
          id: log.id,
          teacherScore,
          teacherFeedback: feedbackDrafts[log.id]?.trim() || undefined,
        },
        errorMessage: '검수 저장에 실패했습니다.',
        logContext: 'naesin.grading_review',
      });
      const agreed = teacherScore === log.ai_score;
      toast.success(agreed ? '검수 완료 (AI 판정 유지)' : `검수 완료 — ${log.ai_score}점 → ${teacherScore}점 교정`);
      if (filter === 'pending') {
        setLogs((prev) => prev.filter((l) => l.id !== log.id));
      } else {
        setLogs((prev) => prev.map((l) =>
          l.id === log.id
            ? { ...l, teacher_score: teacherScore, reviewed_at: new Date().toISOString() }
            : l,
        ));
      }
    } catch {
      // fetchWithToast가 토스트 처리
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">서술형 채점 검수</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            문자열 일치에 실패해 AI가 판정한 서술형 답안입니다. 판정이 틀렸으면 점수를 교정해주세요.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant={filter === 'pending' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('pending')}>
            미검수
          </Button>
          <Button variant={filter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('all')}>
            전체
          </Button>
          <Button variant="outline" size="sm" onClick={() => load(filter)} disabled={loading}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : logs.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-12 text-center text-sm text-gray-400">
          {filter === 'pending' ? '검수할 AI 채점 건이 없습니다.' : 'AI 채점 기록이 없습니다.'}
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <Card key={log.id}>
              <CardContent className="py-4 space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-semibold">{log.student_name}</span>
                  {log.question_number != null && <span className="text-muted-foreground">문제 {log.question_number}</span>}
                  <span className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString('ko-KR')}</span>
                  <span className="ml-auto flex items-center gap-2">
                    {log.grading_method === 'fallback' && <Badge variant="outline">AI 실패 — 오답 처리됨</Badge>}
                    AI 판정: {scoreBadge(log.ai_score)}
                    {log.reviewed_at && (
                      log.teacher_score != null && log.teacher_score !== log.ai_score
                        ? <>→ 교정: {scoreBadge(log.teacher_score)}</>
                        : <Badge variant="secondary">검수 완료</Badge>
                    )}
                  </span>
                </div>

                <p className="text-sm whitespace-pre-wrap">{log.question}</p>

                <div className="grid gap-2 sm:grid-cols-2 text-sm">
                  <div className="rounded-md bg-muted px-3 py-2">
                    <span className="text-xs text-muted-foreground block mb-0.5">모범 답안</span>
                    {log.reference_answer}
                  </div>
                  <div className="rounded-md bg-muted px-3 py-2">
                    <span className="text-xs text-muted-foreground block mb-0.5">학생 답안</span>
                    {log.student_answer}
                  </div>
                </div>

                {(log.ai_feedback || log.corrected_answer) && (
                  <div className="text-sm text-muted-foreground">
                    {log.ai_feedback && <div>💡 {log.ai_feedback}</div>}
                    {log.corrected_answer && <div>✏️ {log.corrected_answer}</div>}
                  </div>
                )}

                {!log.reviewed_at && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-xs text-muted-foreground">선생님 판정:</span>
                    {([100, 50, 0] as const).map((s) => (
                      <Button
                        key={s}
                        size="sm"
                        variant={s === log.ai_score ? 'default' : 'outline'}
                        disabled={savingId === log.id}
                        onClick={() => review(log, s)}
                      >
                        {savingId === log.id ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                        {s === 100 ? '정답 (100)' : s === 50 ? '부분 (50)' : '오답 (0)'}
                      </Button>
                    ))}
                    <Textarea
                      placeholder="교정 메모 (선택)"
                      className="min-h-0 h-9 flex-1 min-w-[200px] resize-none text-sm"
                      value={feedbackDrafts[log.id] ?? ''}
                      onChange={(e) => setFeedbackDrafts((prev) => ({ ...prev, [log.id]: e.target.value }))}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
