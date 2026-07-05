import { requireRole } from '@/lib/auth/helpers';
import { requireNaesinAccess } from '@/lib/naesin/require-naesin-access';
import { createClient } from '@/lib/supabase/server';
import { Topbar } from '@/components/layout/topbar';
import { notFound } from 'next/navigation';
import { ExamClient } from './client';

interface Props {
  params: Promise<{ sheetId: string }>;
}

export default async function ExamPage({ params }: Props) {
  const { sheetId } = await params;
  const user = await requireRole(['student']);
  await requireNaesinAccess(user); // 서비스 게이트 (무료는 체험 범위로 통과)
  const supabase = await createClient();

  // Fetch the sheet with textbook info
  const { data: sheet } = await supabase
    .from('naesin_problem_sheets')
    .select('*, textbook:naesin_textbooks(id, display_name)')
    .eq('id', sheetId)
    .single();

  if (!sheet) notFound();

  // Fetch best score + last attempt
  const { data: attempts } = await supabase
    .from('naesin_problem_attempts')
    .select('score, total_questions, wrong_answers, created_at')
    .eq('student_id', user.id)
    .eq('sheet_id', sheetId)
    .order('created_at', { ascending: false });

  const lastAttempt = attempts?.[0] || null;
  const bestScore = attempts?.length
    ? Math.max(...attempts.map((a) => a.score))
    : null;

  const textbookName = (sheet.textbook as { display_name: string } | null)?.display_name || '';

  return (
    <>
      <Topbar user={user} title={textbookName ? `${textbookName} - 시험 대비` : '시험 대비'} />
      <div className="p-4 md:p-6">
        <ExamClient
          sheet={sheet}
          bestScore={bestScore}
          lastAttempt={lastAttempt}
        />
      </div>
    </>
  );
}
