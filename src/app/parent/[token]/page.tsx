import { createAdminClient } from '@/lib/supabase/admin';
import { StudentReportPanel } from '@/components/dashboard/student-report-panel';

interface Props {
  params: Promise<{ token: string }>;
}

export default async function ParentReportPage({ params }: Props) {
  const { token } = await params;
  const admin = createAdminClient();

  // Validate token
  const { data: tokenRow } = await admin
    .from('parent_share_tokens')
    .select('student_id')
    .eq('token', token)
    .eq('is_active', true)
    .single();

  if (!tokenRow) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4 px-4">
          <div className="text-5xl">🔒</div>
          <h1 className="text-xl font-bold text-gray-800">링크가 만료되었습니다</h1>
          <p className="text-gray-500 text-sm max-w-sm">
            이 리포트 링크는 더 이상 유효하지 않습니다.<br />
            선생님에게 새 링크를 요청해주세요.
          </p>
        </div>
      </div>
    );
  }

  // Get student info + services
  const [{ data: student }, { data: svcData }] = await Promise.all([
    admin.from('users').select('full_name').eq('id', tokenRow.student_id).single(),
    admin.from('service_assignments').select('service').eq('student_id', tokenRow.student_id),
  ]);

  const services = (svcData || []).map((s) => s.service);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Purple Hero Banner ── */}
      <header className="relative overflow-hidden bg-gradient-to-r from-violet-400 to-purple-500 px-4 py-5">
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} />
        <div className="relative max-w-4xl mx-auto flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
            <span className="text-white font-bold text-sm">OL</span>
          </div>
          <span className="font-bold text-white">올라영 AI 러닝 엔진</span>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto p-4 md:p-6 space-y-4">
        {/* Student info card */}
        <div className="rounded-xl bg-white border shadow-sm p-5">
          <h1 className="text-xl font-bold text-gray-800">
            {student?.full_name || '학생'} 학습 리포트
          </h1>
          <p className="text-sm text-gray-500 mt-1">실시간 학습 현황</p>
        </div>

        <StudentReportPanel token={token} services={services} />
      </main>

      {/* Watermark */}
      <footer className="text-center py-8 text-xs text-gray-300">
        Powered by 올라영 AI 러닝 엔진 &middot; &copy; 2026
      </footer>
    </div>
  );
}
