"use client";

import { Skeleton } from "@/components/ui/Skeleton";

export function UserTableSkeleton() {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
      {/* Header */}
      <div className="border-b border-slate-800 p-4">
        <div className="flex items-center justify-between gap-4">
          <Skeleton variant="text" className="w-48" />
          <div className="flex gap-2">
            <Skeleton variant="rounded" className="w-32 h-10" />
            <Skeleton variant="rounded" className="w-24 h-10" />
          </div>
        </div>
      </div>

      {/* Table Header */}
      <div className="border-b border-slate-800 bg-slate-800/50 px-4 py-3">
        <div className="grid grid-cols-12 gap-4">
          <Skeleton variant="text" className="col-span-3" />
          <Skeleton variant="text" className="col-span-3" />
          <Skeleton variant="text" className="col-span-2" />
          <Skeleton variant="text" className="col-span-2" />
          <Skeleton variant="text" className="col-span-2" />
        </div>
      </div>

      {/* Table Rows */}
      <div className="divide-y divide-slate-800">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="px-4 py-4">
            <div className="grid grid-cols-12 gap-4 items-center">
              <div className="col-span-3 flex items-center gap-3">
                <Skeleton variant="circular" width={40} height={40} />
                <div className="flex-1 space-y-1">
                  <Skeleton variant="text" className="w-24" />
                  <Skeleton variant="text" className="w-32" />
                </div>
              </div>
              <div className="col-span-3">
                <Skeleton variant="text" className="w-full" />
              </div>
              <div className="col-span-2">
                <Skeleton variant="rounded" className="w-16 h-6" />
              </div>
              <div className="col-span-2">
                <Skeleton variant="text" className="w-24" />
              </div>
              <div className="col-span-2 flex gap-2">
                <Skeleton variant="rounded" className="w-8 h-8" />
                <Skeleton variant="rounded" className="w-8 h-8" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="border-t border-slate-800 p-4">
        <div className="flex items-center justify-between">
          <Skeleton variant="text" className="w-32" />
          <div className="flex gap-2">
            <Skeleton variant="rounded" className="w-10 h-10" />
            <Skeleton variant="rounded" className="w-10 h-10" />
            <Skeleton variant="rounded" className="w-10 h-10" />
          </div>
        </div>
      </div>
    </div>
  );
}
