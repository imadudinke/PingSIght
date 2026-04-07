"use client";

export function IncidentList({ statusPageId }: { statusPageId: string }) {
  return (
    <div className="text-center py-12">
      <div className="text-[#6f6f6f] text-[11px] tracking-[0.26em] uppercase mb-4">
        INCIDENT_MANAGEMENT
      </div>
      <div className="text-[#5f636a] text-[10px] tracking-[0.10em] leading-relaxed max-w-md mx-auto">
        Incident management will be available in Phase 2. You'll be able to create, update, and track incidents for your status page.
      </div>
    </div>
  );
}
