"use client";

export function MaintenanceList({ statusPageId }: { statusPageId: string }) {
  return (
    <div className="text-center py-12">
      <div className="text-[#6f6f6f] text-[11px] tracking-[0.26em] uppercase mb-4">
        MAINTENANCE_SCHEDULING
      </div>
      <div className="text-[#5f636a] text-[10px] tracking-[0.10em] leading-relaxed max-w-md mx-auto">
        Maintenance scheduling will be available in Phase 2. You'll be able to schedule and communicate planned maintenance windows to your users.
      </div>
    </div>
  );
}
