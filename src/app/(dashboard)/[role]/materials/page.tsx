import { Topbar } from '@/components/layout/topbar';
import { requireRole } from '@/lib/auth/helpers';
import { getRoleConfig } from '@/lib/auth/role-page-config';
import { createClient } from '@/lib/supabase/server';
import { MaterialsClient } from './client';

interface Props {
  params: Promise<{ role: string }>;
}

export default async function MaterialsPage({ params }: Props) {
  const { role } = await params;
  const { allowedRoles } = getRoleConfig(role);
  const user = await requireRole(allowedRoles);
  const supabase = await createClient();

  const { data: materials } = await supabase
    .from('learning_materials')
    .select('id, title, description, file_url, file_size, uploaded_by, academy_id, created_at')
    .order('created_at', { ascending: false });

  return (
    <>
      <Topbar user={user} title="학습자료" />
      <div className="p-4 md:p-6">
        <MaterialsClient
          initialMaterials={materials ?? []}
          userId={user.id}
          userRole={user.role}
        />
      </div>
    </>
  );
}
