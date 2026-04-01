import { useEffect, useState } from 'react';
import { fetchWithToast } from '@/lib/fetch-with-toast';
import type { StudentReportData } from '@/types/student-report';

export function useStudentReport(studentId?: string, token?: string) {
  const [data, setData] = useState<StudentReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReport() {
      setLoading(true);
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
      } catch (err) {
        setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, [studentId, token]);

  return { data, loading, error };
}
