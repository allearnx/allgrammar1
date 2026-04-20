import { Suspense } from 'react';
import { createAdminClient } from '@/lib/supabase/admin';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Eye, Users, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { ServiceAssignmentToggle } from './service-assignment-toggle';
import { StudentsToolbar } from './students-toolbar';
import { StudentDeleteButton } from './student-delete-button';
import { StudentSearchInput } from './student-search-input';
import { AddStudentDialog } from './add-student-dialog';
import { DDayBadge } from '@/components/ui/dday-badge';
import { getPlanContext } from '@/lib/billing/get-plan-context';
import { canUseFeature, isServiceAllowed } from '@/lib/billing/feature-gate';
import { getDDay } from '@/lib/dashboard/naesin-helpers';
import type { AuthUser } from '@/types/auth';

interface Props {
  user: AuthUser;
  basePath: '/teacher' | '/admin' | '/boss';
  searchQuery?: string;
}

export async function StudentsList({ user, basePath, searchQuery }: Props) {
  const admin = createAdminClient();

  // boss는 전체 학생 조회, teacher/admin은 자기 학원만
  if (!user.academy_id && user.role !== 'boss') {
    return (
      <div className="flex flex-col items-center py-12">
        <Users className="h-10 w-10 text-muted-foreground/30 mb-2" />
        <p className="text-center text-muted-foreground">
          소속 학원이 없습니다.
        </p>
      </div>
    );
  }

  const isBoss = basePath === '/boss';

  const query = admin
    .from('users')
    .select('*')
    .eq('role', 'student')
    .order('full_name');

  if (user.academy_id) {
    query.eq('academy_id', user.academy_id);
  }

  if (searchQuery) {
    query.ilike('full_name', `%${searchQuery}%`);
  }

  const { data: students } = await query;

  // boss: 학원명 매핑
  const academyNameMap: Record<string, string> = {};
  if (isBoss && students && students.length > 0) {
    const academyIds = [...new Set(students.map((s) => s.academy_id).filter(Boolean))] as string[];
    if (academyIds.length > 0) {
      const { data: academies } = await admin.from('academies').select('id, name').in('id', academyIds);
      if (academies) for (const a of academies) academyNameMap[a.id] = a.name;
    }
  }

  const { count: totalGrammars } = await admin
    .from('grammars')
    .select('id', { count: 'exact', head: true });

  const studentIds = students?.map((s) => s.id) || [];
  const [progressRes, naesinProgressRes, examDatesRes, examAssignmentsRes] = await Promise.all([
    studentIds.length > 0
      ? admin
          .from('student_progress')
          .select('student_id, video_completed')
          .in('student_id', studentIds)
      : Promise.resolve({ data: [] }),
    studentIds.length > 0
      ? admin
          .from('naesin_student_progress')
          .select('student_id, vocab_completed, passage_completed, dialogue_completed, grammar_completed, problem_completed, round2_passage_completed, round2_dialogue_completed')
          .in('student_id', studentIds)
      : Promise.resolve({ data: [] }),
    studentIds.length > 0
      ? admin
          .from('naesin_exam_dates')
          .select('student_id, exam_date')
          .in('student_id', studentIds)
      : Promise.resolve({ data: [] }),
    studentIds.length > 0
      ? admin
          .from('naesin_exam_assignments')
          .select('student_id, exam_date')
          .in('student_id', studentIds)
          .not('exam_date', 'is', null)
      : Promise.resolve({ data: [] }),
  ]);

  // Build nearest D-day map per student
  const nearestDDayMap = new Map<string, number>();
  for (const row of [...(examDatesRes.data || []), ...(examAssignmentsRes.data || [])]) {
    const d = getDDay(row.exam_date);
    if (d === null || d < 0) continue;
    const prev = nearestDDayMap.get(row.student_id);
    if (prev === undefined || d < prev) nearestDDayMap.set(row.student_id, d);
  }

  // Fetch academy naesinRequiredRounds
  let naesinRequiredRounds = 1;
  if (user.academy_id) {
    const { data: academy } = await admin.from('academies').select('naesin_required_rounds').eq('id', user.academy_id).single();
    naesinRequiredRounds = academy?.naesin_required_rounds ?? 1;
  }
  const hasRound2 = naesinRequiredRounds >= 2;

  const allProgress = progressRes.data || [];
  const allNaesinProgress = naesinProgressRes.data || [];

  const progressByStudent = new Map<string, number>();
  allProgress?.forEach((p) => {
    if (p.video_completed) {
      progressByStudent.set(
        p.student_id,
        (progressByStudent.get(p.student_id) || 0) + 1
      );
    }
  });

  // Naesin: count completed stages per student
  const stagesPerUnit = hasRound2 ? 7 : 5;
  const naesinByStudent = new Map<string, { stages: number; units: number }>();
  allNaesinProgress?.forEach((p) => {
    const prev = naesinByStudent.get(p.student_id) || { stages: 0, units: 0 };
    let stageCount = (p.vocab_completed ? 1 : 0) + (p.passage_completed ? 1 : 0) + (p.dialogue_completed ? 1 : 0) + (p.grammar_completed ? 1 : 0) + (p.problem_completed ? 1 : 0);
    if (hasRound2) {
      stageCount += (p.round2_passage_completed ? 1 : 0) + (p.round2_dialogue_completed ? 1 : 0);
    }
    prev.stages += stageCount;
    if (stageCount === stagesPerUnit) prev.units += 1;
    naesinByStudent.set(p.student_id, prev);
  });

  // Fetch service assignments for boss/admin
  const canManageServices = basePath === '/boss' || basePath === '/admin';
  const serviceMap: Record<string, string[]> = {};
  const round2Map: Record<string, boolean> = {};

  let vocaBooks: { id: string; title: string }[] = [];
  const bookAssignmentMap: Record<string, string> = {};

  if (canManageServices && studentIds.length > 0) {
    const [{ data: assignments }, { data: vocaBooksData }, { data: bookAssignments }] = await Promise.all([
      admin
        .from('service_assignments')
        .select('student_id, service, round2_unlocked')
        .in('student_id', studentIds),
      admin
        .from('voca_books')
        .select('id, title')
        .eq('is_active', true)
        .order('sort_order'),
      admin
        .from('voca_book_assignments')
        .select('student_id, book_id')
        .in('student_id', studentIds),
    ]);

    if (assignments) {
      for (const a of assignments) {
        if (!serviceMap[a.student_id]) serviceMap[a.student_id] = [];
        serviceMap[a.student_id].push(a.service);
        if (a.service === 'voca' && a.round2_unlocked) {
          round2Map[a.student_id] = true;
        }
      }
    }

    vocaBooks = vocaBooksData || [];

    for (const a of bookAssignments || []) {
      bookAssignmentMap[a.student_id] = a.book_id;
    }
  }

  const planContext = await getPlanContext(user.academy_id);
  const bulkAllowed = canUseFeature(planContext.tier, 'bulk:import');
  const allowedServices = (['naesin', 'voca'] as const).filter(
    (s) => isServiceAllowed(planContext.tier, planContext.freeService, s),
  );

  return (
    <div className="p-4 md:p-6 space-y-4">
      {canManageServices && (
        <StudentsToolbar
          studentIds={studentIds}
          studentCount={students?.length || 0}
          bulkAllowed={bulkAllowed}
        />
      )}
      {!canManageServices && (
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">
            총 {students?.length || 0}명의 학생
          </p>
        </div>
      )}

      <Suspense>
        <StudentSearchInput />
      </Suspense>

      <div className="space-y-3">
        {(students || []).map((student) => {
          const completed = progressByStudent.get(student.id) || 0;
          const total = totalGrammars || 0;
          const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
          const naesin = naesinByStudent.get(student.id);

          const progressColor =
            percent >= 80
              ? '[&>[data-slot=progress-indicator]]:bg-green-500'
              : percent >= 40
                ? '[&>[data-slot=progress-indicator]]:bg-indigo-500'
                : '[&>[data-slot=progress-indicator]]:bg-slate-400';

          return (
            <Card key={student.id}>
              <CardContent className="py-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium truncate">{student.full_name}</span>
                      <Badge
                        variant={student.is_active ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {student.is_active ? '활성' : '비활성'}
                      </Badge>
                      {nearestDDayMap.has(student.id) && (
                        <DDayBadge dday={nearestDDayMap.get(student.id)!} className="text-xs" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{student.email}</p>
                    {isBoss && (
                      <p className="text-xs text-muted-foreground">
                        {student.academy_id ? academyNameMap[student.academy_id] || '미소속' : '미소속'}
                      </p>
                    )}
                    {naesin && naesin.stages > 0 && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>내신: {naesin.stages}단계 완료</span>
                        {naesin.units > 0 && (
                          <Badge variant="secondary" className="text-xs">{naesin.units}단원 완료</Badge>
                        )}
                      </div>
                    )}
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>문법 학습</span>
                        <span>{completed}/{total} ({percent}%)</span>
                      </div>
                      <Progress value={percent} className={`h-2.5 ${progressColor}`} />
                    </div>
                    {canManageServices && (
                      <div className="mt-3">
                        <p className="text-xs text-muted-foreground mb-1.5">서비스 배정</p>
                        <ServiceAssignmentToggle
                          studentId={student.id}
                          assignedServices={serviceMap[student.id] || []}
                          allowedServices={allowedServices}
                          vocaBooks={vocaBooks}
                          assignedBookId={bookAssignmentMap[student.id] || null}
                          round2Unlocked={round2Map[student.id] || false}
                          showRound2Toggle={basePath === '/boss'}
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`${basePath}/students/${student.id}`}>
                        <Eye className="h-4 w-4 mr-1" />
                        상세
                      </Link>
                    </Button>
                    {basePath === '/boss' && (
                      <StudentDeleteButton
                        studentId={student.id}
                        studentName={student.full_name}
                        studentEmail={student.email}
                      />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {(!students || students.length === 0) && (
          <div
            className="flex flex-col items-center py-12 px-4 rounded-2xl"
            style={{ background: 'linear-gradient(120deg, #F5F3FF, #EDE9FE)' }}
          >
            <div className="rounded-full bg-white/60 p-4 mb-3">
              <Users className="h-8 w-8 text-violet-500" />
            </div>
            <p className="text-center text-gray-700 font-semibold mb-1">
              아직 등록된 학생이 없습니다
            </p>
            <p className="text-center text-sm text-muted-foreground mb-5">
              학생을 한 명 추가해서 바로 시작해보세요
            </p>
            {canManageServices && <AddStudentDialog variant="cta" label="첫 학생 추가하기" />}
          </div>
        )}
      </div>
    </div>
  );
}
