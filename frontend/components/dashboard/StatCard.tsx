import { cn, iconGlyph } from "@/lib/utils/ui";
import { Panel } from "./Panel";

export function StatCard({
  title,
  value,
  foot,
  icon,
  valueClass,
  incidentDots,
}: {
  title: string;
  value: string;
  foot: string;
  icon: "gauge" | "alert" | "timer";
  valueClass: string;
  incidentDots?: number;
}) {
  return (
    <Panel className="px-6 py-5">
      <div className="absolute right-5 top-5 h-12 w-12 rounded-full bg-[rgba(255,255,255,0.03)] border border-[#2a2d31] grid place-items-center text-[#6f6f6f]">
        <span className="text-[14px]">{iconGlyph(icon)}</span>
      </div>
      <div className="text-[#5f636a] text-[10px] tracking-[0.28em] mb-3 uppercase">
        {title}
      </div>
      <div
        className={cn(
          "text-[44px] leading-none font-semibold tracking-tight",
          valueClass
        )}
      >
        {value}
      </div>
      {foot ? (
        <div className="mt-3 text-[#5f636a] text-[10px] tracking-[0.26em] uppercase">
          {foot}
        </div>
      ) : (
        <div className="mt-3 h-[14px]" />
      )}
      {typeof incidentDots === "number" && incidentDots > 0 ? (
        <div className="mt-3 flex gap-2">
          <span className="h-[6px] w-[6px] bg-[#ff6a6a]" />
          <span className="h-[6px] w-[6px] bg-[#ff6a6a]" />
        </div>
      ) : null}
    </Panel>
  );
}
