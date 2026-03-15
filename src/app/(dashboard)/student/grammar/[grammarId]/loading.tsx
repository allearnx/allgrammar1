import { Skeleton } from '@/components/ui/skeleton';

export default function GrammarLoading() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-48" />
      </div>
      <div className="rounded-lg border p-6 space-y-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="aspect-video w-full rounded-lg" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}
