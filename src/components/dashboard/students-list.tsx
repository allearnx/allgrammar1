import { createAdminClient } from '@/lib/supabase/admin';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Eye } from 'lucide-react';
import Link from 'next/link';
import type { AuthUser } from '@/types/auth';

interface Props {
  user: AuthUser;
  basePath: '/teacher' | '/admin';
}

export async function StudentsList({ user, basePath }: Props) {
  const admin = createAdminClient();

  const query = admin
    .from('users')
    .select('*')
    .eq('role', 'student')
    .order('full_name');

  if (user.academy_id) {
    query.eq('academy_id', user.academy_id);
  }

  const { data: students } = await query;

  const { count: totalGrammars } = await admin
    .from('grammars')
    .select('id', { count: 'exact', head: true });

  const studentIds = students?.map((s) => s.id) || [];
  const { data: allProgress } = studentIds.length > 0
    ? await admin
        .from('student_progress')
        .select('student_id, video_completed')
        .in('student_id', studentIds)
    : { data: [] };

  const progressByStudent = new Map<string, number>();
  allProgress?.forEach((p) => {
    if (p.video_completed) {
      progressByStudent.set(
        p.student_id,
        (progressByStudent.get(p.student_id) || 0) + 1
      );
    }
  });

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">
          총 {students?.length || 0}명의 학생
        </p>
      </div>

      <div className="space-y-3">
        {(students || []).map((student) => {
          const completed = progressByStudent.get(student.id) || 0;
          const total = totalGrammars || 0;
          const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

          return (
            <Card key={student.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium truncate">{student.full_name}</span>
                      <Badge
                        variant={student.is_active ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {student.is_active ? '활성' : '비활성'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{student.email}</p>
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>학습 진도</span>
                        <span>{completed}/{total} ({percent}%)</span>
                      </div>
                      <Progress value={percent} className="h-1.5" />
                    </div>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`${basePath}/students/${student.id}`}>
                      <Eye className="h-4 w-4 mr-1" />
                      상세
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {(!students || students.length === 0) && (
          <p className="text-center text-muted-foreground py-8">
            등록된 학생이 없습니다.
          </p>
        )}
      </div>
    </div>
  );
}
