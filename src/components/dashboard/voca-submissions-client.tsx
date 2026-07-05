'use client';

import { useCallback, useEffect, useState } from 'react';
import { format } from 'date-fns';
import { CheckCircle, ChevronDown, ChevronUp, Loader2, Swords } from 'lucide-react';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { VocaMatchingSubmission, VocaMatchingSubmissionStatus, VocaWrongWordType } from '@/types/voca';

type TabMode = 'submissions' | 'wrong-review';
type FilterStatus = VocaMatchingSubmissionStatus | 'all';

interface SubmissionWithStudent extends VocaMatchingSubmission {
  student: { full_name: string; email: string } | null;
}

const TYPE_LABELS: Record<VocaWrongWordType, string> = {
  synonym: '유의어',
  antonym: '반의어',
  sentence: '예문',
};

// 뱃지 의미 색 — 유형 구분은 정보라서 색을 준다 (유의어=그린, 반의어=옐로, 예문=블루)
const TYPE_BADGE_STYLES: Record<VocaWrongWordType, string> = {
  synonym: 'bg-[#E6F4EA] text-[#188038]',
  antonym: 'bg-[#FEF7E0] text-[#B06000]',
  sentence: 'bg-[#E8F0FE] text-[#1A73E8]',
};

// 탭·필터는 틴트 칩 — 솔리드 블루는 주 액션(확인 완료)에만 (위계)
const chipClass = (active: boolean) =>
  active
    ? 'rounded-full bg-accent px-4 py-1.5 text-sm font-bold text-primary'
    : 'rounded-full border px-4 py-1.5 text-sm font-medium text-gray-500 transition-colors hover:bg-muted';

const FILTER_OPTIONS: { value: FilterStatus; label: string }[] = [
  { value: 'pending', label: '미확인' },
  { value: 'reviewed', label: '확인완료' },
  { value: 'all', label: '전체' },
];

export function VocaSubmissionsClient() {
  const [tab, setTab] = useState<TabMode>('submissions');
  const [submissions, setSubmissions] = useState<SubmissionWithStudent[]>([]);
  const [filter, setFilter] = useState<FilterStatus>('pending');
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const data = await fetchWithToast<SubmissionWithStudent[]>(
        `/api/voca/matching-submission${params}`,
        { method: 'GET', silent: true },
      );
      setSubmissions(data);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (tab === 'submissions') fetchSubmissions();
  }, [tab, fetchSubmissions]);

  async function handleReview(id: string) {
    setReviewingId(id);
    try {
      await fetchWithToast('/api/voca/matching-submission', {
        method: 'PATCH',
        body: { id, status: 'reviewed' },
        successMessage: '확인 완료 처리되었습니다',
      });
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
    } finally {
      setReviewingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Tab buttons */}
      <div className="flex gap-2 border-b pb-2">
        <button className={chipClass(tab === 'submissions')} onClick={() => setTab('submissions')}>
          오답노트
        </button>
        <button className={`${chipClass(tab === 'wrong-review')} inline-flex items-center`} onClick={() => setTab('wrong-review')}>
          <Swords className="mr-1 h-4 w-4" />
          올킬오답
        </button>
      </div>

      {tab === 'wrong-review' && <WrongReviewStatusTab />}

      {tab === 'submissions' && <>
      {/* Filter buttons */}
      <div className="flex gap-2">
        {FILTER_OPTIONS.map((opt) => (
          <button key={opt.value} className={chipClass(filter === opt.value)} onClick={() => setFilter(opt.value)}>
            {opt.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty state */}
      {!loading && submissions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <CheckCircle className="mb-3 h-12 w-12" />
          <p className="text-lg font-medium">제출된 오답 노트가 없습니다</p>
        </div>
      )}

      {/* Submission cards */}
      {!loading &&
        submissions.map((sub) => (
          <Card key={sub.id}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <p className="font-semibold">{sub.student?.full_name || '알 수 없음'}</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(sub.created_at), 'MM/dd HH:mm')}
                </p>
              </div>
              {sub.status === 'pending' ? (
                <Button
                  size="sm"
                  onClick={() => handleReview(sub.id)}
                  disabled={reviewingId === sub.id}
                >
                  {reviewingId === sub.id ? (
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="mr-1 h-4 w-4" />
                  )}
                  확인 완료
                </Button>
              ) : (
                <Badge variant="secondary">확인완료</Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Wrong words */}
              <div className="flex flex-wrap gap-2">
                {sub.wrong_words.map((w, i) => (
                  <div key={i} className="flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-sm">
                    <span className="font-medium">{w.word}</span>
                    <span className="text-muted-foreground">&rarr;</span>
                    <span>{w.match}</span>
                    <span className={`ml-1 rounded-full px-2 py-0.5 text-xs font-semibold ${TYPE_BADGE_STYLES[w.type]}`}>
                      {TYPE_LABELS[w.type]}
                    </span>
                  </div>
                ))}
              </div>

              {/* Writings toggle */}
              <button
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                onClick={() => setExpandedId(expandedId === sub.id ? null : sub.id)}
              >
                {expandedId === sub.id ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
                5번 쓰기 내용 {expandedId === sub.id ? '접기' : '보기'}
              </button>

              {expandedId === sub.id && (
                <div className="space-y-2 rounded-md bg-muted/50 p-3">
                  {sub.writings.map((w, i) => (
                    <div key={i}>
                      <p className="text-sm font-medium">{w.word}</p>
                      <div className="flex flex-wrap gap-1">
                        {w.attempts.map((a, j) => (
                          <span key={j} className="rounded bg-background px-2 py-0.5 text-sm">
                            {a}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </>}
    </div>
  );
}

// ──────────── 올킬오답 현황 탭 ────────────

interface WrongReviewStudent {
  studentId: string;
  studentName: string;
  totalWords: number;
  graduatedCount: number;
  completedAt: string | null;
}

function WrongReviewStatusTab() {
  const [students, setStudents] = useState<WrongReviewStudent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchWithToast<{ students: WrongReviewStudent[] }>('/api/voca/wrong-review/status', {
        method: 'GET',
        silent: true,
      });
      setStudents(res.students);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Swords className="mb-3 h-12 w-12" />
        <p className="text-lg font-medium">보카 학생이 없습니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {students.map((s) => {
        const pct = s.totalWords > 0 ? Math.round((s.graduatedCount / s.totalWords) * 100) : 0;
        return (
          <Card key={s.studentId}>
            <CardContent className="flex items-center gap-4 py-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium truncate">{s.studentName}</p>
                  {s.completedAt && <Badge variant="secondary">완료</Badge>}
                </div>
                {s.totalWords > 0 ? (
                  <div className="mt-1.5 flex items-center gap-2">
                    <Progress value={pct} className="h-2 flex-1" />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {s.graduatedCount}/{s.totalWords}
                    </span>
                  </div>
                ) : (
                  <p className="mt-1 text-xs text-muted-foreground">오답 없음</p>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
