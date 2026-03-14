import { requireRole } from '@/lib/auth/helpers';
import { createAdminClient } from '@/lib/supabase/admin';
import { Topbar } from '@/components/layout/topbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, BookOpen, FileText, GraduationCap, Rocket, BookA, BarChart3 } from 'lucide-react';
import Link from 'next/link';

export default async function AdminDashboard() {
  const user = await requireRole(['admin', 'boss']);
  const admin = createAdminClient();

  const [studentRes, teacherRes, grammarRes, memoryRes] = await Promise.all([
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
  ]);

  return (
    <>
      <Topbar user={user} title="관리자 대시보드" />
      <div className="p-4 md:p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">안녕하세요, {user.full_name}님!</h2>
          <p className="text-muted-foreground mt-1">학원 현황을 확인하세요.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">문법 주제</CardTitle>
              <div className="rounded-full bg-green-100 p-2 dark:bg-green-950">
                <BookOpen className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight">{grammarRes.count || 0}</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">암기 항목</CardTitle>
              <div className="rounded-full bg-purple-100 p-2 dark:bg-purple-950">
                <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight">{memoryRes.count || 0}</div>
            </CardContent>
          </Card>
        </div>

        {studentRes.count === 0 && teacherRes.count === 0 && (
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

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-md transition-shadow border-indigo-200 bg-indigo-50/30 dark:border-indigo-800 dark:bg-indigo-950/20">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center gap-3">
                <div className="rounded-full bg-indigo-100 p-3 dark:bg-indigo-950">
                  <Users className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="font-semibold">학생 관리</h3>
                <p className="text-sm text-muted-foreground">학생 목록 및 진도 확인</p>
                <Button asChild className="mt-2">
                  <Link href="/admin/students">학생 목록</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center gap-3">
                <div className="rounded-full bg-muted p-3">
                  <GraduationCap className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold">선생님 관리</h3>
                <p className="text-sm text-muted-foreground">선생님 목록 및 상태 관리</p>
                <Button asChild variant="outline" className="mt-2">
                  <Link href="/admin/teachers">선생님 목록</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center gap-3">
                <div className="rounded-full bg-muted p-3">
                  <BookOpen className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold">콘텐츠 관리</h3>
                <p className="text-sm text-muted-foreground">문법, 암기 항목, 교과서 관리</p>
                <Button asChild variant="outline" className="mt-2">
                  <Link href="/admin/content">콘텐츠 관리</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center gap-3">
                <div className="rounded-full bg-muted p-3">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold">리포트</h3>
                <p className="text-sm text-muted-foreground">학생 학습 리포트 생성</p>
                <Button asChild variant="outline" className="mt-2">
                  <Link href="/admin/reports">리포트</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
