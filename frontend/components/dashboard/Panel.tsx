import { cn } from "@/lib/utils/ui";

export function Panel({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative border border-[#1b1d20]",
        "bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))]",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.06),transparent_55%)] opacity-[0.35]" />
      <div className="relative">{children}</div>
    </div>
  );
}
