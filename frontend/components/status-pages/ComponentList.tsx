interface ComponentListProps {
  statusPageId: string;
}

export function ComponentList({ statusPageId }: ComponentListProps) {
  return (
    <div className="text-center py-14">
      <div className="text-[#6f6f6f] text-[11px] tracking-[0.28em] uppercase mb-4">
        COMPONENT_MANAGEMENT
      </div>
      <div className="text-[#5f636a] text-[10px] tracking-[0.20em] mb-6">
        Components group your monitors into logical services (e.g., "API", "Website", "Database")
      </div>
      <div className="text-[#5f636a] text-[10px] tracking-[0.20em] mb-6">
        This feature will be available in the next update.
      </div>
      <div className="inline-block px-4 py-2 bg-[#f2d48a]/10 border border-[#f2d48a]/30 text-[#f2d48a] text-[10px] tracking-wider uppercase">
        COMING_SOON
      </div>
    </div>
  );
}
