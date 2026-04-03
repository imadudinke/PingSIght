import { cn } from "@/lib/utils/ui";
import type { UIStatus } from "@/lib/utils/ui";

export function StatusPill({ status }: { status: UIStatus }) {
  const color =
    status === "LIVE"
      ? "text-[#f2d48a]"
      : status === "ALERT"
      ? "text-[#ff6a6a]"
      : "text-[#9a9a9a]";

  return (
    <div className="text-right leading-tight">
      <div className="text-[10px] tracking-[0.26em] text-[#5f636a] uppercase">
        Status
      </div>
      <div className={cn("text-[12px] tracking-[0.26em] uppercase", color)}>
        {status}
      </div>
    </div>
  );
}
