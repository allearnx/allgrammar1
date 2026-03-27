import { requireRole } from '@/lib/auth/helpers';
import { createAdminClient } from '@/lib/supabase/admin';
import { Topbar } from '@/components/layout/topbar';
import { StatCard } from '@/components/shared/stat-card';
import { DashboardBanner } from '@/components/shared/dashboard-banner';
import { QuickActionGrid, type QuickAction } from '@/components/shared/quick-action-grid';
import { OnboardingGuide } from '@/components/shared/onboarding-guide';
import { AdminOnboardingWizard } from '@/components/onboarding/admin-onboarding-wizard';
import { Users, BookOpen, FileText, GraduationCap, BookA, BarChart3, Settings } from 'lucide-react';

const QUICK_ACTIONS: QuickAction[] = [
  { title: '학생 관리', description: '학생 목록 및 진도 확인', href: '/admin/students', color: 'indigo', icon: Users },
  { title: '선생님 관리', description: '선생님 목록 및 상태 관리', href: '/admin/teachers', color: 'blue', icon: GraduationCap },
  { title: '학원 통계', description: '학습 현황 분석', href: '/admin/analytics', color: 'purple', icon: BarChart3 },
  { title: '학원 설정', description: '학원 정보 및 초대 코드', href: '/admin/settings', color: 'emerald', icon: Settings },
];

export default async function AdminDashboard() {
  const user = await requireRole(['admin', 'boss']);
  const admin = createAdminClient();

  const [studentRes, teacherRes, grammarRes, memoryRes, academyRes] = await Promise.all([
    admin.from('users').select('id', { count: 'exact', head: true }).eq('role', 'student').eq('academy_id', user.academy_id!),
    admin.from('users').select('id', { count: 'exact', head: true }).eq('role', 'teacher').eq('academy_id', user.academy_id!),
    admin.from('grammars').select('id', { count: 'exact', head: true }),
    admin.from('memory_items').select('id', { count: 'exact', head: true }),
    admin.from('academies').select('max_students, onboarding_completed_at, invite_code, contact_phone').eq('id', user.academy_id!).single(),
  ]);

  const maxStudents = academyRes.data?.max_students as number | null;
  const onboardingCompleted = !!academyRes.data?.onboarding_completed_at;
  const studentCount = studentRes.count || 0;
  const seatPct = maxStudents ? Math.min((studentCount / maxStudents) * 100, 100) : 0;

  return (
    <>
      <Topbar user={user} title="관리자 대시보드" />
      {!onboardingCompleted && academyRes.data?.invite_code && (
        <AdminOnboardingWizard inviteCode={academyRes.data.invite_code} hasContactPhone={!!academyRes.data?.contact_phone} />
      )}
      <div className="p-4 md:p-6 space-y-5">
        <DashboardBanner
          greeting={`안녕하세요, ${user.full_name}님!`}
          subtitle="학원 현황을 확인하세요."
          roleBadge="관리자"
          chips={maxStudents ? [{ label: `좌석 ${studentCount}/${maxStudents}` }] : undefined}
        />

        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <StatCard label="학생 수" value={studentCount} sub="등록된 학생" color="#7C3AED" icon={<Users className="h-5 w-5" />} />
          <StatCard label="선생님 수" value={teacherRes.count || 0} sub="등록된 선생님" color="#06B6D4" icon={<GraduationCap className="h-5 w-5" />} />
          <StatCard label="문법 주제" value={grammarRes.count || 0} sub="전체 콘텐츠" color="#56C9A0" icon={<BookOpen className="h-5 w-5" />} />
          <StatCard label="암기 항목" value={memoryRes.count || 0} sub="전체 콘텐츠" color="#F59E0B" icon={<FileText className="h-5 w-5" />} />
        </div>

        {maxStudents && (
          <div
            className="rounded-xl border bg-white p-4"
            style={{ borderLeftWidth: 4, borderLeftColor: seatPct >= 90 ? '#F43F5E' : '#06B6D4' }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">좌석 현황</span>
              <span className="text-sm text-gray-500">{studentCount} / {maxStudents}명</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${seatPct}%`,
                  background: seatPct >= 90 ? '#F43F5E' : 'linear-gradient(to right, #06B6D4, #4DD9C0)',
                }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {seatPct >= 90 ? '좌석이 거의 찼습니다' : `${Math.round(100 - seatPct)}% 여유`}
            </p>
          </div>
        )}

        {studentCount === 0 && (teacherRes.count || 0) === 0 && (
          <OnboardingGuide steps={[
            { icon: GraduationCap, text: '선생님을 등록하세요', href: '/admin/teachers', linkLabel: '선생님 관리' },
            { icon: Users, text: '학생을 초대하세요', href: '/admin/students', linkLabel: '학생 관리' },
            { icon: BookA, text: '학생에게 서비스를 배정하세요' },
            { icon: BarChart3, text: '학습 현황을 모니터링하세요' },
          ]} />
        )}

        <QuickActionGrid actions={QUICK_ACTIONS} />
      </div>
    </>
  );
}
