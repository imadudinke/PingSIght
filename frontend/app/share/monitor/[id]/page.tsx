"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils/ui";
import { HeartbeatChart } from "@/components/dashboard/HeartbeatChart";
import { getDeepTrace, calculateP95Latency, calculateP99Latency } from "@/lib/utils/monitor";

type PublicMonitor = {
  id: string;
  friendly_name: string;
  monitor_type: string;
  status: string;
  uptime_percentage: number;
  average_latency: number;
  total_checks: number;
  interval_seconds: number;
  last_checked: string;
  created_at: string;
  recent_heartbeats: any[];
  last_ping_received?: string;
};

function MetricCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  tone: "sand" | "white" | "red";
}) {
  const valueClass =
    tone === "sand"
      ? "text-[#f2d48a]"
      : tone === "red"
        ? "text-[#ff6a6a]"
        : "text-[#d6d7da]";

  return (
    <div className="border border-[#2a2d31] bg-[rgba(255,255,255,0.02)] p-4">
      <div className="text-[#5f636a] text-[10px] tracking-[0.26em] uppercase mb-2">
        {label}
      </div>
      <div className={cn("text-[28px] font-semibold leading-none", valueClass)}>
        {value}
      </div>
    </div>
  );
}

function DeepTraceWaterfall({ monitor }: { monitor: any }) {
  const trace = getDeepTrace(monitor);
  const maxTime = Math.max(1, trace.total || 1);

  const rows: Array<{
    key: string;
    ms: number;
    accent: string;
    border: string;
    text: string;
    strong?: boolean;
  }> = [
    {
      key: "DNS_LOOKUP",
      ms: trace.dns,
      accent: "from-[#b9c7ff]/80 to-[#b9c7ff]/55",
      border: "border-[#1f2227]",
      text: "text-[#d6d7da]",
    },
    {
      key: "TCP_CONNECT",
      ms: trace.tcp,
      accent: "from-[#7c4aff]/70 to-[#7c4aff]/45",
      border: "border-[#1f2227]",
      text: "text-[#d6d7da]",
    },
    {
      key: "TLS_HANDSHAKE",
      ms: trace.tls,
      accent: "from-[#ff6a6a]/70 to-[#ff6a6a]/45",
      border: "border-[#1f2227]",
      text: "text-[#d6d7da]",
    },
    {
      key: "TIME_TO_FIRST_BYTE",
      ms: trace.ttfb,
      accent: "from-[#f2d48a]/85 to-[#f2d48a]/60",
      border: "border-[#f2d48a]/50",
      text: "text-[#f2d48a]",
      strong: true,
    },
  ];

  return (
    <div className="border border-[#2a2d31] bg-[rgba(255,255,255,0.02)] p-5">
      <div className="flex items-center justify-between gap-6 mb-4">
        <div className="text-[#d6d7da] text-[12px] tracking-[0.26em] uppercase flex items-center gap-3">
          <span>DEEP_TRACE_WATERFALL</span>
          <span className="text-[#f2d48a] text-[10px] tracking-[0.26em] uppercase">
            ● LIVE_METRICS
          </span>
        </div>
        <div className="text-[#5f636a] text-[10px] tracking-[0.26em] uppercase">
          TOTAL:{" "}
          <span className="text-[#d6d7da] tracking-[0.20em]">
            {trace.total}ms
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.key}>
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span
                className={cn(
                  "tracking-[0.22em] uppercase",
                  r.strong ? "font-bold" : "font-normal",
                  r.text
                )}
              >
                {r.key}
              </span>
              <span
                className={cn(
                  "font-mono",
                  r.strong ? "font-bold" : "font-normal",
                  r.text
                )}
              >
                {r.ms}ms
              </span>
            </div>

            <div className={cn("h-6 bg-[#0f1113] border relative overflow-hidden", r.border)}>
              <div
                className={cn("absolute left-0 top-0 bottom-0 bg-gradient-to-r", r.accent)}
                style={{ width: `${(r.ms / maxTime) * 100}%` }}
              />
              <div
                className={cn(
                  "absolute inset-0 flex items-center px-2 text-[10px] font-mono",
                  r.strong ? "text-[#0b0c0e] font-bold" : "text-[#d6d7da]"
                )}
              >
                {r.ms}ms
              </div>
            </div>
          </div>
        ))}

        <div className="pt-2 border-t border-[#1f2227]">
          <div className="flex items-center justify-between text-[12px]">
            <span className="text-[#d6d7da] tracking-[0.22em] uppercase font-bold">
              TOTAL_LATENCY
            </span>
            <span className="text-[#d6d7da] font-mono font-bold">
              {trace.total}ms
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PublicMonitorPage() {
  const params = useParams();
  const [monitor, setMonitor] = useState<PublicMonitor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const rawId = (params as any)?.id as string | string[] | undefined;
  const monitorId = Array.isArray(rawId) ? rawId[0] : rawId;

  const fetchMonitorData = async () => {
    if (!monitorId) return;

    try {
      setLoading(true);
      setError(null);

      // This would be a public API endpoint that doesn't require authentication
      const response = await fetch(`http://localhost:8000/api/monitors/public/${monitorId}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Monitor not found or not publicly shared");
        }
        throw new Error("Failed to fetch monitor data");
      }

      const data = await response.json();
      setMonitor(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitorData();
  }, [monitorId]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!monitor) return;

    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchMonitorData();
      }
    }, 30000);

    return () => clearInterval(intervalId);
  }, [monitor]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const incidents = (monitor?.recent_heartbeats || [])
    .filter((hb: any) => hb.status_code >= 400 || hb.error_message)
    .slice(0, 10);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0c0e] flex items-center justify-center">
        <div className="font-mono text-[#6b6f76] tracking-[0.28em] animate-pulse text-[11px] uppercase">
          LOADING_MONITOR_DATA...
        </div>
      </div>
    );
  }

  if (error || !monitor) {
    return (
      <div className="min-h-screen bg-[#0b0c0e] flex items-center justify-center px-6">
        <div className="max-w-md w-full border border-[#2a2d31] bg-[rgba(255,255,255,0.02)] p-6">
          <div className="h-[3px] bg-[#ff6a6a] mb-6" />
          <div className="text-[#ff6a6a] tracking-[0.28em] text-[11px] uppercase mb-2">
            MONITOR_NOT_ACCESSIBLE
          </div>
          <div className="text-[#6f6f6f] text-[11px] leading-relaxed">
            {error || "The requested monitor is not available for public viewing"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0c0e] text-[#b0b3b8] font-mono">
      {/* Background pattern */}
      <div className="fixed inset-0 opacity-[0.015] pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
          backgroundSize: '24px 24px'
        }} />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="border border-[#2a2d31] bg-[rgba(255,255,255,0.02)] p-6 mb-8">
          <div className="h-[3px] bg-[#f2d48a] mb-6" />
          
          <div className="flex items-start justify-between gap-8">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="text-[#d6d7da] text-[18px] tracking-[0.18em] uppercase">
                  {monitor.friendly_name}
                </div>
                <div className={cn(
                  "h-3 w-3 rounded-full animate-pulse",
                  monitor.status === "UP" ? "bg-[#f2d48a]" : "bg-[#ff6a6a]"
                )} />
              </div>
              
              <div className="space-y-2 text-[11px]">
                <div>
                  <span className="text-[#5f636a] tracking-[0.22em] uppercase">TYPE:</span>
                  <span className="ml-2 text-[#d6d7da]">{monitor.monitor_type}</span>
                </div>
                <div>
                  <span className="text-[#5f636a] tracking-[0.22em] uppercase">INTERVAL:</span>
                  <span className="ml-2 text-[#d6d7da]">{monitor.interval_seconds}s</span>
                </div>
                <div>
                  <span className="text-[#5f636a] tracking-[0.22em] uppercase">LAST_CHECK:</span>
                  <span className="ml-2 text-[#d6d7da]">{formatDate(monitor.last_checked)}</span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[#5f636a] text-[10px] tracking-[0.28em] uppercase mb-2">
                CURRENT_STATUS
              </div>
              <div className={cn(
                "text-[14px] tracking-[0.22em] uppercase font-bold",
                monitor.status === "UP" ? "text-[#f2d48a]" : "text-[#ff6a6a]"
              )}>
                {monitor.status}
              </div>
              {lastUpdated && (
                <div className="text-[#5f636a] text-[10px] tracking-[0.22em] uppercase mt-2">
                  UPDATED: {lastUpdated.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Deep Trace - Only for non-heartbeat monitors */}
          {monitor.monitor_type !== "heartbeat" && (
            <DeepTraceWaterfall monitor={monitor} />
          )}

          {/* Stats */}
          {monitor.monitor_type === "heartbeat" ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <MetricCard
                label="UPTIME"
                value={`${monitor.uptime_percentage?.toFixed(2) ?? "0.00"}%`}
                tone="sand"
              />
              <MetricCard
                label="TOTAL_PINGS"
                value={monitor.total_checks ?? 0}
                tone="white"
              />
              <MetricCard
                label="EXPECTED_EVERY"
                value={`${monitor.interval_seconds}s`}
                tone="white"
              />
              <MetricCard
                label="LAST_PING"
                value={monitor.last_ping_received 
                  ? new Date(monitor.last_ping_received).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : "Never"
                }
                tone={monitor.last_ping_received ? "white" : "red"}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <MetricCard
                label="UPTIME"
                value={`${monitor.uptime_percentage?.toFixed(2) ?? "0.00"}%`}
                tone="sand"
              />
              <MetricCard
                label="AVG_LATENCY"
                value={`${monitor.average_latency ?? 0}ms`}
                tone="white"
              />
              <MetricCard
                label="P95_LATENCY"
                value={`${calculateP95Latency(monitor.recent_heartbeats || [])}ms`}
                tone="white"
              />
              <MetricCard
                label="P99_LATENCY"
                value={`${calculateP99Latency(monitor.recent_heartbeats || [])}ms`}
                tone="white"
              />
              <MetricCard
                label="TOTAL_CHECKS"
                value={monitor.total_checks ?? 0}
                tone="white"
              />
            </div>
          )}

          {/* Heartbeat Timeline */}
          <div className="border border-[#2a2d31] bg-[rgba(255,255,255,0.02)]">
            <div className="px-5 py-4 border-b border-[#15171a]">
              <div className="text-[#d6d7da] text-[12px] tracking-[0.26em] uppercase">
                24H_HEARTBEAT_TIMELINE [{monitor.recent_heartbeats?.length ?? 0}]
              </div>
            </div>
            <div className="p-5">
              <HeartbeatChart 
                heartbeats={monitor.recent_heartbeats || []} 
                monitorType={monitor.monitor_type}
              />
            </div>
          </div>

          {/* Recent Incidents */}
          <div className="border border-[#2a2d31] bg-[rgba(255,255,255,0.02)]">
            <div className="px-5 py-4 border-b border-[#15171a]">
              <div className="text-[#d6d7da] text-[12px] tracking-[0.26em] uppercase">
                RECENT_INCIDENTS
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#15171a]">
                    <th className="px-5 py-3 text-left text-[#5f636a] text-[10px] tracking-[0.26em] uppercase font-normal">
                      TIMESTAMP
                    </th>
                    <th className="px-5 py-3 text-left text-[#5f636a] text-[10px] tracking-[0.26em] uppercase font-normal">
                      STATUS
                    </th>
                    <th className="px-5 py-3 text-left text-[#5f636a] text-[10px] tracking-[0.26em] uppercase font-normal">
                      ERROR_CODE
                    </th>
                    <th className="px-5 py-3 text-left text-[#5f636a] text-[10px] tracking-[0.26em] uppercase font-normal">
                      MESSAGE
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {incidents.length > 0 ? (
                    incidents.map((incident: any, idx: number) => (
                      <tr
                        key={incident.id || idx}
                        className="border-b border-[#15171a] hover:bg-[rgba(255,255,255,0.02)]"
                      >
                        <td className="px-5 py-3 text-[#d6d7da] text-[11px] font-mono">
                          {new Date(incident.created_at).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-[#ff6a6a] text-[11px] tracking-[0.18em] uppercase">
                            DOWN
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={cn(
                              "text-[11px] font-mono",
                              (incident.status_code ?? 0) >= 500
                                ? "text-[#ff6a6a]"
                                : "text-[#ffa500]"
                            )}
                          >
                            {incident.status_code || "TIMEOUT"}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-[#6f6f6f] text-[11px] max-w-xs truncate">
                          {incident.error_message || "Request failed"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-5 py-10 text-center text-[#6f6f6f] text-[11px] tracking-[0.22em] uppercase"
                      >
                        NO_RECENT_INCIDENTS
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-[#5f636a] text-[10px] tracking-[0.26em] uppercase pt-8 border-t border-[#1f2227]">
          <div className="mb-2">PUBLIC_MONITOR_VIEW</div>
          <div>POWERED_BY_PINGSIGHT</div>
        </div>
      </div>
    </div>
  );
}