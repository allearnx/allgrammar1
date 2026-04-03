import { requireRole } from '@/lib/auth/helpers';
import { createClient } from '@/lib/supabase/server';
import { Topbar } from '@/components/layout/topbar';
import { StudentReportPanel } from '@/components/dashboard/student-report-panel';

export default async function MyReportPage() {
  const user = await requireRole(['student']);
  const supabase = await createClient();

  const { data: assignments } = await supabase
    .from('service_assignments')
    .select('service')
    .eq('student_id', user.id);

  const services = assignments?.map((a) => a.service) || [];

  return (
    <>
      <Topbar user={user} title="내 리포트" />
      <div className="p-4 md:p-6">
        <StudentReportPanel services={services} role="student" />
      </div>
    </>
  );
}
