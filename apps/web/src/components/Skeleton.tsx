import type React from 'react';
import { useMemo } from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rect' | 'circle';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rect',
}) => {
  const variantClasses = {
    text: 'h-4 w-full rounded',
    rect: 'rounded-xl',
    circle: 'rounded-full',
  };

  return (
    <div
      className={`animate-pulse bg-slate-200 dark:bg-slate-800 ${variantClasses[variant]} ${className}`}
      aria-hidden="true"
    />
  );
};

export const CardSkeleton = () => (
  <div className="rounded-2xl border border-primary/5 bg-white p-5 shadow-sm dark:bg-background-dark/40">
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 sm:h-12 sm:w-12" variant="rect" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <Skeleton className="h-3 w-12" />
    </div>
    <div className="space-y-3">
      <Skeleton className="h-20 w-full" variant="rect" />
      <Skeleton className="h-10 w-full" variant="rect" />
    </div>
  </div>
);

export const ListSkeleton = ({ count = 3 }: { count?: number }) => {
  const keys = useMemo(() => {
    return Array.from({ length: count }).map(() =>
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : String(Math.random()),
    );
  }, [count]);

  return (
    <div className="space-y-4">
      {keys.map((key) => (
        <CardSkeleton key={key} />
      ))}
    </div>
  );
};
