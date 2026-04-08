import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import type { StudentReportData } from '@/types/student-report';

export function useStudentReport(studentId?: string, token?: string) {
  const [data, setData] = useState<StudentReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  const fetchReport = useCallback(async () => {
    // 최초 로드만 loading=true (refetch 시에는 기존 data 유지하여 화면 깜빡임 방지)
    if (!hasFetched.current) setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (studentId) params.set('studentId', studentId);
      if (token) params.set('token', token);
      const json = await fetchWithToast<StudentReportData>(`/api/student/my-report?${params.toString()}`, {
        method: 'GET',
        silent: true,
      });
      setData(json);
      hasFetched.current = true;
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [studentId, token]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  return { data, loading, error, refetch: fetchReport };
}
