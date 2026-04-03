export function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-[#6f6f6f] tracking-[0.26em] uppercase">{label}</span>
    </div>
  );
}

export function FooterDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-2 w-2" style={{ backgroundColor: color }} />
      <span className="text-[#6f6f6f] tracking-[0.26em] uppercase">{label}</span>
    </div>
  );
}
