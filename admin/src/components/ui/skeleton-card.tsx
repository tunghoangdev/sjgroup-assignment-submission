'use client';

import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

interface SkeletonCardProps {
  count?: number;
  className?: string;
}

export function SkeletonCard({ count = 3, className }: SkeletonCardProps) {
  return (
    <div className={className}>
      <div className="space-y-3">
        <div className="flex items-center gap-2 pb-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-3 w-[120px]" />
          </div>
        </div>
        <Skeleton className="h-[160px] w-full rounded-md" />
        <div className="flex gap-2">
          {Array.from({ length: count }).map((_, i) => (
            <Skeleton key={i} className="h-8 flex-1 rounded-md" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function AnimatedSkeleton({ className }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0.4 }}
      animate={{ opacity: [0.4, 0.8, 0.4] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
    >
      <Skeleton className={className} />
    </motion.div>
  );
}
