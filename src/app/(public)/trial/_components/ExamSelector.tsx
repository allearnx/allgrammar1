import { Badge } from '@/components/ui/badge';
import { EXAM_SETS } from '../_data';
import type { ExamSet } from '../_data';

export function ExamSelector({ onSelect }: { onSelect: (exam: ExamSet) => void }) {
  const grade2 = EXAM_SETS.filter((e) => e.grade === 2);
  const grade3 = EXAM_SETS.filter((e) => e.grade === 3);

  return (
    <div className="max-w-3xl mx-auto px-4 pt-32 pb-12">
      <div className="text-center mb-10">
        <Badge variant="secondary" className="mb-3 text-sm">무료 체험</Badge>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">기출문제 풀어보기</h1>
        <p className="text-gray-500 text-lg">실제 중학교 영어 기출문제를 풀고 바로 채점해 보세요.</p>
      </div>

      <div className="space-y-8">
        {[{ label: '중학교 2학년', exams: grade2 }, { label: '중학교 3학년', exams: grade3 }].map(
          ({ label, exams }) => (
            <div key={label}>
              <h2 className="text-lg font-semibold text-gray-700 mb-3">{label}</h2>
              <div className="grid gap-3 sm:grid-cols-3">
                {exams.map((exam) => {
                  const total = exam.sections.reduce((s, sec) => s + sec.questions.length, 0);
                  return (
                    <button
                      key={exam.id}
                      onClick={() => onSelect(exam)}
                      className="rounded-xl border border-gray-200 bg-white p-5 text-left shadow-sm hover:border-blue-400 hover:shadow-md transition-all"
                    >
                      <p className="font-semibold text-gray-900">{exam.label}</p>
                      <p className="text-sm text-gray-400 mt-1">{total}문항</p>
                    </button>
                  );
                })}
              </div>
            </div>
          ),
        )}
      </div>

      <p className="text-center text-xs text-gray-400 mt-10">
        서술형은 띄어쓰기나 마침표 차이로 오답 처리될 수 있습니다.
      </p>
    </div>
  );
}
