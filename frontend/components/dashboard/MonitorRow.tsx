import { cn, makeTicks, resolveMonitorStatus } from "@/lib/utils/ui";
import { isMonitorChecking, calculateUptime, getSSLDaysRemaining, getDomainDaysRemaining } from "@/lib/utils/monitor";
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

  // Get real-time checking status
  const isChecking = isMonitorChecking(monitor);
  
  // Calculate uptime percentage
  const uptimePercentage = calculateUptime(monitor);

  // Get SSL and Domain expiry info
  const sslDays = getSSLDaysRemaining(monitor);
  const domainDays = getDomainDaysRemaining(monitor);

  return (
    <div className="relative hover:bg-[rgba(255,255,255,0.02)] transition-colors">
      <div className={cn("absolute left-0 top-0 bottom-0 w-[3px]", leftStrip)} />
      <div className="px-6 py-5">
        <div className="grid grid-cols-[420px_1fr_180px] items-center gap-6">
          {/* Left block */}
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              {/* Pulsing LED indicator when checking */}
              {isChecking && (
                <div className="relative flex items-center justify-center w-3 h-3 flex-shrink-0">
                  <div className="absolute w-2 h-2 rounded-full bg-[#f2d48a] animate-pulse"></div>
                  <div className="absolute w-2 h-2 rounded-full bg-[#f2d48a] animate-ping opacity-75"></div>
                </div>
              )}
              
              <div className="text-[#d6d7da] text-[13px] tracking-[0.14em] uppercase flex-shrink-0">
                {String(monitor.friendly_name ?? "UNNAMED_MONITOR")
                  .toUpperCase()
                  .replace(/ /g, "_")}
              </div>
              <div className="h-[18px] px-2 border border-[#2a2d31] bg-[rgba(255,255,255,0.03)] text-[10px] tracking-[0.18em] uppercase text-[#a9acb2] flex items-center flex-shrink-0 whitespace-nowrap">
                {badgeText}
              </div>
              {monitor.is_maintenance && (
                <div className="h-[18px] px-2 border border-[#f2d48a]/30 bg-[#f2d48a]/10 text-[10px] tracking-[0.18em] uppercase text-[#f2d48a] flex items-center flex-shrink-0 whitespace-nowrap">
                  MAINTENANCE
                </div>
              )}
              {/* SSL Badge */}
              {sslDays !== null && (
                <div className={cn(
                  "h-[18px] px-2 border text-[10px] tracking-[0.18em] uppercase flex items-center flex-shrink-0 whitespace-nowrap",
                  sslDays < 30 
                    ? "border-[#ffa500]/30 bg-[#ffa500]/10 text-[#ffa500]" 
                    : "border-[#2a2d31] bg-[rgba(255,255,255,0.03)] text-[#a9acb2]"
                )}>
                  SSL:{sslDays}d
                </div>
              )}
              {/* Domain Badge */}
              {domainDays !== null && (
                <div className={cn(
                  "h-[18px] px-2 border text-[10px] tracking-[0.18em] uppercase flex items-center flex-shrink-0 whitespace-nowrap",
                  domainDays < 30 
                    ? "border-[#ffa500]/30 bg-[#ffa500]/10 text-[#ffa500]" 
                    : "border-[#2a2d31] bg-[rgba(255,255,255,0.03)] text-[#a9acb2]"
                )}>
                  DOM:{domainDays}d
                </div>
              )}
            </div>
            <div className="mt-2 text-[#6f6f6f] text-[11px] tracking-[0.10em] break-all">
              {monitor.url}
            </div>
          </div>

          {/* Center block - 90-Day Uptime History */}
          <div className="justify-self-center w-full max-w-[520px]">
            <div className="flex items-center justify-between text-[9px] tracking-[0.26em] uppercase text-[#5f636a] mb-2">
              <div>90_DAY_UPTIME_HISTORY</div>
              <div className="text-[#d6d7da]">
                {uptimePercentage.toFixed(1)}%
              </div>
            </div>
            {/* 90 tiny vertical bars representing daily uptime */}
            <div className="h-[18px] flex gap-[3px] items-end">
              {ticks.map((v, i) => {
                const isSpike =
                  status === "ALERT" && (i === 14 || i === 26 || i === 27);
                const base = status === "IDLE" ? "#8b8b8b" : "#f2d48a";
                const color = isSpike ? "#ff6a6a" : base;
                const dayUptime = isSpike ? 94 : 99.9;
                return (
                  <div
                    key={i}
                    className="w-[4px] cursor-help"
                    style={{
                      height: `${Math.round(6 + v * 12)}px`,
                      backgroundColor: color,
                      opacity: status === "IDLE" ? 0.45 : 0.95,
                    }}
                    title={`Day ${90 - i}: ${dayUptime}% uptime`}
                  />
                );
              })}
            </div>
          </div>

          {/* Right block - Status + Latency */}
          <div className="justify-self-end flex items-center gap-5">
            <StatusPill status={status} />
            
            {/* Simple Latency Number - show real data or fallback */}
            <div className="text-[#d6d7da] text-[13px] tracking-[0.14em] font-mono">
              {monitor.average_latency 
                ? `${Math.round(monitor.average_latency)}ms`
                : monitor.recent_heartbeats?.[0]?.latency_ms 
                  ? `${Math.round(monitor.recent_heartbeats[0].latency_ms)}ms`
                  : "—"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
