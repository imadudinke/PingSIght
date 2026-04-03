import { cn, makeTicks, resolveMonitorStatus } from "@/lib/utils/ui";
import { StatusPill } from "./StatusPill";

export function MonitorRow({ monitor, onClick }: { monitor: any; onClick: () => void }) {
  const status = resolveMonitorStatus(monitor);
  const leftStrip =
    status === "LIVE"
      ? "bg-[#f2d48a]"
      : status === "ALERT"
      ? "bg-[#ff6a6a]"
      : "bg-[#666666]";
  const ticks = makeTicks(monitor.id ?? monitor.url ?? monitor.friendly_name);
  const badgeText =
    monitor.monitor_type === "simple"
      ? monitor.ssl_status === "valid"
        ? "SSL: OK"
        : "HTTP"
      : monitor.monitor_type === "scenario"
      ? "IO_LATENCY"
      : "HEARTBEAT";

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Handle menu action here
  };

  return (
    <div 
      className="relative cursor-cell hover:bg-[rgba(255,255,255,0.02)] transition-colors"
      onClick={onClick}
    >
      <div className={cn("absolute left-0 top-0 bottom-0 w-[3px]", leftStrip)} />
      <div className="px-6 py-5">
        <div className="grid grid-cols-[420px_1fr_180px] items-center gap-6">
          {/* Left block */}
          <div>
            <div className="flex items-center gap-3">
              <div className="text-[#d6d7da] text-[13px] tracking-[0.14em] uppercase">
                {String(monitor.friendly_name ?? "UNNAMED_MONITOR")
                  .toUpperCase()
                  .replace(/ /g, "_")}
              </div>
              <div className="h-[18px] px-2 border border-[#2a2d31] bg-[rgba(255,255,255,0.03)] text-[10px] tracking-[0.18em] uppercase text-[#a9acb2] flex items-center">
                {badgeText}
              </div>
            </div>
            <div className="mt-2 text-[#6f6f6f] text-[11px] tracking-[0.10em]">
              {monitor.url}
            </div>
          </div>

          {/* Center block */}
          <div className="justify-self-center w-full max-w-[520px]">
            <div className="flex items-center justify-between text-[9px] tracking-[0.26em] uppercase text-[#5f636a] mb-2">
              <div>90_DAY_RELIABILITY</div>
              <div className="text-[#d6d7da]">
                {status === "ALERT"
                  ? "94.2%"
                  : status === "LIVE"
                  ? "99.8%"
                  : "100%"}
              </div>
            </div>
            <div className="h-[18px] flex gap-[3px] items-end">
              {ticks.map((v, i) => {
                const isSpike =
                  status === "ALERT" && (i === 14 || i === 26 || i === 27);
                const base = status === "IDLE" ? "#8b8b8b" : "#f2d48a";
                const color = isSpike ? "#ff6a6a" : base;
                return (
                  <div
                    key={i}
                    className="w-[4px]"
                    style={{
                      height: `${Math.round(6 + v * 12)}px`,
                      backgroundColor: color,
                      opacity: status === "IDLE" ? 0.45 : 0.95,
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* Right block */}
          <div className="justify-self-end flex items-center gap-5">
            <StatusPill status={status} />
            <button
              className={cn(
                "h-10 w-10 grid place-items-center",
                "border border-[#2a2d31] bg-[rgba(255,255,255,0.02)]",
                "text-[#a9acb2] hover:text-[#d6d7da] hover:border-[#3a3d42] transition"
              )}
              onClick={handleMenuClick}
              aria-label="Open monitor menu"
            >
              <span className="text-[18px] leading-none">⋮</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
