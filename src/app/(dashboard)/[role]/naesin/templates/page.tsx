import { requireRole } from '@/lib/auth/helpers';
import { Topbar } from '@/components/layout/topbar';
import { getRoleConfig } from '@/lib/auth/role-page-config';
import { TemplateLibraryClient } from '@/components/dashboard/naesin-admin/template-library-client';

interface Props {
  params: Promise<{ role: string }>;
}

export default async function TemplatesPage({ params }: Props) {
  const { role } = await params;
  const { allowedRoles } = getRoleConfig(role);
  const user = await requireRole(allowedRoles);
  return (
    <>
      <Topbar user={user} title="문제 템플릿" />
      <div className="p-4 md:p-6">
        <TemplateLibraryClient />
      </div>
    </>
  );
}
