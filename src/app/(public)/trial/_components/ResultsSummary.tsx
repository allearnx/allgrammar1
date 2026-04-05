import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';

interface ResultsSummaryProps {
  totalQuestions: number;
  correctCount: number;
  onReset: () => void;
}

export function ResultsSummary({ totalQuestions, correctCount, onReset }: ResultsSummaryProps) {
  const pct = Math.round((correctCount / totalQuestions) * 100);

  return (
    <div className="space-y-6">
      {/* Score Card */}
      <Card className="p-6 text-center">
        <p className="text-sm text-gray-500 mb-1">채점 결과</p>
        <p className="text-5xl font-bold text-blue-600 mb-1">
          {correctCount}<span className="text-2xl text-gray-400">/{totalQuestions}</span>
        </p>
        <p className="text-gray-500">{pct}점</p>
      </Card>

      {/* Locked 오답 분석 */}
      <div className="relative">
        <Card className="p-6 overflow-hidden">
          <div className="blur-sm select-none pointer-events-none">
            <h3 className="text-lg font-bold mb-3">오답 분석</h3>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-lg bg-gray-100" />
              ))}
            </div>
            <h3 className="text-lg font-bold mt-6 mb-3">유형별 추가 문제</h3>
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 rounded-lg bg-gray-100" />
              ))}
            </div>
          </div>

          {/* Lock Overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[1px]">
            <div className="text-center px-6">
              <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <p className="font-bold text-gray-900 mb-1">
                유료 회원은 오답 분석과 유형별 문제를 제공합니다!
              </p>
              <p className="text-sm text-gray-500 mb-4">
                틀린 문제를 분석하고, 비슷한 유형의 문제로 집중 연습하세요.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Link href="/signup">
                  <Button size="lg">무료 가입하기</Button>
                </Link>
                <Link href="/courses/school_exam">
                  <Button variant="outline" size="lg">올인내신 둘러보기</Button>
                </Link>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="text-center">
        <Button variant="ghost" onClick={onReset}>
          다른 시험 풀기
        </Button>
      </div>
    </div>
  );
}
