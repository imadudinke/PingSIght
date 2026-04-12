"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils/ui";
import { BackgroundLayers } from "@/components/dashboard/BackgroundLayers";
import { Panel } from "@/components/dashboard/Panel";
import { HeartbeatChart } from "@/components/dashboard/HeartbeatChart";
import {
  getDeepTrace,
  calculateP95Latency,
  calculateP99Latency,
} from "@/lib/utils/monitor";
import { getApiBaseUrl } from "@/lib/constants";

function PasswordPrompt({
  onSubmit,
  loading,
  error,
}: {
  onSubmit: (password: string) => void;
  loading: boolean;
  error: string | null;
}) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(password);
  };

  return (
    <div className="min-h-screen bg-[#0b0c0e] text-[#b0b3b8] font-mono">
      <BackgroundLayers />
      <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-10">
        <Panel className="w-full max-w-[520px] p-0 overflow-hidden">
          <div className="h-[3px] bg-[#f2d48a]" />
          <div className="p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="h-14 w-14 sm:h-16 sm:w-16 mx-auto mb-4 border border-[#f2d48a]/30 bg-[#f2d48a]/10 grid place-items-center text-[#f2d48a] text-[22px] sm:text-[24px]">
                🔒
              </div>
              <div className="text-[#f2d48a] text-[11px] sm:text-[12px] tracking-[0.26em] uppercase mb-2">
                PASSWORD_REQUIRED
              </div>
              <div className="text-[#6f6f6f] text-[10px] sm:text-[11px] leading-relaxed">
                THIS_SHARED_MONITOR_IS_PASSWORD_PROTECTED. ENTER_THE_PASSWORD_TO_CONTINUE.
              </div>
            </div>

            {error && (
              <div className="bg-[#ff6a6a]/10 border border-[#ff6a6a]/30 px-4 py-3 mb-4">
                <div className="text-[#ff6a6a] text-[10px] sm:text-[11px] font-mono">
                  {error}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[#6b6f76] text-[10px] tracking-[0.26em] uppercase mb-2 font-mono">
                  PASSWORD
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="ENTER_PASSWORD"
                    className={cn(
                      "w-full h-[42px] px-4 pr-12",
                      "bg-[#0b0c0e] border border-[#1f2227]",
                      "text-[#d6d7da] text-[11px] font-mono tracking-[0.12em]",
                      "placeholder-[#6b6f76]",
                      "focus:border-[#f2d48a] focus:outline-none"
                    )}
                    disabled={loading}
                    autoFocus
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b6f76] hover:text-[#d6d7da] transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !password.trim()}
                className={cn(
                  "w-full h-[44px]",
                  "bg-[#f2d48a] text-[#0b0c0e]",
                  "font-mono text-[11px] sm:text-xs font-bold tracking-[0.26em] uppercase",
                  "hover:bg-[#d6d7da] transition-all",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {loading ? "VERIFYING..." : "ACCESS_MONITOR"}
              </button>
            </form>
          </div>
        </Panel>
      </div>
    </div>
  );
}

export default function SharedMonitorPage() {
  const params = useParams();
  const token = params?.token as string;

  const [monitor, setMonitor] = useState<any>(null);
  const [heartbeats, setHeartbeats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [graphRange, setGraphRange] = useState<"24H" | "12H" | "6H">("24H");
  const [isChartRefreshing, setIsChartRefreshing] = useState(false);

  useEffect(() => {
    if (token) fetchSharedMonitor();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchSharedMonitor = async (
    password?: string,
    isBackgroundRefresh = false
  ) => {
    try {
      if (!isBackgroundRefresh) setLoading(true);
      else setIsChartRefreshing(true);

      const qs = new URLSearchParams({ include_heartbeats: "200" });
      if (password) qs.set("password", password);

      const response = await fetch(
        `${getApiBaseUrl()}/monitors/shared/${token}?${qs.toString()}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          setError("THIS_MONITOR_IS_NOT_AVAILABLE_OR_SHARING_HAS_BEEN_DISABLED.");
        } else if (response.status === 410) {
          setError("THIS_SHARE_LINK_HAS_EXPIRED.");
        } else if (response.status === 401) {
          setRequiresPassword(true);
          setPasswordError("INVALID_PASSWORD. TRY_AGAIN.");
          return;
        } else {
          setError("FAILED_TO_LOAD_MONITOR_DATA.");
        }
        return;
      }

      const data = await response.json();

      if (isBackgroundRefresh) {
        setHeartbeats(data.recent_heartbeats || []);
      } else {
        setMonitor(data);
        setHeartbeats(data.recent_heartbeats || []);
      }

      setRequiresPassword(false);
    } catch {
      setError("FAILED_TO_CONNECT_TO_SERVER.");
    } finally {
      setLoading(false);
      setPasswordLoading(false);
      setIsChartRefreshing(false);
    }
  };

  const handlePasswordSubmit = async (password: string) => {
    setPasswordLoading(true);
    setPasswordError(null);
    await fetchSharedMonitor(password);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false, // Use 24-hour format
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0c0e] flex items-center justify-center">
        <div className="font-mono text-[#6b6f76] tracking-[0.28em] animate-pulse text-[11px] uppercase">
          LOADING_SHARED_MONITOR...
        </div>
      </div>
    );
  }

  if (requiresPassword) {
    return (
      <PasswordPrompt
        onSubmit={handlePasswordSubmit}
        loading={passwordLoading}
        error={passwordError}
      />
    );
  }

  if (error || !monitor) {
    return (
      <div className="min-h-screen bg-[#0b0c0e] text-[#b0b3b8] font-mono">
        <BackgroundLayers />
        <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-10">
          <Panel className="w-full max-w-[720px] p-0 overflow-hidden">
            <div className="h-[3px] bg-[#ff6a6a]" />
            <div className="p-6 sm:p-8 text-center">
              <div className="h-14 w-14 sm:h-16 sm:w-16 mx-auto mb-4 border border-[#ff6a6a]/30 bg-[#ff6a6a]/10 grid place-items-center text-[#ff6a6a] text-[26px] sm:text-[32px]">
                ⚠
              </div>
              <div className="text-[#ff6a6a] text-[11px] sm:text-[12px] tracking-[0.26em] uppercase mb-3">
                MONITOR_NOT_AVAILABLE
              </div>
              <div className="text-[#6f6f6f] text-[10px] sm:text-[11px] leading-relaxed">
                {error || "THIS_SHARED_MONITOR_COULD_NOT_BE_FOUND."}
              </div>
            </div>
          </Panel>
        </div>
      </div>
    );
  }

  const isHeartbeat = monitor.monitor_type === "heartbeat";
  const trace = !isHeartbeat ? getDeepTrace(monitor) : null;

  // Filter heartbeats based on selected time range
  const filteredHeartbeats = heartbeats.filter((hb: any) => {
    const now = new Date();
    const hoursToShow = graphRange === "24H" ? 24 : graphRange === "12H" ? 12 : 6;
    const cutoffTime = new Date(now.getTime() - hoursToShow * 60 * 60 * 1000);
    const hbTime = new Date(hb.created_at);
    return hbTime >= cutoffTime;
  });

  const incidents = filteredHeartbeats
    .filter((hb: any) => hb.status_code >= 400 || hb.error_message)
    .slice(0, 10);

  const p95 = !isHeartbeat ? calculateP95Latency(monitor.recent_heartbeats || []) : null;
  const p99 = !isHeartbeat ? calculateP99Latency(monitor.recent_heartbeats || []) : null;

  return (
    <div className="min-h-screen bg-[#0b0c0e] text-[#b0b3b8] font-mono">
      <BackgroundLayers />

      {/* Header */}
      <div className="border-b border-[#1b1d20] bg-[rgba(10,10,11,0.25)] backdrop-blur-[2px] px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-8 border border-[#2a2d31] bg-[rgba(255,255,255,0.03)] grid place-items-center">
              <div className="h-3 w-3 bg-[#b9c7ff]" />
            </div>
            <div className="text-[#d6d7da] text-[13px] sm:text-[14px] tracking-[0.12em] uppercase">
              PINGSIGHT
            </div>
          </div>
          <div className="text-[#6f6f6f] text-[9px] sm:text-[10px] tracking-[0.20em] uppercase">
            PUBLIC_MONITOR_VIEW
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Monitor Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-6">
            <div className="min-w-0">
              <div className="text-[#d6d7da] text-[15px] sm:text-[18px] tracking-[0.18em] uppercase break-words">
                {monitor.friendly_name}
              </div>
              <div className="mt-2 text-[#6f6f6f] text-[10px] sm:text-[11px] tracking-[0.10em] break-all">
                {!isHeartbeat && monitor.url}
                {isHeartbeat && "HEARTBEAT_MONITOR — REVERSE_PING"}
              </div>
            </div>

            <div
              className={cn(
                "h-[22px] px-3 border flex items-center text-[10px] tracking-[0.18em] uppercase w-fit",
                monitor.status === "UP"
                  ? "border-[#f2d48a]/30 bg-[#f2d48a]/10 text-[#f2d48a]"
                  : "border-[#ff6a6a]/30 bg-[#ff6a6a]/10 text-[#ff6a6a]"
              )}
            >
              {monitor.status}
            </div>
          </div>
        </div>

        {/* Stats (responsive) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <Panel className="p-0">
            <div className="p-4 sm:p-5">
              <div className="text-[#5f636a] text-[9px] tracking-[0.26em] uppercase mb-2">
                UPTIME
              </div>
              <div className="text-[#f2d48a] text-[20px] sm:text-[24px] font-semibold">
                {monitor.uptime_percentage?.toFixed(2) || "0.00"}%
              </div>
            </div>
          </Panel>

          {!isHeartbeat ? (
            <>
              <Panel className="p-0">
                <div className="p-4 sm:p-5">
                  <div className="text-[#5f636a] text-[9px] tracking-[0.26em] uppercase mb-2">
                    AVG_LATENCY
                  </div>
                  <div className="text-[#d6d7da] text-[20px] sm:text-[24px] font-semibold">
                    {monitor.average_latency || 0}ms
                  </div>
                </div>
              </Panel>

              <Panel className="p-0">
                <div className="p-4 sm:p-5">
                  <div className="text-[#5f636a] text-[9px] tracking-[0.26em] uppercase mb-2">
                    P95_LATENCY
                  </div>
                  <div className="text-[#d6d7da] text-[20px] sm:text-[24px] font-semibold">
                    {p95}ms
                  </div>
                </div>
              </Panel>

              <Panel className="p-0 hidden md:block">
                <div className="p-4 sm:p-5">
                  <div className="text-[#5f636a] text-[9px] tracking-[0.26em] uppercase mb-2">
                    P99_LATENCY
                  </div>
                  <div className="text-[#d6d7da] text-[20px] sm:text-[24px] font-semibold">
                    {p99}ms
                  </div>
                </div>
              </Panel>
            </>
          ) : (
            <Panel className="p-0 col-span-1 md:col-span-3">
              <div className="p-4 sm:p-5">
                <div className="text-[#5f636a] text-[9px] tracking-[0.26em] uppercase mb-2">
                  MODE
                </div>
                <div className="text-[#d6d7da] text-[12px] sm:text-[13px] tracking-[0.22em] uppercase">
                  HEARTBEAT_MONITOR (NO_LATENCY_STATS)
                </div>
              </div>
            </Panel>
          )}

          {/* Always show total checks on small screens (if P99 hidden) */}
          <Panel className={cn("p-0", !isHeartbeat ? "md:hidden" : "")}>
            <div className="p-4 sm:p-5">
              <div className="text-[#5f636a] text-[9px] tracking-[0.26em] uppercase mb-2">
                TOTAL_CHECKS
              </div>
              <div className="text-[#d6d7da] text-[20px] sm:text-[24px] font-semibold">
                {monitor.total_checks || 0}
              </div>
            </div>
          </Panel>
        </div>

        {/* Optional: Deep trace summary (mobile-friendly) */}
        {!isHeartbeat && trace ? (
          <Panel className="p-0 mb-6 sm:mb-8 overflow-hidden">
            <div className="px-4 sm:px-5 py-4 border-b border-[#15171a]">
              <div className="flex items-center justify-between gap-4">
                <div className="text-[#d6d7da] text-[11px] sm:text-[12px] tracking-[0.26em] uppercase">
                  DEEP_TRACE_SUMMARY
                </div>
                <div className="text-[#5f636a] text-[9px] sm:text-[10px] tracking-[0.26em] uppercase">
                  TOTAL: <span className="text-[#d6d7da]">{trace.total}ms</span>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-5 grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { k: "DNS", v: trace.dns, c: "#b9c7ff" },
                { k: "TCP", v: trace.tcp, c: "#7c4aff" },
                { k: "TLS", v: trace.tls, c: "#ff6a6a" },
                { k: "TTFB", v: trace.ttfb, c: "#f2d48a" },
              ].map((x) => (
                <div
                  key={x.k}
                  className="border border-[#2a2d31] bg-[rgba(255,255,255,0.02)] p-3"
                >
                  <div className="text-[#5f636a] text-[9px] tracking-[0.26em] uppercase">
                    {x.k}
                  </div>
                  <div
                    className="mt-2 text-[16px] sm:text-[18px] font-semibold"
                    style={{ color: x.c }}
                  >
                    {x.v}ms
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        ) : null}

        {/* Heartbeat Chart */}
        {heartbeats && heartbeats.length > 0 ? (
          <Panel className="mb-6 sm:mb-8 p-0 overflow-hidden">
            <div className="px-4 sm:px-5 py-4 border-b border-[#15171a] flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="text-[#d6d7da] text-[11px] sm:text-[12px] tracking-[0.26em] uppercase">
                  HEARTBEAT_TIMELINE
                </div>
                <div className="text-[#5f636a] text-[9px] sm:text-[10px] tracking-[0.26em] uppercase">
                  [{heartbeats.length} EVENTS]
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="text-[#5f636a] text-[9px] sm:text-[10px] tracking-[0.26em] uppercase">
                  RANGE
                </div>

                {/* Range selector becomes full-width on very small screens */}
                <div className="w-full md:w-auto">
                  <div className="flex w-full md:w-auto border border-[#2a2d31] bg-[rgba(255,255,255,0.02)] divide-x divide-[#2a2d31]">
                    {(["24H", "12H", "6H"] as const).map((range) => (
                      <button
                        key={range}
                        onClick={() => setGraphRange(range)}
                        className={cn(
                          "flex-1 md:flex-none",
                          "h-8 px-2 sm:px-3 md:px-4",
                          "text-[9px] sm:text-[10px] tracking-[0.26em] uppercase font-mono",
                          graphRange === range
                            ? "bg-[rgba(255,255,255,0.06)] text-[#f2d48a]"
                            : "text-[#6f6f6f] hover:text-[#d6d7da] transition"
                        )}
                      >
                        {range}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 sm:p-5 md:p-6 relative">
              <div className="w-full overflow-hidden">
                <HeartbeatChart
                  heartbeats={filteredHeartbeats}
                  monitorType={monitor.monitor_type}
                  showTimeRangeSelector={false}
                />
              </div>

              {isChartRefreshing ? (
                <div className="absolute top-2 right-2">
                  <div className="flex items-center gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-[rgba(0,0,0,0.80)] border border-[#2a2d31] backdrop-blur-sm">
                    <div className="w-2 h-2 rounded-full bg-[#f2d48a] animate-pulse" />
                    <span className="text-[#f2d48a] text-[8px] sm:text-[9px] tracking-[0.22em] uppercase font-mono">
                      LOADING_{graphRange}
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
          </Panel>
        ) : null}

        {/* Incident History (responsive table -> hide Message on xs already, keep) */}
        <Panel className="mb-6 sm:mb-8 p-0 overflow-hidden">
          <div className="px-4 sm:px-5 py-4 border-b border-[#15171a]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
              <div className="text-[#d6d7da] text-[11px] sm:text-[12px] tracking-[0.26em] uppercase">
                INCIDENT_HISTORY
              </div>
              <div className="text-[#5f636a] text-[9px] sm:text-[10px] tracking-[0.26em] uppercase">
                {incidents.length > 0 ? `${incidents.length} INCIDENTS` : "ALL_CLEAR"}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#15171a]">
                  <th className="px-3 sm:px-5 py-3 text-left text-[#5f636a] text-[9px] sm:text-[10px] tracking-[0.26em] uppercase font-normal whitespace-nowrap">
                    TIMESTAMP
                  </th>
                  <th className="px-3 sm:px-5 py-3 text-left text-[#5f636a] text-[9px] sm:text-[10px] tracking-[0.26em] uppercase font-normal whitespace-nowrap">
                    STATUS
                  </th>
                  <th className="px-3 sm:px-5 py-3 text-left text-[#5f636a] text-[9px] sm:text-[10px] tracking-[0.26em] uppercase font-normal whitespace-nowrap">
                    ERROR_CODE
                  </th>
                  <th className="px-3 sm:px-5 py-3 text-left text-[#5f636a] text-[9px] sm:text-[10px] tracking-[0.26em] uppercase font-normal hidden sm:table-cell">
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
                      <td className="px-3 sm:px-5 py-3 text-[#d6d7da] text-[10px] sm:text-[11px] font-mono whitespace-nowrap">
                        {new Date(incident.created_at).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false, // Use 24-hour format
                        })}
                      </td>
                      <td className="px-3 sm:px-5 py-3">
                        <span className="text-[#ff6a6a] text-[10px] sm:text-[11px] tracking-[0.18em] uppercase whitespace-nowrap">
                          DOWN
                        </span>
                      </td>
                      <td className="px-3 sm:px-5 py-3">
                        <span
                          className={cn(
                            "text-[10px] sm:text-[11px] font-mono whitespace-nowrap",
                            (incident.status_code ?? 0) >= 500
                              ? "text-[#ff6a6a]"
                              : "text-[#ffa500]"
                          )}
                        >
                          {incident.status_code || "TIMEOUT"}
                        </span>
                      </td>
                      <td className="px-3 sm:px-5 py-3 text-[#6f6f6f] text-[10px] sm:text-[11px] max-w-xs truncate hidden sm:table-cell">
                        {incident.error_message || "REQUEST_FAILED"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-3 sm:px-5 py-10 text-center text-[#6f6f6f] text-[10px] sm:text-[11px] tracking-[0.22em] uppercase"
                    >
                      NO_INCIDENTS_RECORDED
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>

        {/* Monitor Info */}
        <Panel className="p-0 overflow-hidden">
          <div className="p-4 sm:p-5 md:p-6">
            <div className="text-[#d6d7da] text-[11px] sm:text-[12px] tracking-[0.26em] uppercase mb-4">
              MONITOR_INFORMATION
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-[10px] sm:text-[11px]">
              <div>
                <span className="text-[#5f636a] tracking-[0.22em] uppercase">
                  TYPE:
                </span>
                <span className="ml-2 text-[#d6d7da]">{monitor.monitor_type}</span>
              </div>
              <div>
                <span className="text-[#5f636a] tracking-[0.22em] uppercase">
                  INTERVAL:
                </span>
                <span className="ml-2 text-[#d6d7da]">
                  {monitor.interval_seconds}s
                </span>
              </div>
              <div>
                <span className="text-[#5f636a] tracking-[0.22em] uppercase">
                  CREATED:
                </span>
                <span className="ml-2 text-[#d6d7da] break-all">
                  {formatDate(monitor.created_at)}
                </span>
              </div>
              <div>
                <span className="text-[#5f636a] tracking-[0.22em] uppercase">
                  LAST_CHECK:
                </span>
                <span className="ml-2 text-[#d6d7da] break-all">
                  {formatDate(monitor.last_checked)}
                </span>
              </div>
            </div>
          </div>
        </Panel>

        {/* Footer */}
        <div className="mt-8 text-center">
          <div className="text-[#6f6f6f] text-[9px] sm:text-[10px] tracking-[0.22em] uppercase mb-2">
            POWERED_BY_PINGSIGHT
          </div>
          <div className="text-[#5f636a] text-[8px] sm:text-[9px] tracking-[0.20em] leading-relaxed">
            THIS_IS_A_PUBLIC_VIEW_OF_A_MONITORED_SERVICE
          </div>
        </div>
      </div>
    </div>
  );
}