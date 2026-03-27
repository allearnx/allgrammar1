import { requireRole } from '@/lib/auth/helpers';
import { createClient } from '@/lib/supabase/server';
import { Topbar } from '@/components/layout/topbar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/shared/stat-card';
import { OnboardingGuide } from '@/components/shared/onboarding-guide';
import { Users, BookOpen, FileText, BookMarked, ClipboardList, BookA } from 'lucide-react';
import Link from 'next/link';
import { JoinAcademyForm } from '@/components/dashboard/join-academy-form';
import { InviteCodeCard } from '@/components/shared/invite-code-card';
import type { LucideIcon } from 'lucide-react';

const NAV_CARDS: { title: string; description: string; href: string; icon: LucideIcon; primary?: boolean }[] = [
  { title: '학생 관리', description: '학생 목록 및 진도 확인', href: '/teacher/students', icon: Users, primary: true },
  { title: '콘텐츠 관리', description: '문법, 암기 항목, 교과서 관리', href: '/teacher/content', icon: BookOpen },
  { title: '내신 관리', description: '내신 대비 교과서/단원 콘텐츠 관리', href: '/teacher/naesin', icon: ClipboardList },
  { title: '리포트', description: '학생 학습 리포트 생성', href: '/teacher/reports', icon: FileText },
];

export default async function ManagerDashboard() {
  const user = await requireRole(['teacher', 'admin', 'boss']);

  if (!user.academy_id) {
    return (
      <>
        <Topbar user={user} title="매니저 대시보드" />
        <JoinAcademyForm />
      </>
    );
  }

  const supabase = await createClient();

  const [studentRes, grammarRes, memoryRes, textbookRes, academyRes] = await Promise.all([
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'student').eq('academy_id', user.academy_id!),
    supabase.from('grammars').select('id', { count: 'exact', head: true }),
    supabase.from('memory_items').select('id', { count: 'exact', head: true }),
    supabase.from('textbook_passages').select('id', { count: 'exact', head: true }),
    supabase.from('academies').select('name, invite_code').eq('id', user.academy_id!).single(),
  ]);

  const studentCount = studentRes.count || 0;

  return (
    <>
      <Topbar user={user} title="매니저 대시보드" />
      <div className="p-4 md:p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">안녕하세요, {user.full_name}님!</h2>
          <p className="text-muted-foreground mt-1">학원 학습 현황을 확인하세요.</p>
        </div>

        {academyRes.data?.invite_code && (
          <InviteCodeCard code={academyRes.data.invite_code} academyName={academyRes.data.name} />
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="총 학생 수" value={studentCount} color="#3B82F6" icon={<Users className="h-5 w-5" />} />
          <StatCard label="문법 주제" value={grammarRes.count || 0} color="#6366F1" icon={<BookOpen className="h-5 w-5" />} />
          <StatCard label="암기 항목" value={memoryRes.count || 0} color="#22C55E" icon={<FileText className="h-5 w-5" />} />
          <StatCard label="교과서 지문" value={textbookRes.count || 0} color="#A855F7" icon={<BookMarked className="h-5 w-5" />} />
        </div>

        {studentCount === 0 && (
          <OnboardingGuide steps={[
            { icon: Users, text: '학생 관리에서 초대 코드를 공유하세요', href: '/teacher/students', linkLabel: '학생 관리' },
            { icon: BookA, text: '학생에게 서비스(올킬보카/올인내신)를 배정하세요' },
            { icon: FileText, text: '학습 진도를 확인하고 리포트를 생성하세요' },
          ]} />
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {NAV_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <Card key={card.href} className={`hover:shadow-md transition-shadow ${card.primary ? 'border-indigo-200 bg-indigo-50/30 dark:border-indigo-800 dark:bg-indigo-950/20' : ''}`}>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className={`rounded-full p-3 ${card.primary ? 'bg-indigo-100 dark:bg-indigo-950' : 'bg-muted'}`}>
                      <Icon className={`h-8 w-8 ${card.primary ? 'text-indigo-600 dark:text-indigo-400' : 'text-muted-foreground'}`} />
                    </div>
                    <h3 className="font-semibold">{card.title}</h3>
                    <p className="text-sm text-muted-foreground">{card.description}</p>
                    <Button asChild variant={card.primary ? 'default' : 'outline'} className="mt-2">
                      <Link href={card.href}>{card.title}</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </>
  );
}
