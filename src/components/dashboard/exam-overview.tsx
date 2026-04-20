'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import { Badge } from '@/components/ui/badge';
import { DDayBadge } from '@/components/ui/dday-badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CalendarDays } from 'lucide-react';
import type { ExamOverviewItem } from '@/app/api/exam-overview/route';

interface Props {
  basePath: string;
}

export function ExamOverviewClient({ basePath }: Props) {
  const router = useRouter();
  const [exams, setExams] = useState<ExamOverviewItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await fetchWithToast<{ exams: ExamOverviewItem[] }>(
        '/api/exam-overview',
        { method: 'GET', silent: true },
      );
      setExams(data.exams);
    } catch {
      // error toasted
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const urgentCount = exams.filter((e) => e.dday >= 0 && e.dday <= 3).length;
  const futureExams = exams.filter((e) => e.dday >= 0);
  const pastExams = exams.filter((e) => e.dday < 0);

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          불러오는 중...
        </div>
      </div>
    );
  }

  if (exams.length === 0) {
    return (
      <div className="p-4 md:p-6">
        <div className="flex flex-col items-center py-12 px-4 rounded-2xl"
          style={{ background: 'linear-gradient(120deg, #F5F3FF, #EDE9FE)' }}>
          <div className="rounded-full bg-white/60 p-4 mb-3">
            <CalendarDays className="h-8 w-8 text-violet-500" />
          </div>
          <p className="text-center text-gray-700 font-semibold mb-1">
            예정된 시험이 없습니다
          </p>
          <p className="text-center text-sm text-muted-foreground">
            학생이 시험일을 설정하거나 선생님이 배정하면 여기에 표시됩니다
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Summary */}
      <div className="flex items-center gap-3 flex-wrap">
        <Badge variant="secondary" className="text-sm">
          전체 {futureExams.length}건
        </Badge>
        {urgentCount > 0 && (
          <Badge variant="destructive" className="text-sm">
            D-3 이내 {urgentCount}건
          </Badge>
        )}
        {pastExams.length > 0 && (
          <Badge variant="outline" className="text-sm text-muted-foreground">
            지난 시험 {pastExams.length}건
          </Badge>
        )}
      </div>

      {/* Table - desktop */}
      <div className="hidden md:block rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">학생</th>
              <th className="text-left px-4 py-3 font-medium">교과서</th>
              <th className="text-left px-4 py-3 font-medium">시험일</th>
              <th className="text-left px-4 py-3 font-medium">D-day</th>
              <th className="text-left px-4 py-3 font-medium">진도</th>
              <th className="text-left px-4 py-3 font-medium">구분</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {futureExams.map((exam, i) => (
              <tr
                key={`future-${i}`}
                className="hover:bg-muted/30 cursor-pointer transition-colors"
                onClick={() => router.push(`${basePath}/students/${exam.studentId}`)}
              >
                <td className="px-4 py-3 font-medium">{exam.studentName}</td>
                <td className="px-4 py-3">{exam.textbookName}{exam.examLabel ? ` (${exam.examLabel})` : ''}</td>
                <td className="px-4 py-3">{exam.examDate}</td>
                <td className="px-4 py-3"><DDayBadge dday={exam.dday} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Progress value={exam.progressPercent} className="h-2 w-20" />
                    <span className="text-xs text-muted-foreground">{exam.progressPercent}%</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className="text-xs">
                    {exam.source === 'student' ? '학생 설정' : '선생님 배정'}
                  </Badge>
                </td>
              </tr>
            ))}
            {pastExams.map((exam, i) => (
              <tr
                key={`past-${i}`}
                className="hover:bg-muted/30 cursor-pointer transition-colors opacity-50"
                onClick={() => router.push(`${basePath}/students/${exam.studentId}`)}
              >
                <td className="px-4 py-3 font-medium">{exam.studentName}</td>
                <td className="px-4 py-3">{exam.textbookName}{exam.examLabel ? ` (${exam.examLabel})` : ''}</td>
                <td className="px-4 py-3">{exam.examDate}</td>
                <td className="px-4 py-3"><DDayBadge dday={exam.dday} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Progress value={exam.progressPercent} className="h-2 w-20" />
                    <span className="text-xs text-muted-foreground">{exam.progressPercent}%</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className="text-xs">
                    {exam.source === 'student' ? '학생 설정' : '선생님 배정'}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cards - mobile */}
      <div className="md:hidden space-y-3">
        {futureExams.map((exam, i) => (
          <Card
            key={`m-future-${i}`}
            className="cursor-pointer hover:bg-muted/30 transition-colors"
            onClick={() => router.push(`${basePath}/students/${exam.studentId}`)}
          >
            <CardContent className="py-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">{exam.studentName}</span>
                <DDayBadge dday={exam.dday} />
              </div>
              <p className="text-sm text-muted-foreground">
                {exam.textbookName}{exam.examLabel ? ` (${exam.examLabel})` : ''} &middot; {exam.examDate}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1">
                  <Progress value={exam.progressPercent} className="h-2 flex-1" />
                  <span className="text-xs text-muted-foreground">{exam.progressPercent}%</span>
                </div>
                <Badge variant="outline" className="text-xs ml-2">
                  {exam.source === 'student' ? '학생 설정' : '선생님 배정'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
        {pastExams.map((exam, i) => (
          <Card
            key={`m-past-${i}`}
            className="cursor-pointer hover:bg-muted/30 transition-colors opacity-50"
            onClick={() => router.push(`${basePath}/students/${exam.studentId}`)}
          >
            <CardContent className="py-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">{exam.studentName}</span>
                <DDayBadge dday={exam.dday} />
              </div>
              <p className="text-sm text-muted-foreground">
                {exam.textbookName}{exam.examLabel ? ` (${exam.examLabel})` : ''} &middot; {exam.examDate}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1">
                  <Progress value={exam.progressPercent} className="h-2 flex-1" />
                  <span className="text-xs text-muted-foreground">{exam.progressPercent}%</span>
                </div>
                <Badge variant="outline" className="text-xs ml-2">
                  {exam.source === 'student' ? '학생 설정' : '선생님 배정'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
