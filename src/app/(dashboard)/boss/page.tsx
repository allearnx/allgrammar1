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
          <h2 className="text-2xl font-bold">안녕하세요, {user.full_name}님!</h2>
          <p className="text-muted-foreground mt-1">전체 시스템 현황을 확인하세요.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">학원 수</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{academyRes.count || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">전체 사용자</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUserRes.count || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">학생 수</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{studentRes.count || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">선생님 수</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teacherRes.count || 0}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center gap-3">
                <Building2 className="h-10 w-10 text-primary" />
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
                <Users className="h-10 w-10 text-primary" />
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
