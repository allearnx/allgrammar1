import { requireRole } from '@/lib/auth/helpers';
import { createAdminClient } from '@/lib/supabase/admin';
import { Topbar } from '@/components/layout/topbar';
import { Users, Building2, GraduationCap, BookOpen, UserCog, ArrowRight } from 'lucide-react';
import Link from 'next/link';

function StatCard({
  label,
  value,
  sub,
  color,
  icon,
}: {
  label: string;
  value: string | number;
  sub: string;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl border bg-white p-3.5"
      style={{ borderLeftWidth: 4, borderLeftColor: color }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          {label}
        </span>
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="text-2xl font-bold tracking-tight">{value}</div>
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
    </div>
  );
}

const QUICK_ACTIONS = [
  {
    title: '학원 관리',
    description: '학원 추가, 수정, 삭제',
    href: '/boss/academies',
    color: 'indigo',
    icon: Building2,
  },
  {
    title: '사용자 관리',
    description: '역할 변경, 학원 배정, 상태 관리',
    href: '/boss/users',
    color: 'blue',
    icon: UserCog,
  },
  {
    title: '콘텐츠 관리',
    description: '레벨, 문법, 영상 관리',
    href: '/boss/content',
    color: 'purple',
    icon: BookOpen,
  },
  {
    title: '학생 관리',
    description: '학생 진도, 성적 확인',
    href: '/boss/students',
    color: 'emerald',
    icon: Users,
  },
] as const;

const ACTION_STYLES: Record<string, { bg: string; text: string; hoverBorder: string }> = {
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', hoverBorder: 'hover:border-indigo-300' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', hoverBorder: 'hover:border-blue-300' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', hoverBorder: 'hover:border-purple-300' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', hoverBorder: 'hover:border-emerald-300' },
};

export default async function BossDashboard() {
  const user = await requireRole(['boss']);
  const admin = createAdminClient();

  const [academyRes, totalUserRes, studentRes, teacherRes] = await Promise.all([
    admin
      .from('academies')
      .select('id', { count: 'exact', head: true }),
    admin
      .from('users')
      .select('id', { count: 'exact', head: true }),
    admin
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'student'),
    admin
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'teacher'),
  ]);

  const academyCount = academyRes.count || 0;
  const totalUserCount = totalUserRes.count || 0;
  const studentCount = studentRes.count || 0;
  const teacherCount = teacherRes.count || 0;

  return (
    <>
      <Topbar user={user} title="총관리자 대시보드" />
      <div className="p-4 md:p-6 space-y-6">
        {/* ── 보라 배너 헤더 ── */}
        <div
          className="relative overflow-hidden rounded-2xl p-6 md:p-8 text-white"
          style={{ background: '#A78BFA' }}
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
            전체 시스템 현황을 확인하세요.
          </p>

          <div className="relative mt-4 flex flex-wrap gap-3">
            <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-sm font-semibold text-gray-800">
              총관리자
            </span>
            <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-sm font-semibold text-gray-800">
              학원 {academyCount}개
            </span>
          </div>
        </div>

        {/* ── 스탯 카드 ── */}
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="학원 수"
            value={academyCount}
            sub="등록된 학원"
            color="#56C9A0"
            icon={<Building2 className="h-5 w-5" />}
          />
          <StatCard
            label="전체 사용자"
            value={totalUserCount}
            sub="모든 역할 포함"
            color="#7C3AED"
            icon={<Users className="h-5 w-5" />}
          />
          <StatCard
            label="학생 수"
            value={studentCount}
            sub="등록된 학생"
            color="#06B6D4"
            icon={<Users className="h-5 w-5" />}
          />
          <StatCard
            label="선생님 수"
            value={teacherCount}
            sub="등록된 선생님"
            color="#F59E0B"
            icon={<GraduationCap className="h-5 w-5" />}
          />
        </div>

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
