export function OrderCardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-primary/5 bg-white shadow-sm dark:bg-background-dark/40">
      <div className="p-4 sm:p-5">
        {/* Header row skeleton */}
        <div className="mb-3 flex items-start justify-between gap-3 sm:mb-4">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <div className="h-10 w-10 rounded-lg bg-slate-200 dark:bg-slate-800" />
            <div className="space-y-2">
              <div className="h-2 w-16 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-800" />
            </div>
          </div>
          <div className="h-3 w-10 rounded bg-slate-200 dark:bg-slate-800" />
        </div>

        {/* Items list skeleton */}
        <div className="mb-3 rounded-lg border border-slate-100 bg-slate-50/50 p-2.5 dark:border-slate-800 dark:bg-slate-900/30 sm:mb-4 sm:rounded-xl sm:p-3">
          <div className="mb-2 h-2 w-24 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="space-y-2">
            <div className="h-3 w-full rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-3 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
          </div>
        </div>

        {/* Address skeleton */}
        <div className="mb-3 flex items-center gap-2.5 sm:mb-4 sm:gap-3">
          <div className="h-4 w-4 rounded-full bg-slate-200 dark:bg-slate-800" />
          <div className="h-3 w-40 rounded bg-slate-200 dark:bg-slate-800" />
        </div>

        {/* Action button skeleton */}
        <div className="h-12 w-full rounded-lg bg-slate-200 dark:bg-slate-800 sm:h-14 sm:rounded-xl" />
      </div>
    </div>
  );
}

export function OrderListSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-1">
      <OrderCardSkeleton />
      <OrderCardSkeleton />
      <OrderCardSkeleton />
    </div>
  );
}
