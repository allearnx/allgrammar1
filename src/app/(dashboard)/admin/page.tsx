import { requireRole } from '@/lib/auth/helpers';
import { createAdminClient } from '@/lib/supabase/admin';
import { Topbar } from '@/components/layout/topbar';
import { Users, BookOpen, FileText, GraduationCap, Rocket, BookA, BarChart3, ArrowRight, Settings } from 'lucide-react';
import Link from 'next/link';
import { AdminOnboardingWizard } from '@/components/onboarding/admin-onboarding-wizard';
import { StatCard } from '@/components/shared/stat-card';

const QUICK_ACTIONS = [
  { title: '학생 관리', description: '학생 목록 및 진도 확인', href: '/admin/students', color: 'indigo', icon: Users },
  { title: '선생님 관리', description: '선생님 목록 및 상태 관리', href: '/admin/teachers', color: 'blue', icon: GraduationCap },
  { title: '학원 통계', description: '학습 현황 분석', href: '/admin/analytics', color: 'purple', icon: BarChart3 },
  { title: '학원 설정', description: '학원 정보 및 초대 코드', href: '/admin/settings', color: 'emerald', icon: Settings },
] as const;

const ACTION_STYLES: Record<string, { bg: string; text: string; hoverBorder: string }> = {
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', hoverBorder: 'hover:border-indigo-300' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', hoverBorder: 'hover:border-blue-300' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', hoverBorder: 'hover:border-purple-300' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', hoverBorder: 'hover:border-emerald-300' },
};

export default async function AdminDashboard() {
  const user = await requireRole(['admin', 'boss']);
  const admin = createAdminClient();

  const [studentRes, teacherRes, grammarRes, memoryRes, academyRes] = await Promise.all([
    admin
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'student')
      .eq('academy_id', user.academy_id!),
    admin
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'teacher')
      .eq('academy_id', user.academy_id!),
    admin
      .from('grammars')
      .select('id', { count: 'exact', head: true }),
    admin
      .from('memory_items')
      .select('id', { count: 'exact', head: true }),
    admin
      .from('academies')
      .select('max_students, onboarding_completed_at, invite_code')
      .eq('id', user.academy_id!)
      .single(),
  ]);

  const maxStudents = academyRes.data?.max_students as number | null;
  const onboardingCompleted = !!academyRes.data?.onboarding_completed_at;
  const studentCount = studentRes.count || 0;
  const seatPct = maxStudents ? Math.min((studentCount / maxStudents) * 100, 100) : 0;

  return (
    <>
      <Topbar user={user} title="관리자 대시보드" />
      {!onboardingCompleted && academyRes.data?.invite_code && (
        <AdminOnboardingWizard inviteCode={academyRes.data.invite_code} />
      )}
      <div className="p-4 md:p-6 space-y-5">
        {/* ── 보라 배너 헤더 ── */}
        <div
          className="relative overflow-hidden rounded-2xl p-6 md:p-8 text-white"
          style={{ background: 'linear-gradient(135deg, #A78BFA 0%, #7C3AED 50%, #6D28D9 100%)' }}
        >
          <div
            className="absolute -top-10 -right-10 h-40 w-40 rounded-full"
            style={{ background: 'rgba(255,255,255,0.1)' }}
          />
          <div
            className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          />

          <h2 className="relative text-2xl md:text-3xl font-bold">
            안녕하세요, {user.full_name}님!
          </h2>
          <p className="relative mt-1 text-white/80">
            학원 현황을 확인하세요.
          </p>

          <div className="relative mt-4 flex flex-wrap gap-3">
            <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-sm font-semibold text-gray-800">
              관리자
            </span>
            {maxStudents && (
              <span
                className="inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold"
                style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}
              >
                좌석 {studentCount}/{maxStudents}
              </span>
            )}
          </div>
        </div>

        {/* ── 스탯 카드 ── */}
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="학생 수"
            value={studentCount}
            sub="등록된 학생"
            color="#7C3AED"
            icon={<Users className="h-5 w-5" />}
          />
          <StatCard
            label="선생님 수"
            value={teacherRes.count || 0}
            sub="등록된 선생님"
            color="#06B6D4"
            icon={<GraduationCap className="h-5 w-5" />}
          />
          <StatCard
            label="문법 주제"
            value={grammarRes.count || 0}
            sub="전체 콘텐츠"
            color="#56C9A0"
            icon={<BookOpen className="h-5 w-5" />}
          />
          <StatCard
            label="암기 항목"
            value={memoryRes.count || 0}
            sub="전체 콘텐츠"
            color="#F59E0B"
            icon={<FileText className="h-5 w-5" />}
          />
        </div>

        {/* ── 좌석 프로그레스 ── */}
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

        {/* ── 온보딩 가이드 ── */}
        {studentCount === 0 && (teacherRes.count || 0) === 0 && (
          <div
            className="rounded-2xl p-6"
            style={{ background: 'linear-gradient(120deg, #F5F3FF, #EDE9FE)' }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Rocket className="h-5 w-5 text-violet-500" />
              <h3 className="text-lg font-bold">학원 시작 가이드</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center bg-violet-500 text-white rounded-full w-7 h-7 text-sm font-bold shrink-0">1</span>
                <GraduationCap className="h-5 w-5 text-violet-400 shrink-0" />
                <span className="text-sm text-gray-700">선생님을 등록하세요</span>
                <Link href="/admin/teachers" className="ml-auto bg-violet-600 hover:bg-violet-700 text-white rounded-lg px-4 py-1.5 text-xs font-medium shrink-0 transition-colors">선생님 관리</Link>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center bg-violet-500 text-white rounded-full w-7 h-7 text-sm font-bold shrink-0">2</span>
                <Users className="h-5 w-5 text-violet-400 shrink-0" />
                <span className="text-sm text-gray-700">학생을 초대하세요</span>
                <Link href="/admin/students" className="ml-auto bg-violet-600 hover:bg-violet-700 text-white rounded-lg px-4 py-1.5 text-xs font-medium shrink-0 transition-colors">학생 관리</Link>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center bg-violet-500 text-white rounded-full w-7 h-7 text-sm font-bold shrink-0">3</span>
                <BookA className="h-5 w-5 text-violet-400 shrink-0" />
                <span className="text-sm text-gray-700">학생에게 서비스를 배정하세요</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center bg-violet-500 text-white rounded-full w-7 h-7 text-sm font-bold shrink-0">4</span>
                <BarChart3 className="h-5 w-5 text-violet-400 shrink-0" />
                <span className="text-sm text-gray-700">학습 현황을 모니터링하세요</span>
              </div>
            </div>
          </div>
        )}

        {/* ── 퀵 액션 카드 ── */}
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          {QUICK_ACTIONS.map((action) => {
            const style = ACTION_STYLES[action.color];
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className={`rounded-2xl border bg-white p-5 transition-all hover:shadow-md ${style.hoverBorder}`}
              >
                <div className={`inline-flex rounded-xl ${style.bg} p-3`}>
                  <Icon className={`h-6 w-6 ${style.text}`} />
                </div>
                <h3 className="mt-3 font-semibold">{action.title}</h3>
                <p className="mt-1 text-sm text-gray-500">{action.description}</p>
                <ArrowRight className="mt-3 h-4 w-4 text-gray-400" />
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
