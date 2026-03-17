import { requireRole } from '@/lib/auth/helpers';
import { createAdminClient } from '@/lib/supabase/admin';
import { Topbar } from '@/components/layout/topbar';
import { StatCard } from '@/components/shared/stat-card';
import { DashboardBanner } from '@/components/shared/dashboard-banner';
import { QuickActionGrid, type QuickAction } from '@/components/shared/quick-action-grid';
import { OnboardingGuide } from '@/components/shared/onboarding-guide';
import { BossAnalyticsClient } from './analytics/client';
import { Users, Building2, GraduationCap, BookOpen, UserCog } from 'lucide-react';

const QUICK_ACTIONS: QuickAction[] = [
  { title: '학원 관리', description: '학원 추가, 수정, 삭제', href: '/boss/academies', color: 'indigo', icon: Building2 },
  { title: '사용자 관리', description: '역할 변경, 학원 배정, 상태 관리', href: '/boss/users', color: 'blue', icon: UserCog },
  { title: '콘텐츠 관리', description: '레벨, 문법, 영상 관리', href: '/boss/content', color: 'purple', icon: BookOpen },
  { title: '학생 관리', description: '학생 진도, 성적 확인', href: '/boss/students', color: 'emerald', icon: Users },
];

export default async function BossDashboard() {
  const user = await requireRole(['boss']);
  const admin = createAdminClient();

  const [academyRes, totalUserRes, studentRes, teacherRes] = await Promise.all([
    admin.from('academies').select('id', { count: 'exact', head: true }),
    admin.from('users').select('id', { count: 'exact', head: true }),
    admin.from('users').select('id', { count: 'exact', head: true }).eq('role', 'student'),
    admin.from('users').select('id', { count: 'exact', head: true }).eq('role', 'teacher'),
  ]);

  const academyCount = academyRes.count || 0;
  const totalUserCount = totalUserRes.count || 0;
  const studentCount = studentRes.count || 0;
  const teacherCount = teacherRes.count || 0;

  return (
    <>
      <Topbar user={user} title="총관리자 대시보드" />
      <div className="p-4 md:p-6 pb-12 space-y-5">
        <DashboardBanner
          greeting={`안녕하세요, ${user.full_name}님!`}
          subtitle="전체 시스템 현황을 확인하세요."
          roleBadge="총관리자"
          chips={[{ label: `학원 ${academyCount}개` }]}
        />

        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <StatCard label="학원 수" value={academyCount} sub="등록된 학원" color="#56C9A0" icon={<Building2 className="h-5 w-5" />} />
          <StatCard label="전체 사용자" value={totalUserCount} sub="모든 역할 포함" color="#7C3AED" icon={<Users className="h-5 w-5" />} />
          <StatCard label="학생 수" value={studentCount} sub="등록된 학생" color="#06B6D4" icon={<Users className="h-5 w-5" />} />
          <StatCard label="선생님 수" value={teacherCount} sub="등록된 선생님" color="#F59E0B" icon={<GraduationCap className="h-5 w-5" />} />
        </div>

        {academyCount === 0 && (
          <OnboardingGuide steps={[
            { icon: Building2, text: '학원을 등록하세요', href: '/boss/academies', linkLabel: '학원 관리' },
            { icon: UserCog, text: '관리자/선생님을 배정하세요', href: '/boss/users', linkLabel: '사용자 관리' },
            { icon: Users, text: '전체 현황을 모니터링하세요' },
          ]} />
        )}

        <QuickActionGrid actions={QUICK_ACTIONS} />
        <BossAnalyticsClient />
      </div>
    </>
  );
}
