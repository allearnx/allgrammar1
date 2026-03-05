import { requireUser } from '@/lib/auth/helpers';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/layout/sidebar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  // Fetch assigned services for students
  let services: string[] | undefined;
  if (user.role === 'student') {
    const supabase = await createClient();
    const { data } = await supabase
      .from('service_assignments')
      .select('service')
      .eq('student_id', user.id);
    services = data?.map((d) => d.service) || [];
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={user} services={services} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
