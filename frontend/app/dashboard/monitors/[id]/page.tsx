"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getMonitorMonitorsMonitorIdGet } from "@/lib/api/sdk.gen";
import type { GetMonitorMonitorsMonitorIdGetResponses } from "@/lib/api/types.gen";
import { cn } from "@/lib/utils/ui";
import { Panel } from "@/components/dashboard/Panel";
import { BackgroundLayers } from "@/components/dashboard/BackgroundLayers";
import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/Header";
import { DashboardFooter } from "@/components/dashboard/Footer";
import { HeartbeatChart } from "@/components/dashboard/HeartbeatChart";
import { getDeepTrace, getSSLIssuer, getSSLCommonName } from "@/lib/utils/monitor";

type MonitorDetail = GetMonitorMonitorsMonitorIdGetResponses[200];

type RangeKey = "TODAY" | "WEEK" | "MONTH";

const RANGE_UI: Record<RangeKey, { label: string; hint: string }> = {
  TODAY: { label: "TODAY", hint: "LAST_50_EVENTS" },
  WEEK: { label: "7D", hint: "REQUIRES_EXTENDED_TELEMETRY" },
  MONTH: { label: "30D", hint: "REQUIRES_EXTENDED_TELEMETRY" },
};

function RangeTabs({
  value,
  onChange,
}: {
  value: RangeKey;
  onChange: (v: RangeKey) => void;
}) {
  const keys: RangeKey[] = ["TODAY", "WEEK", "MONTH"];
  return (
    <div className="flex items-center gap-2">
      <div className="text-[#5f636a] text-[10px] tracking-[0.26em] uppercase mr-3">
        TIME_RANGE
      </div>
      <div className="flex border border-[#2a2d31] bg-[rgba(255,255,255,0.02)]">
        {keys.map((k) => {
          const active = value === k;
          return (
            <button
              key={k}
              onClick={() => onChange(k)}
              className={cn(
                "h-8 px-4",
                "text-[10px] tracking-[0.26em] uppercase",
                active
                  ? "bg-[rgba(255,255,255,0.06)] text-[#f2d48a]"
                  : "text-[#6f6f6f] hover:text-[#d6d7da] transition"
              )}
            >
              {RANGE_UI[k].label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

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

function KeyValue({
  k,
  v,
  vClass,
}: {
  k: string;
  v: React.ReactNode;
  vClass?: string;
}) {
  return (
    <div className="text-[11px]">
      <span className="text-[#5f636a] tracking-[0.22em] uppercase">{k}:</span>
      <span className={cn("ml-2 text-[#d6d7da]", vClass)}>{v}</span>
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
            ● KILLER_FEATURE
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

export default function MonitorDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, isLoading, user, logout } = useAuth();

  const [monitor, setMonitor] = useState<MonitorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI-only range selector (NO API changes)
  const [range, setRange] = useState<RangeKey>("TODAY");

  // normalize param id (string | string[])
  const rawId = (params as any)?.id as string | string[] | undefined;
  const monitorId = Array.isArray(rawId) ? rawId[0] : rawId;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/");
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    const fetchMonitorDetails = async () => {
      if (!monitorId) return;

      try {
        setLoading(true);
        setError(null);

        // IMPORTANT: keep API call exactly as your backend accepts
        const response = await getMonitorMonitorsMonitorIdGet({
          path: { monitor_id: monitorId },
          query: { include_heartbeats: 50 },
        });

        if (response.error) {
          if (response.response?.status === 401) {
            logout();
            router.push("/");
            return;
          }
          throw new Error("Failed to fetch monitor details");
        }

        setMonitor(response.data);
      } catch (err) {
        setMonitor(null);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && !isLoading) fetchMonitorDetails();
  }, [monitorId, isAuthenticated, isLoading, logout, router]);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const incidents = useMemo(() => {
    const hbs = (monitor as any)?.recent_heartbeats as any[] | undefined;
    if (!hbs || !Array.isArray(hbs)) return [];
    return hbs
      .filter((hb) => (hb?.status_code ?? 0) >= 400 || hb?.error_message)
      .slice(0, 12);
  }, [monitor]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0b0c0e] flex items-center justify-center">
        <div className="font-mono text-[#6b6f76] tracking-[0.28em] animate-pulse text-[11px] uppercase">
          LOADING_SYSTEM...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-[#b0b3b8] font-mono">
      <BackgroundLayers />

      <div className="flex min-h-screen">
        <DashboardSidebar />

        <div className="flex-1 flex flex-col">
          <DashboardHeader userEmail={user?.email} />

          <div className="flex-1 px-8 py-8 overflow-auto">
            <button
              onClick={() => router.push("/dashboard")}
              className={cn(
                "mb-6 h-10 px-4 flex items-center gap-2",
                "border border-[#2a2d31] bg-[rgba(255,255,255,0.02)]",
                "text-[#a9acb2] hover:text-[#d6d7da] hover:border-[#3a3d42] transition",
                "text-[11px] tracking-[0.26em] uppercase"
              )}
            >
              <span>‹</span>
              <span>BACK_TO_DASHBOARD</span>
            </button>

            <Panel className="p-0">
              <div className="px-6 py-5 border-b border-[#15171a]">
                <div className="flex items-start justify-between gap-8">
                  <div>
                    <div className="text-[#d6d7da] text-[14px] tracking-[0.18em] uppercase">
                      MONITOR_DETAILS
                    </div>
                    {monitor && (
                      <div className="mt-1 text-[#6f6f6f] text-[11px] tracking-[0.10em]">
                        {monitor.friendly_name}
                      </div>
                    )}
                  </div>

                  {/* UI-only range selector */}
                  <RangeTabs value={range} onChange={setRange} />
                </div>
              </div>

              <div className="p-6">
                {loading ? (
                  <div className="py-14 text-center text-[#6f6f6f] text-[11px] tracking-[0.28em] uppercase">
                    LOADING_MONITOR_DATA...
                  </div>
                ) : error ? (
                  <div className="py-14 text-center text-[#ff6a6a] text-[11px] tracking-[0.28em] uppercase">
                    ERROR: {error}
                  </div>
                ) : monitor ? (
                  <div className="space-y-6">
                    <DeepTraceWaterfall monitor={monitor as any} />

                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        label="TOTAL_CHECKS"
                        value={monitor.total_checks ?? 0}
                        tone="white"
                      />
                    </div>

                    {/* Configuration */}
                    <div className="border border-[#2a2d31] bg-[rgba(255,255,255,0.02)] p-5">
                      <div className="text-[#d6d7da] text-[12px] tracking-[0.26em] uppercase mb-4">
                        CONFIGURATION
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <KeyValue k="TYPE" v={monitor.monitor_type} />
                        <KeyValue
                          k="STATUS"
                          v={monitor.status}
                          vClass={monitor.status === "UP" ? "text-[#f2d48a]" : "text-[#ff6a6a]"}
                        />
                        <KeyValue k="INTERVAL" v={`${monitor.interval_seconds}s`} />
                        <KeyValue k="ACTIVE" v={monitor.is_active ? "YES" : "NO"} />
                        <div className="md:col-span-2">
                          <KeyValue k="URL" v={<span className="break-all">{monitor.url}</span>} />
                        </div>
                        <KeyValue k="CREATED" v={formatDate(monitor.created_at)} />
                        <KeyValue k="LAST_CHECK" v={formatDate(monitor.last_checked)} />
                      </div>
                    </div>

                    {/* SSL + Domain */}
                    {(monitor.ssl_status || monitor.domain_status) && (
                      <div className="border border-[#2a2d31] bg-[rgba(255,255,255,0.02)] p-5">
                        <div className="text-[#d6d7da] text-[12px] tracking-[0.26em] uppercase mb-4">
                          SSL_CERTIFICATE_DETAILS
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          {monitor.ssl_status && (
                            <div className="space-y-3">
                              <KeyValue
                                k="CERT_STATUS"
                                v={String(monitor.ssl_status).toUpperCase()}
                                vClass={
                                  monitor.ssl_status === "valid"
                                    ? "text-[#f2d48a]"
                                    : "text-[#ff6a6a]"
                                }
                              />
                              <KeyValue k="ISSUER" v={getSSLIssuer(monitor as any)} />
                              <KeyValue
                                k="COMMON_NAME"
                                v={<span className="break-all">{getSSLCommonName(monitor as any)}</span>}
                              />
                              <KeyValue
                                k="EXPIRY_DATE"
                                v={(monitor as any).ssl_expiry_date ? formatDate((monitor as any).ssl_expiry_date) : "N/A"}
                              />
                              <KeyValue
                                k="DAYS_REMAINING"
                                v={monitor.ssl_days_remaining ?? "N/A"}
                                vClass={
                                  (monitor.ssl_days_remaining ?? 999) < 30
                                    ? "text-[#ffa500] font-bold"
                                    : "text-[#f2d48a] font-bold"
                                }
                              />
                            </div>
                          )}

                          {monitor.domain_status && (
                            <div className="space-y-3">
                              <KeyValue k="DOMAIN_STATUS" v={String(monitor.domain_status).toUpperCase()} />
                              <KeyValue
                                k="DOMAIN_EXPIRY"
                                v={(monitor as any).domain_expiry_date ? formatDate((monitor as any).domain_expiry_date) : "N/A"}
                              />
                              <KeyValue
                                k="DAYS_REMAINING"
                                v={monitor.domain_days_remaining ?? "N/A"}
                                vClass={
                                  (monitor.domain_days_remaining ?? 999) < 30
                                    ? "text-[#ffa500] font-bold"
                                    : "text-[#f2d48a] font-bold"
                                }
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Incident Log */}
                    <div className="border border-[#2a2d31] bg-[rgba(255,255,255,0.02)]">
                      <div className="px-5 py-4 border-b border-[#15171a] flex items-center justify-between">
                        <div className="text-[#d6d7da] text-[12px] tracking-[0.26em] uppercase">
                          INCIDENT_LOG
                        </div>
                        <div className="text-[#5f636a] text-[10px] tracking-[0.26em] uppercase">
                          LAST_EVENTS: {incidents.length}
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
                                DURATION
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
                                  <td className="px-5 py-3 text-[#d6d7da] text-[11px] font-mono">
                                    {incident.latency_ms}ms
                                  </td>
                                  <td className="px-5 py-3 text-[#6f6f6f] text-[11px] max-w-xs truncate">
                                    {incident.error_message || "Request failed"}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td
                                  colSpan={5}
                                  className="px-5 py-10 text-center text-[#6f6f6f] text-[11px] tracking-[0.22em] uppercase"
                                >
                                  NO_INCIDENTS_RECORDED
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Heartbeat Analysis + UI-only Range overlay */}
                    <div className="border border-[#2a2d31] bg-[rgba(255,255,255,0.02)]">
                      <div className="px-5 py-4 border-b border-[#15171a] flex items-center justify-between">
                        <div className="text-[#d6d7da] text-[12px] tracking-[0.26em] uppercase">
                          HEARTBEAT_ANALYSIS [{(monitor as any).recent_heartbeats?.length ?? 0}]
                        </div>
                        <div className="text-[#5f636a] text-[10px] tracking-[0.26em] uppercase">
                          RANGE: {RANGE_UI[range].label} / {RANGE_UI[range].hint}
                        </div>
                      </div>

                      <div className="p-5 relative">
                        {/* Chart (still uses the same 50 events) */}
                        <div className={cn(range !== "TODAY" && "opacity-40 blur-[0.2px]")}>
                          <HeartbeatChart heartbeats={(monitor as any).recent_heartbeats || []} />
                        </div>

                        {/* Overlay for WEEK/MONTH (UI-only, no backend changes) */}
                        {range !== "TODAY" && (
                          <div className="absolute inset-0 flex items-center justify-center p-8">
                            <div className="max-w-[560px] border border-[#2a2d31] bg-[rgba(0,0,0,0.55)] backdrop-blur-sm p-6">
                              <div className="text-[#f2d48a] text-[10px] tracking-[0.28em] uppercase">
                                INSUFFICIENT_TELEMETRY
                              </div>
                              <div className="mt-3 text-[#d6d7da] text-[12px] tracking-[0.18em] uppercase">
                                WEEK/MONTH VIEW IS UI-READY
                              </div>
                              <div className="mt-3 text-[#6f6f6f] text-[11px] leading-relaxed">
                                Your backend currently returns only the last 50 heartbeats. To render a true{" "}
                                <span className="text-[#d6d7da]">7D</span> or{" "}
                                <span className="text-[#d6d7da]">30D</span> timeline, the API must provide older
                                heartbeats (or aggregated metrics). The UI is complete; data expansion is disabled as requested.
                              </div>

                              <div className="mt-5 flex items-center gap-3">
                                <button
                                  onClick={() => setRange("TODAY")}
                                  className="h-9 px-5 bg-[#f2d48a] text-[#0b0c0e] text-[10px] tracking-[0.26em] uppercase font-bold hover:bg-[#d6d7da] transition"
                                >
                                  RETURN_TO_TODAY
                                </button>
                                <div className="text-[#5f636a] text-[10px] tracking-[0.26em] uppercase">
                                  CURRENT: include_heartbeats=50
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </Panel>
          </div>

          <DashboardFooter />
        </div>
      </div>
    </div>
  );
}