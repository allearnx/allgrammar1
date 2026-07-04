'use client';

import { useStudentSelection } from './student-selection-context';

export function StudentCheckbox({ studentId }: { studentId: string }) {
  const { isSelected, toggle } = useStudentSelection();

  return (
    <input
      type="checkbox"
      checked={isSelected(studentId)}
      onChange={() => toggle(studentId)}
      className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500 shrink-0 cursor-pointer"
    />
  );
}
