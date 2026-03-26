import { Skeleton } from '@/components/ui/skeleton';

export default function OrdersLoading() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <Skeleton className="h-8 w-32" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-4 flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
