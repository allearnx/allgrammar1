import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ resultId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { resultId } = await params;
  const supabase = createAdminClient();

  const { data } = await supabase
    .from('naesin_vocab_quiz_results')
    .select('score, users!student_id(full_name)')
    .eq('id', resultId)
    .single();

  if (!data) return { title: '퀴즈 결과' };

  const studentName = (data.users as unknown as { full_name: string } | null)?.full_name || '학생';
  return {
    title: `${studentName}의 단어 퀴즈 결과 - ${data.score}점`,
  };
}

export default async function QuizResultPage({ params }: Props) {
  const { resultId } = await params;
  const supabase = createAdminClient();

  // Get the result
  const { data: result } = await supabase
    .from('naesin_vocab_quiz_results')
    .select('*, users!student_id(full_name)')
    .eq('id', resultId)
    .single();

  if (!result) notFound();

  // Get all attempts for this student+unit for history
  const { data: history } = await supabase
    .from('naesin_vocab_quiz_results')
    .select('id, attempt_number, score, correct_count, total_questions, created_at')
    .eq('student_id', result.student_id)
    .eq('unit_id', result.unit_id)
    .order('attempt_number', { ascending: true });

  const studentName = (result.users as { full_name: string } | null)?.full_name || '학생';
  const wrongWords = (result.wrong_words || []) as { front_text: string; back_text: string }[];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-lg font-semibold">{studentName}의 단어 퀴즈</h1>
          <p className="text-sm text-muted-foreground">{result.attempt_number}회차</p>
        </div>

        <div className="text-center space-y-2">
          <p className={cn(
            'text-7xl font-bold',
            result.score >= 80 ? 'text-green-600' : result.score >= 50 ? 'text-yellow-600' : 'text-red-600'
          )}>
            {result.score}점
          </p>
          <p className="text-muted-foreground">
            {result.total_questions}문제 중 {result.correct_count}개 정답
          </p>
        </div>

        {wrongWords.length > 0 && (
          <Card>
            <CardContent className="py-4">
              <p className="font-medium text-red-600 mb-3">틀린 단어 ({wrongWords.length}개)</p>
              <div className="space-y-2">
                {wrongWords.map((w, i) => (
                  <div key={i} className="flex justify-between items-center py-1.5 border-b last:border-0">
                    <span className="font-medium">{w.front_text}</span>
                    <span className="text-muted-foreground">{w.back_text}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {history && history.length > 1 && (
          <Card>
            <CardContent className="py-4">
              <p className="font-medium mb-3">회차별 점수</p>
              <div className="space-y-2">
                {history.map((h) => (
                  <div
                    key={h.id}
                    className={cn(
                      'flex justify-between items-center py-1.5 border-b last:border-0',
                      h.id === resultId && 'font-semibold'
                    )}
                  >
                    <span>{h.attempt_number}회차</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">
                        {h.correct_count}/{h.total_questions}
                      </span>
                      <span className={cn(
                        'font-medium',
                        h.score >= 80 ? 'text-green-600' : h.score >= 50 ? 'text-yellow-600' : 'text-red-600'
                      )}>
                        {h.score}점
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <p className="text-center text-xs text-muted-foreground">
          올라영 AI 러닝 엔진
        </p>
      </div>
    </div>
  );
}
