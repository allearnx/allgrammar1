'use client';

import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Square, CheckSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FormattedText } from '@/components/shared/formatted-text';
import { resolveCorrectIndex } from '@/lib/naesin/normalize-answer';

interface MCQOptionListProps {
  options: string[];
  selectedAnswer: string | number | null;
  correctAnswer: string | number;
  showResult: boolean;
  onSelect: (value: string | number) => void;
  labelStyle?: 'alpha' | 'numeric';
  className?: string;
  /** 복수 정답 모드: 체크박스 토글 + 제출 버튼 */
  multiSelect?: boolean;
  /** multiSelect 모드에서 현재 선택된 값 배열 */
  selectedValues?: string[];
  /** multiSelect 모드에서 개별 토글 */
  onToggle?: (value: string) => void;
  /** multiSelect 모드에서 제출 */
  onSubmit?: () => void;
  /** 자동 제출용: 선택해야 할 정답 개수 (설정 시 해당 개수 클릭하면 자동 제출, 제출 버튼 숨김) */
  expectedCount?: number;
}

export function MCQOptionList({
  options,
  selectedAnswer,
  correctAnswer,
  showResult,
  onSelect,
  labelStyle = 'numeric',
  className,
  multiSelect,
  selectedValues = [],
  onToggle,
  onSubmit,
  expectedCount,
}: MCQOptionListProps) {
  // 정답이 옵션 번호가 아닌 텍스트인 경우 번호로 변환
  const resolved = resolveCorrectIndex(String(correctAnswer), options);
  const correctSet = multiSelect
    ? new Set(String(resolved).split(',').map((s) => s.trim()))
    : null;

  return (
    <div className={cn('grid gap-3', className)}>
      {options.map((option, idx) => {
        const value = labelStyle === 'alpha' ? String(idx) : String(idx + 1);
        const label = labelStyle === 'alpha'
          ? `${String.fromCharCode(65 + idx)}.`
          : `${idx + 1}.`;

        if (multiSelect) {
          const isSelected = selectedValues.includes(value);
          const isCorrectOption = correctSet!.has(value);
          const isWrongSelection = isSelected && !isCorrectOption;

          return (
            <Button
              key={idx}
              variant="outline"
              className={cn(
                'h-auto py-3 px-4 text-left justify-start whitespace-normal',
                !showResult && isSelected && 'border-primary bg-primary/5',
                showResult && isCorrectOption && 'border-green-500 bg-green-50 text-green-700',
                showResult && isWrongSelection && 'border-red-500 bg-red-50 text-red-700',
              )}
              onClick={() => onToggle?.(value)}
              disabled={showResult}
            >
              {showResult ? (
                isCorrectOption ? (
                  <CheckCircle className="h-4 w-4 mr-3 shrink-0 text-green-500" />
                ) : isWrongSelection ? (
                  <XCircle className="h-4 w-4 mr-3 shrink-0 text-red-500" />
                ) : (
                  <Square className="h-4 w-4 mr-3 shrink-0 text-muted-foreground/40" />
                )
              ) : isSelected ? (
                <CheckSquare className="h-4 w-4 mr-3 shrink-0 text-primary" />
              ) : (
                <Square className="h-4 w-4 mr-3 shrink-0 text-muted-foreground/40" />
              )}
              <span className="mr-3 shrink-0 font-medium">{label}</span>
              <FormattedText text={option} />
            </Button>
          );
        }

        // 단일 선택 — resolved를 사용하여 텍스트 정답도 처리
        const isSelected = String(selectedAnswer) === String(value);
        const isCorrectOption = String(value) === String(resolved);

        return (
          <Button
            key={idx}
            variant="outline"
            className={cn(
              'h-auto py-3 px-4 text-left justify-start whitespace-normal',
              showResult && isCorrectOption && 'border-green-500 bg-green-50 text-green-700',
              showResult && isSelected && !isCorrectOption && 'border-red-500 bg-red-50 text-red-700'
            )}
            onClick={() => onSelect(value)}
            disabled={showResult}
          >
            <span className="mr-3 shrink-0 font-medium">{label}</span>
            <FormattedText text={option} />
            {showResult && isCorrectOption && <CheckCircle className="h-4 w-4 ml-auto shrink-0 text-green-500" />}
            {showResult && isSelected && !isCorrectOption && <XCircle className="h-4 w-4 ml-auto shrink-0 text-red-500" />}
          </Button>
        );
      })}

      {multiSelect && !showResult && (
        expectedCount ? (
          <p className="text-center text-sm text-muted-foreground mt-2">
            {selectedValues.length}/{expectedCount}개 선택 {selectedValues.length < expectedCount && `(${expectedCount}개를 선택하면 자동 제출)`}
          </p>
        ) : (
          <Button
            onClick={onSubmit}
            disabled={selectedValues.length === 0}
            className="mt-2"
          >
            제출 ({selectedValues.length}개 선택)
          </Button>
        )
      )}
    </div>
  );
}
