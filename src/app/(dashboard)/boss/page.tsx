import { requireRole } from '@/lib/auth/helpers';
import { createAdminClient } from '@/lib/supabase/admin';
import { Topbar } from '@/components/layout/topbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Building2, GraduationCap, Settings } from 'lucide-react';
import Link from 'next/link';

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

  return (
    <>
      <Topbar user={user} title="총관리자 대시보드" />
      <div className="p-4 md:p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">안녕하세요, {user.full_name}님!</h2>
          <p className="text-muted-foreground mt-1">전체 시스템 현황을 확인하세요.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-l-4 border-l-slate-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">학원 수</CardTitle>
              <div className="rounded-full bg-slate-100 p-2 dark:bg-slate-950">
                <Building2 className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight">{academyRes.count || 0}</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">전체 사용자</CardTitle>
              <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-950">
                <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight">{totalUserRes.count || 0}</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">학생 수</CardTitle>
              <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-950">
                <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight">{studentRes.count || 0}</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-indigo-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">선생님 수</CardTitle>
              <div className="rounded-full bg-indigo-100 p-2 dark:bg-indigo-950">
                <GraduationCap className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight">{teacherRes.count || 0}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="hover:shadow-md transition-shadow border-indigo-200 bg-indigo-50/30 dark:border-indigo-800 dark:bg-indigo-950/20">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center gap-3">
                <div className="rounded-full bg-indigo-100 p-3 dark:bg-indigo-950">
                  <Building2 className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="font-semibold">학원 관리</h3>
                <p className="text-sm text-muted-foreground">학원 추가, 수정, 삭제</p>
                <Button asChild className="mt-2">
                  <Link href="/boss/academies">학원 관리</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center gap-3">
                <div className="rounded-full bg-muted p-3">
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold">사용자 관리</h3>
                <p className="text-sm text-muted-foreground">역할 변경, 학원 배정, 상태 관리</p>
                <Button asChild variant="outline" className="mt-2">
                  <Link href="/boss/users">사용자 관리</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
