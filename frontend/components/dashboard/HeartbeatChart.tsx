import { useMemo, useState } from "react";
import { cn } from "@/lib/utils/ui";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface Heartbeat {
  id: number;
  status_code: number;
  latency_ms: number;
  tcp_connect_ms?: number | null;
  tls_handshake_ms?: number | null;
  ttfb_ms?: number | null;
  is_anomaly?: boolean;
  error_message?: string | null;
  created_at: string;
}

interface HeartbeatChartProps {
  heartbeats: Heartbeat[];
}

export function HeartbeatChart({ heartbeats }: HeartbeatChartProps) {
  const [timeRange, setTimeRange] = useState<"all" | "24h" | "7d">("all");

  const { chartData, stats } = useMemo(() => {
    if (!heartbeats || heartbeats.length === 0) {
      return { chartData: [], stats: { successCount: 0, errorCount: 0, anomalyCount: 0, avgLatency: 0 } };
    }

    // Sort by date (oldest first for chart)
    const sorted = [...heartbeats].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    // Filter by time range
    const now = new Date();
    const filtered = sorted.filter((hb) => {
      if (timeRange === "all") return true;
      const date = new Date(hb.created_at);
      const hoursDiff = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
      if (timeRange === "24h") return hoursDiff <= 24;
      if (timeRange === "7d") return hoursDiff <= 168; // 7 days
      return true;
    });

    // Transform data for chart
    const data = filtered.map((hb) => ({
      timestamp: new Date(hb.created_at).getTime(),
      date: hb.created_at,
      latency: hb.latency_ms,
      success: hb.status_code >= 200 && hb.status_code < 300 ? hb.latency_ms : 0,
      error: hb.status_code >= 400 ? hb.latency_ms : 0,
      anomaly: hb.is_anomaly ? hb.latency_ms : 0,
      status_code: hb.status_code,
      is_anomaly: hb.is_anomaly,
      error_message: hb.error_message,
    }));

    // Calculate stats
    const successCount = filtered.filter((hb) => hb.status_code >= 200 && hb.status_code < 300).length;
    const errorCount = filtered.filter((hb) => hb.status_code >= 400).length;
    const anomalyCount = filtered.filter((hb) => hb.is_anomaly).length;
    const avgLatency = filtered.reduce((sum, hb) => sum + hb.latency_ms, 0) / filtered.length;

    return {
      chartData: data,
      stats: { successCount, errorCount, anomalyCount, avgLatency },
    };
  }, [heartbeats, timeRange]);

  if (!heartbeats || heartbeats.length === 0) {
    return (
      <div className="py-8 text-center text-[#6f6f6f] text-[11px] tracking-[0.26em] uppercase">
        NO_HEARTBEAT_DATA
      </div>
    );
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;
    return (
      <div className="bg-[#1a1d21] border border-[#2a2d31] px-4 py-3 rounded">
        <div className="text-[#d6d7da] text-[11px] tracking-[0.18em] mb-2">
          {formatDate(data.timestamp)} {formatTime(data.timestamp)}
        </div>
        <div className="space-y-1">
          <div className="text-[#6f6f6f] text-[10px] tracking-[0.18em]">
            LATENCY: <span className="text-[#f2d48a]">{data.latency}ms</span>
          </div>
          <div className="text-[#6f6f6f] text-[10px] tracking-[0.18em]">
            STATUS: <span className={data.status_code >= 400 ? "text-[#ff6a6a]" : "text-[#f2d48a]"}>
              {data.status_code}
            </span>
          </div>
          {data.is_anomaly && (
            <div className="text-[#ff9500] text-[10px] tracking-[0.18em]">ANOMALY_DETECTED</div>
          )}
          {data.error_message && (
            <div className="text-[#ff6a6a] text-[9px] mt-2 max-w-[200px]">{data.error_message}</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with Time Range Selector */}
      <div className="flex items-center justify-between">
        <div className="text-[#d6d7da] text-[12px] tracking-[0.26em] uppercase">
          LATENCY_TIMELINE
        </div>
        <div className="flex items-center gap-2">
          {(["all", "24h", "7d"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={cn(
                "h-8 px-3 text-[10px] tracking-[0.26em] uppercase transition",
                "border border-[#2a2d31]",
                timeRange === range
                  ? "bg-[rgba(242,212,138,0.08)] text-[#f2d48a] border-[#f2d48a]"
                  : "bg-[rgba(255,255,255,0.02)] text-[#6f6f6f] hover:text-[#d6d7da] hover:border-[#3a3d42]"
              )}
            >
              {range === "all" ? "ALL" : range.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border border-[#2a2d31] bg-[rgba(255,255,255,0.02)] p-3">
          <div className="text-[#5f636a] text-[9px] tracking-[0.26em] uppercase mb-1">SUCCESS</div>
          <div className="text-[#f2d48a] text-[20px] font-semibold">{stats.successCount}</div>
        </div>
        <div className="border border-[#2a2d31] bg-[rgba(255,255,255,0.02)] p-3">
          <div className="text-[#5f636a] text-[9px] tracking-[0.26em] uppercase mb-1">ERRORS</div>
          <div className="text-[#ff6a6a] text-[20px] font-semibold">{stats.errorCount}</div>
        </div>
        <div className="border border-[#2a2d31] bg-[rgba(255,255,255,0.02)] p-3">
          <div className="text-[#5f636a] text-[9px] tracking-[0.26em] uppercase mb-1">ANOMALIES</div>
          <div className="text-[#ff9500] text-[20px] font-semibold">{stats.anomalyCount}</div>
        </div>
        <div className="border border-[#2a2d31] bg-[rgba(255,255,255,0.02)] p-3">
          <div className="text-[#5f636a] text-[9px] tracking-[0.26em] uppercase mb-1">AVG_LATENCY</div>
          <div className="text-[#d6d7da] text-[20px] font-semibold">{stats.avgLatency.toFixed(0)}ms</div>
        </div>
      </div>

      {/* Area Chart */}
      <div className="border border-[#2a2d31] bg-[rgba(255,255,255,0.02)] p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[#d6d7da] text-[11px] tracking-[0.26em] uppercase">
            RESPONSE_TIME_ANALYSIS
          </div>
          <div className="flex items-center gap-4 text-[9px] tracking-[0.26em] uppercase">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#f2d48a]" />
              <span className="text-[#6f6f6f]">SUCCESS</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#ff6a6a]" />
              <span className="text-[#6f6f6f]">ERROR</span>
            </div>
          </div>
        </div>

        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="successGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f2d48a" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f2d48a" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="errorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff6a6a" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ff6a6a" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2d31" vertical={false} />
              <XAxis
                dataKey="timestamp"
                tickLine={false}
                axisLine={{ stroke: "#2a2d31" }}
                tick={{ fill: "#5f636a", fontSize: 10 }}
                tickMargin={8}
                minTickGap={50}
                tickFormatter={formatTime}
              />
              <YAxis
                tickLine={false}
                axisLine={{ stroke: "#2a2d31" }}
                tick={{ fill: "#5f636a", fontSize: 10 }}
                tickMargin={8}
                label={{
                  value: "LATENCY (MS)",
                  angle: -90,
                  position: "insideLeft",
                  style: { fill: "#5f636a", fontSize: 10, letterSpacing: "0.18em" },
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="success"
                stroke="#f2d48a"
                strokeWidth={2}
                fill="url(#successGradient)"
                stackId="1"
              />
              <Area
                type="monotone"
                dataKey="error"
                stroke="#ff6a6a"
                strokeWidth={2}
                fill="url(#errorGradient)"
                stackId="1"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Status Distribution */}
      <div className="border border-[#2a2d31] bg-[rgba(255,255,255,0.02)] p-5">
        <div className="text-[#d6d7da] text-[12px] tracking-[0.26em] uppercase mb-4">
          STATUS_DISTRIBUTION
        </div>

        <div className="space-y-3">
          {/* Success bar */}
          <div>
            <div className="flex items-center justify-between text-[10px] tracking-[0.22em] mb-1">
              <span className="text-[#6f6f6f] uppercase">2XX_SUCCESS</span>
              <span className="text-[#f2d48a]">
                {((stats.successCount / chartData.length) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="h-2 bg-[rgba(0,0,0,0.3)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#f2d48a] transition-all"
                style={{ width: `${(stats.successCount / chartData.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Error bar */}
          {stats.errorCount > 0 && (
            <div>
              <div className="flex items-center justify-between text-[10px] tracking-[0.22em] mb-1">
                <span className="text-[#6f6f6f] uppercase">4XX/5XX_ERRORS</span>
                <span className="text-[#ff6a6a]">
                  {((stats.errorCount / chartData.length) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="h-2 bg-[rgba(0,0,0,0.3)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#ff6a6a] transition-all"
                  style={{ width: `${(stats.errorCount / chartData.length) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Anomaly bar */}
          {stats.anomalyCount > 0 && (
            <div>
              <div className="flex items-center justify-between text-[10px] tracking-[0.22em] mb-1">
                <span className="text-[#6f6f6f] uppercase">ANOMALIES</span>
                <span className="text-[#ff9500]">
                  {((stats.anomalyCount / chartData.length) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="h-2 bg-[rgba(0,0,0,0.3)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#ff9500] transition-all"
                  style={{ width: `${(stats.anomalyCount / chartData.length) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Issues */}
      {(stats.errorCount > 0 || stats.anomalyCount > 0) && (
        <div className="border border-[#2a2d31] bg-[rgba(255,255,255,0.02)] p-5">
          <div className="text-[#d6d7da] text-[12px] tracking-[0.26em] uppercase mb-4">
            RECENT_ISSUES
          </div>
          <div className="space-y-2 max-h-[150px] overflow-y-auto">
            {chartData
              .filter((d) => d.error > 0 || d.is_anomaly)
              .slice(-5)
              .reverse()
              .map((d, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-[10px] py-2 border-b border-[#15171a] last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full",
                        d.error > 0 ? "bg-[#ff6a6a]" : "bg-[#ff9500]"
                      )}
                    />
                    <span className="text-[#d6d7da] tracking-[0.18em]">
                      {d.is_anomaly ? "ANOMALY" : `ERROR_${d.status_code}`}
                    </span>
                    {d.error_message && (
                      <span className="text-[#6f6f6f] tracking-[0.18em] truncate max-w-[300px]">
                        {d.error_message}
                      </span>
                    )}
                  </div>
                  <span className="text-[#5f636a] tracking-[0.18em]">{formatTime(d.timestamp)}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
