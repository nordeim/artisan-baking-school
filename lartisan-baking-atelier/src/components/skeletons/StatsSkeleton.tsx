"use client";

import { Skeleton } from "@/components/ui/Skeleton";

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-slate-800 bg-slate-900/50 p-6"
        >
          <div className="flex items-center gap-4">
            <Skeleton variant="circular" width={48} height={48} />
            <div className="flex-1 space-y-2">
              <Skeleton variant="text" className="w-24" />
              <Skeleton variant="text" className="w-16 h-8" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
