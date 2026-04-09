"use client";

import { cn } from "@/lib/utils/ui";

interface SkeletonProps {
  className?: string;
  animate?: boolean;
  style?: React.CSSProperties;
}

export function Skeleton({ className, animate = true, style }: SkeletonProps) {
  return (
    <div
      className={cn(
        "bg-[rgba(255,255,255,0.02)] border border-[#2a2d31]",
        animate && "animate-pulse",
        className
      )}
      style={style}
    />
  );
}

// Monitor Row Skeleton
export function MonitorRowSkeleton() {
  return (
    <tr className="border-b border-[#15171a]">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-3 h-3 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-2 w-48" />
          </div>
        </div>
      </td>
      <td className="px-5 py-4">
        <Skeleton className="h-3 w-16" />
      </td>
      <td className="px-5 py-4">
        <Skeleton className="h-3 w-12" />
      </td>
      <td className="px-5 py-4">
        <Skeleton className="h-3 w-20" />
      </td>
      <td className="px-5 py-4">
        <Skeleton className="h-3 w-24" />
      </td>
      <td className="px-5 py-4">
        <Skeleton className="h-8 w-8" />
      </td>
    </tr>
  );
}

// Heartbeat Row Skeleton
export function HeartbeatRowSkeleton() {
  return (
    <tr className="border-b border-[#15171a]">
      <td className="px-5 py-3">
        <Skeleton className="h-3 w-20" />
      </td>
      <td className="px-5 py-3">
        <Skeleton className="h-3 w-12" />
      </td>
      <td className="px-5 py-3">
        <Skeleton className="h-3 w-16" />
      </td>
      <td className="px-5 py-3">
        <Skeleton className="h-3 w-14" />
      </td>
      <td className="px-5 py-3">
        <Skeleton className="h-3 w-32" />
      </td>
    </tr>
  );
}

// Metric Card Skeleton
export function MetricCardSkeleton() {
  return (
    <div className="border border-[#2a2d31] bg-[rgba(255,255,255,0.02)] p-4">
      <Skeleton className="h-3 w-20 mb-2" />
      <Skeleton className="h-8 w-16" />
    </div>
  );
}

// Status Page Card Skeleton
export function StatusPageCardSkeleton() {
  return (
    <div className="border border-[#2a2d31] bg-[rgba(255,255,255,0.02)] p-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="w-3 h-3 rounded-full" />
        </div>
        <Skeleton className="h-3 w-48" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-6 w-12" />
          <Skeleton className="h-6 w-12" />
          <Skeleton className="h-6 w-12" />
        </div>
      </div>
    </div>
  );
}

// Chart Skeleton
export function ChartSkeleton() {
  return (
    <div className="h-64 border border-[#2a2d31] bg-[rgba(255,255,255,0.02)] p-4">
      <div className="flex items-end justify-between h-full gap-1">
        {Array.from({ length: 24 }).map((_, i) => (
          <Skeleton
            key={i}
            className="w-full"
            style={{ height: `${Math.random() * 80 + 20}%` }}
          />
        ))}
      </div>
    </div>
  );
}

// Deep Trace Skeleton
export function DeepTraceSkeleton() {
  return (
    <div className="border border-[#2a2d31] bg-[rgba(255,255,255,0.02)] p-5">
      <div className="flex items-center justify-between gap-6 mb-4">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-20" />
      </div>
      <div className="space-y-3">
        {['DNS_LOOKUP', 'TCP_CONNECT', 'TLS_HANDSHAKE', 'TIME_TO_FIRST_BYTE'].map((label) => (
          <div key={label}>
            <div className="flex items-center justify-between text-[11px] mb-1">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-12" />
            </div>
            <div className="h-6 bg-[#0f1113] border border-[#1f2227] relative overflow-hidden">
              <Skeleton 
                className="absolute left-0 top-0 bottom-0" 
                style={{ width: `${Math.random() * 60 + 20}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}