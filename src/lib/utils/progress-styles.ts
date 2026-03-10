export function scoreChipClass(score: number | null, threshold = 80): string {
  if (score === null) return '';
  return score >= threshold
    ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'
    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
}

export const passageChipClass = 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300';

export function progressBorderClass(completed: number, total: number): string {
  if (completed === total) return 'border-l-4 border-l-green-500';
  if (completed > 0) return 'border-l-4 border-l-amber-400';
  return 'border-l-4 border-l-slate-200 dark:border-l-slate-700';
}
