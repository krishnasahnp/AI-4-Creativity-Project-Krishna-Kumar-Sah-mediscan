'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export function Skeleton({
  className = '',
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse',
}: SkeletonProps) {
  const baseClasses = 'bg-[var(--color-bg-tertiary)]';
  
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: '',
    rounded: 'rounded-lg',
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'skeleton-wave',
    none: '',
  };

  const style = {
    width: width,
    height: height,
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
    />
  );
}

// Common skeleton patterns
export function CardSkeleton() {
  return (
    <div className="card p-4 space-y-4">
      <Skeleton height={160} className="rounded-lg" />
      <div className="space-y-2">
        <Skeleton height={20} width="60%" />
        <Skeleton height={16} width="80%" />
        <Skeleton height={16} width="40%" />
      </div>
    </div>
  );
}

export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <tr className="border-b border-[var(--color-border)]">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="p-4">
          <Skeleton height={16} width={`${Math.random() * 40 + 40}%`} />
        </td>
      ))}
    </tr>
  );
}

export function TableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-[var(--color-border)]">
          {Array.from({ length: columns }).map((_, i) => (
            <th key={i} className="p-4 text-left">
              <Skeleton height={14} width={80} />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, i) => (
          <TableRowSkeleton key={i} columns={columns} />
        ))}
      </tbody>
    </table>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-4">
        <Skeleton variant="circular" width={40} height={40} />
        <Skeleton height={12} width={60} />
      </div>
      <Skeleton height={32} width="60%" className="mb-2" />
      <Skeleton height={14} width="40%" />
    </div>
  );
}

export function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-[var(--color-border)]">
      <Skeleton variant="circular" width={48} height={48} />
      <div className="flex-1 space-y-2">
        <Skeleton height={18} width="40%" />
        <Skeleton height={14} width="70%" />
      </div>
      <Skeleton height={24} width={80} variant="rounded" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton height={32} width={200} />
        <Skeleton height={16} width={300} />
      </div>

      {/* Stats grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-4">
          <div className="flex items-center justify-between mb-6">
            <Skeleton height={20} width={150} />
            <div className="flex gap-2">
              <Skeleton height={32} width={60} variant="rounded" />
              <Skeleton height={32} width={60} variant="rounded" />
            </div>
          </div>
          <Skeleton height={300} className="rounded-lg" />
        </div>
        <div className="card p-4">
          <Skeleton height={20} width={120} className="mb-6" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} height={48} className="rounded-lg" />
            ))}
          </div>
        </div>
      </div>

      {/* Recent items skeleton */}
      <div className="card">
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <Skeleton height={20} width={150} />
          <Skeleton height={24} width={80} variant="rounded" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <ListItemSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function ViewerSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
      {/* Main viewer */}
      <div className="lg:col-span-2 card p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Skeleton variant="circular" width={48} height={48} />
            <div className="space-y-1">
              <Skeleton height={18} width={120} />
              <Skeleton height={14} width={180} />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton variant="rounded" width={36} height={36} />
            <Skeleton variant="rounded" width={36} height={36} />
            <Skeleton variant="rounded" width={36} height={36} />
          </div>
        </div>
        <Skeleton height="calc(100% - 100px)" className="rounded-lg" />
        <div className="mt-4">
          <Skeleton height={60} className="rounded-lg" />
        </div>
      </div>

      {/* Side panel */}
      <div className="space-y-4">
        <div className="card p-4">
          <Skeleton height={20} width={100} className="mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-3 bg-[var(--color-bg-tertiary)] rounded-lg">
                <Skeleton height={16} width="60%" className="mb-2" />
                <Skeleton height={14} width="80%" />
              </div>
            ))}
          </div>
        </div>
        <div className="card p-4">
          <Skeleton height={20} width={80} className="mb-4" />
          <Skeleton height={120} className="rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// Loading wrapper with skeleton
interface WithSkeletonProps {
  isLoading: boolean;
  skeleton: ReactNode;
  children: ReactNode;
}

export function WithSkeleton({ isLoading, skeleton, children }: WithSkeletonProps) {
  if (isLoading) {
    return <>{skeleton}</>;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}
