import type { Metadata } from 'next';
import TrialExam from './_components/TrialExam';

export const metadata: Metadata = {
  title: '기출문제 체험 | 올인내신',
  description: '중학교 영어 기출문제를 무료로 풀어보세요. 객관식 자동채점, 서술형 채점까지.',
};

export default function TrialPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <TrialExam />
    </main>
  );
}
