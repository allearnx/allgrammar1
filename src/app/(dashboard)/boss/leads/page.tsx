import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth/helpers';
import { createAdminClient } from '@/lib/supabase/admin';
import { Topbar } from '@/components/layout/topbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target } from 'lucide-react';
import {
  DIAGNOSTIC_GRADES,
  formatLevel,
  type BandKey,
  type FinalLevel,
} from '@/lib/voca/diagnostic-bands';

/**
 * 진단 리드 — 어휘 레벨 진단은 했지만 아직 결제하지 않은 개인 학생 목록.
 * 랜딩 → 가입 → 진단 퍼널에서 이탈한 리드를 모아 리마케팅(전화·문자)에 쓴다.
 * 학원 소속 학생(이미 고객)과 유료 결제·구독 학생은 제외.
 */
export default async function BossLeadsPage() {
  const user = await requireUser();
  if (user.role !== 'boss') redirect('/login');

  const admin = createAdminClient();

  const { data: diagRows } = await admin
    .from('voca_diagnostic_results')
    .select('student_id, grade, final_band, final_qualifier, coverage_score, attempt_number, created_at')
    .order('created_at', { ascending: false });

  // 학생별 최신 진단 1건 + 응시 횟수
  const latestByStudent = new Map<string, NonNullable<typeof diagRows>[number] & { attempts: number }>();
  for (const row of diagRows ?? []) {
    const existing = latestByStudent.get(row.student_id);
    if (existing) existing.attempts += 1;
    else latestByStudent.set(row.student_id, { ...row, attempts: 1 });
  }
  const studentIds = [...latestByStudent.keys()];

  let leads: {
    id: string;
    name: string;
    contact: string;
    gradeLabel: string;
    level: string;
    coverage: number;
    attempts: number;
    diagnosedAt: string;
    joinedAt: string;
  }[] = [];

  if (studentIds.length > 0) {
    const [{ data: students }, { data: assignments }, { data: subs }] = await Promise.all([
      admin
        .from('users')
        .select('id, full_name, email, phone, academy_id, created_at')
        .in('id', studentIds)
        .eq('role', 'student'),
      admin
        .from('service_assignments')
        .select('student_id, source')
        .in('student_id', studentIds),
      admin
        .from('subscriptions')
        .select('student_id, status')
        .in('student_id', studentIds)
        .in('status', ['trialing', 'active', 'past_due']),
    ]);

    // 유료 판별은 plan-context와 동일 기준: source payment/subscription 배정 또는 활성 구독
    const paidIds = new Set([
      ...(assignments ?? [])
        .filter((a) => a.source === 'payment' || a.source === 'subscription')
        .map((a) => a.student_id),
      ...(subs ?? []).map((s) => s.student_id),
    ]);

    leads = (students ?? [])
      .filter((s) => !s.academy_id && !paidIds.has(s.id))
      .map((s) => {
        const diag = latestByStudent.get(s.id)!;
        return {
          id: s.id,
          name: s.full_name ?? '(이름 없음)',
          contact: s.phone || s.email || '-',
          gradeLabel: DIAGNOSTIC_GRADES.find((g) => g.key === diag.grade)?.label ?? diag.grade,
          level: formatLevel({
            band: diag.final_band as BandKey,
            qualifier: diag.final_qualifier as FinalLevel['qualifier'],
          }),
          coverage: diag.coverage_score,
          attempts: diag.attempts,
          diagnosedAt: diag.created_at,
          joinedAt: s.created_at,
        };
      })
      .sort((a, b) => b.diagnosedAt.localeCompare(a.diagnosedAt));
  }

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });

  return (
    <>
      <Topbar user={user} title="진단 리드" />
      <div className="p-4 md:p-6">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-brand-100 p-2 dark:bg-brand-950">
                <Target className="h-5 w-5 text-brand-600 dark:text-brand-400" />
              </div>
              <CardTitle className="text-lg">진단만 하고 미결제 ({leads.length}명)</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              어휘 레벨 진단을 마쳤지만 아직 결제하지 않은 개인 가입 학생이에요. 진단 결과를 근거로 상담을 시작해보세요.
            </p>
          </CardHeader>
          <CardContent>
            {leads.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                아직 리드가 없어요. 랜딩의 무료 진단으로 가입한 학생이 여기에 쌓입니다.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="py-2 pr-4">이름</th>
                      <th className="py-2 pr-4">연락처</th>
                      <th className="py-2 pr-4">학년</th>
                      <th className="py-2 pr-4">진단 레벨</th>
                      <th className="py-2 pr-4">커버리지</th>
                      <th className="py-2 pr-4">응시</th>
                      <th className="py-2 pr-4">진단일</th>
                      <th className="py-2">가입일</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead) => (
                      <tr key={lead.id} className="border-b last:border-0 hover:bg-muted/40">
                        <td className="py-2.5 pr-4 font-medium">
                          <Link href={`/boss/students/${lead.id}`} className="hover:underline">
                            {lead.name}
                          </Link>
                        </td>
                        <td className="py-2.5 pr-4 text-muted-foreground">{lead.contact}</td>
                        <td className="py-2.5 pr-4">{lead.gradeLabel}</td>
                        <td className="py-2.5 pr-4">
                          <Badge variant="outline">{lead.level}</Badge>
                        </td>
                        <td className="py-2.5 pr-4 tabular-nums">{lead.coverage}%</td>
                        <td className="py-2.5 pr-4 tabular-nums">{lead.attempts}회</td>
                        <td className="py-2.5 pr-4 text-muted-foreground">{fmt(lead.diagnosedAt)}</td>
                        <td className="py-2.5 text-muted-foreground">{fmt(lead.joinedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
