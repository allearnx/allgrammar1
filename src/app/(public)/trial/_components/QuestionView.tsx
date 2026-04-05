import { Card } from '@/components/ui/card';
import type { Question } from '../_data';

interface QuestionViewProps {
  item: { question: Question; passage?: string };
  index: number;
  userAnswer: string;
  onAnswer: (val: string) => void;
  result?: { correct: boolean; correctAnswer: string };
}

export function QuestionView({ item, index, userAnswer, onAnswer, result }: QuestionViewProps) {
  const { question: q, passage } = item;
  const showPassage = passage && (index === 0 || true); // always show if present

  return (
    <Card className="p-5 sm:p-6">
      {/* Passage - only show once per passage group */}
      {showPassage && (
        <div className="mb-4 rounded-lg bg-gray-50 p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-line border border-gray-100">
          {passage}
        </div>
      )}

      {/* Question */}
      <div className="mb-3">
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-sm font-bold mr-2">
          {q.id}
        </span>
        <span className="font-medium text-gray-900 whitespace-pre-line">{q.question}</span>
      </div>

      {/* MC Options */}
      {q.type === 'mc' && q.options && (() => {
        const isMulti = Array.isArray(q.answer);
        const selectedSet = isMulti
          ? new Set(userAnswer ? userAnswer.split(',') : [])
          : new Set(userAnswer ? [userAnswer] : []);
        const correctSet = result
          ? new Set(result.correctAnswer.split(','))
          : new Set<string>();

        return (
          <div className="space-y-2 ml-9">
            {isMulti && !result && (
              <p className="text-xs text-blue-500 mb-1">복수 정답 — 정답을 모두 선택하세요</p>
            )}
            {q.options.map((opt, i) => {
              const optNum = String(i + 1);
              const isSelected = selectedSet.has(optNum);
              const isCorrect = result && correctSet.has(optNum);
              const isWrong = result && isSelected && !correctSet.has(optNum);

              let cls = 'border-gray-200 bg-white hover:border-blue-300';
              if (result) {
                if (isCorrect) cls = 'border-green-400 bg-green-50';
                else if (isWrong) cls = 'border-red-400 bg-red-50';
                else cls = 'border-gray-100 bg-gray-50 opacity-60';
              } else if (isSelected) {
                cls = 'border-blue-500 bg-blue-50';
              }

              const handleClick = () => {
                if (result) return;
                if (isMulti) {
                  const next = new Set(selectedSet);
                  if (next.has(optNum)) next.delete(optNum);
                  else next.add(optNum);
                  onAnswer([...next].sort().join(','));
                } else {
                  onAnswer(optNum);
                }
              };

              return (
                <button
                  key={i}
                  onClick={handleClick}
                  disabled={!!result}
                  className={`w-full text-left px-4 py-2.5 rounded-lg border text-sm transition-all ${cls}`}
                >
                  {opt}
                  {result && isCorrect && <span className="float-right text-green-600">✓</span>}
                  {result && isWrong && <span className="float-right text-red-500">✗</span>}
                </button>
              );
            })}
          </div>
        );
      })()}

      {/* Subjective Input */}
      {q.type === 'subjective' && (
        <div className="ml-9">
          <textarea
            value={userAnswer}
            onChange={(e) => !result && onAnswer(e.target.value)}
            disabled={!!result}
            placeholder="답을 입력하세요"
            rows={2}
            className={`w-full rounded-lg border px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-300 ${
              result
                ? result.correct
                  ? 'border-green-400 bg-green-50'
                  : 'border-red-400 bg-red-50'
                : 'border-gray-200'
            }`}
          />
          {result && !result.correct && (
            <p className="mt-2 text-sm text-green-700">
              <span className="font-medium">정답:</span> {result.correctAnswer}
            </p>
          )}
          {result && result.correct && (
            <p className="mt-2 text-sm text-green-600 font-medium">정답입니다!</p>
          )}
        </div>
      )}
    </Card>
  );
}
