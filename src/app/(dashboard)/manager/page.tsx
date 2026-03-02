import { requireRole } from '@/lib/auth/helpers';
import { createClient } from '@/lib/supabase/server';
import { Topbar } from '@/components/layout/topbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, BookOpen, FileText, BookMarked } from 'lucide-react';
import Link from 'next/link';

export default async function ManagerDashboard() {
  const user = await requireRole(['manager', 'admin', 'super_admin']);
  const supabase = await createClient();

  // Get students in same academy
  const { count: studentCount } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'student')
    .eq('academy_id', user.academy_id!);

  // Get content stats
  const { count: grammarCount } = await supabase
    .from('grammars')
    .select('id', { count: 'exact', head: true });

  const { count: memoryCount } = await supabase
    .from('memory_items')
    .select('id', { count: 'exact', head: true });

  const { count: textbookCount } = await supabase
    .from('textbook_passages')
    .select('id', { count: 'exact', head: true });

  return (
    <>
      <Topbar user={user} title="매니저 대시보드" />
      <div className="p-4 md:p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold">안녕하세요, {user.full_name}님!</h2>
          <p className="text-muted-foreground mt-1">학원 학습 현황을 확인하세요.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">총 학생 수</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{studentCount || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">문법 주제</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{grammarCount || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">암기 항목</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{memoryCount || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">교과서 지문</CardTitle>
              <BookMarked className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{textbookCount || 0}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center gap-3">
                <Users className="h-10 w-10 text-primary" />
                <h3 className="font-semibold">학생 관리</h3>
                <p className="text-sm text-muted-foreground">학생 목록 및 진도 확인</p>
                <Button asChild className="mt-2">
                  <Link href="/manager/students">학생 목록</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center gap-3">
                <BookOpen className="h-10 w-10 text-primary" />
                <h3 className="font-semibold">콘텐츠 관리</h3>
                <p className="text-sm text-muted-foreground">문법, 암기 항목, 교과서 관리</p>
                <Button asChild variant="outline" className="mt-2">
                  <Link href="/manager/content">콘텐츠 관리</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center gap-3">
                <FileText className="h-10 w-10 text-primary" />
                <h3 className="font-semibold">리포트</h3>
                <p className="text-sm text-muted-foreground">학생 학습 리포트 생성</p>
                <Button asChild variant="outline" className="mt-2">
                  <Link href="/manager/reports">리포트</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
