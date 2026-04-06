"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils/ui";
import { BackgroundLayers } from "@/components/dashboard/BackgroundLayers";
import { Panel } from "@/components/dashboard/Panel";
import { HeartbeatChart } from "@/components/dashboard/HeartbeatChart";
import { getDeepTrace, calculateP95Latency, calculateP99Latency } from "@/lib/utils/monitor";

export default function SharedMonitorPage() {
  const params = useParams();
  const token = params?.token as string;
  
  const [monitor, setMonitor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      fetchSharedMonitor();
    }
  }, [token]);

  const fetchSharedMonitor = async () => {
    try {
      const response = await fetch(`http://localhost:8000/monitors/shared/${token}?include_heartbeats=50`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError("This monitor is not available or sharing has been disabled.");
        } else {
          setError("Failed to load monitor data.");
        }
        return;
      }

      const data = await response.json();
      setMonitor(data);
    } catch (err) {
      setError("Failed to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0c0e] flex items-center justify-center">
        <div className="font-mono text-[#6b6f76] tracking-[0.28em] animate-pulse text-[11px] uppercase">
          LOADING_SHARED_MONITOR...
        </div>
      </div>
    );
  }

  if (error || !monitor) {
    return (
      <div className="min-h-screen bg-[#0b0c0e] text-[#b0b3b8] font-mono">
        <BackgroundLayers />
        <div className="flex items-center justify-center min-h-screen px-8">
          <Panel className="max-w-2xl w-full">
            <div className="p-8 text-center">
              <div className="h-16 w-16 mx-auto mb-4 border border-[#ff6a6a]/30 bg-[#ff6a6a]/10 grid place-items-center text-[#ff6a6a] text-[32px]">
                ⚠
              </div>
              <div className="text-[#ff6a6a] text-[12px] tracking-[0.26em] uppercase mb-3">
                MONITOR_NOT_AVAILABLE
              </div>
              <div className="text-[#6f6f6f] text-[10px] leading-relaxed">
                {error || "This shared monitor could not be found."}
              </div>
            </div>
          </Panel>
        </div>
      </div>
    );
  }

  const isHeartbeat = monitor.monitor_type === "heartbeat";
  const trace = !isHeartbeat ? getDeepTrace(monitor) : null;

  return (
    <div className="min-h-screen bg-[#0b0c0e] text-[#b0b3b8] font-mono">
      <BackgroundLayers />

      {/* Header */}
      <div className="border-b border-[#1b1d20] bg-[rgba(10,10,11,0.25)] backdrop-blur-[2px] px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-8 border border-[#2a2d31] bg-[rgba(255,255,255,0.03)] grid place-items-center">
              <div className="h-3 w-3 bg-[#b9c7ff]" />
            </div>
            <div className="text-[#d6d7da] text-[14px] tracking-[0.12em] uppercase">
              PINGSIGHT
            </div>
          </div>
          <div className="text-[#6f6f6f] text-[10px] tracking-[0.20em] uppercase">
            PUBLIC_MONITOR_VIEW
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Monitor Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="text-[#d6d7da] text-[18px] tracking-[0.18em] uppercase">
              {monitor.friendly_name}
            </div>
            <div className={cn(
              "h-[20px] px-2 border flex items-center text-[10px] tracking-[0.18em] uppercase",
              monitor.status === "UP" 
                ? "border-[#f2d48a]/30 bg-[#f2d48a]/10 text-[#f2d48a]"
                : "border-[#ff6a6a]/30 bg-[#ff6a6a]/10 text-[#ff6a6a]"
            )}>
              {monitor.status}
            </div>
          </div>
          <div className="text-[#6f6f6f] text-[11px] tracking-[0.10em]">
            {!isHeartbeat && monitor.url}
            {isHeartbeat && "Heartbeat Monitor - Reverse Ping"}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Panel>
            <div className="p-4">
              <div className="text-[#5f636a] text-[9px] tracking-[0.26em] uppercase mb-2">
                UPTIME
              </div>
              <div className="text-[#f2d48a] text-[24px] font-semibold">
                {monitor.uptime_percentage?.toFixed(2) || "0.00"}%
              </div>
            </div>
          </Panel>

          {!isHeartbeat && (
            <>
              <Panel>
                <div className="p-4">
                  <div className="text-[#5f636a] text-[9px] tracking-[0.26em] uppercase mb-2">
                    AVG_LATENCY
                  </div>
                  <div className="text-[#d6d7da] text-[24px] font-semibold">
                    {monitor.average_latency || 0}ms
                  </div>
                </div>
              </Panel>

              <Panel>
                <div className="p-4">
                  <div className="text-[#5f636a] text-[9px] tracking-[0.26em] uppercase mb-2">
                    P95_LATENCY
                  </div>
                  <div className="text-[#d6d7da] text-[24px] font-semibold">
                    {calculateP95Latency(monitor.recent_heartbeats || [])}ms
                  </div>
                </div>
              </Panel>
            </>
          )}

          <Panel>
            <div className="p-4">
              <div className="text-[#5f636a] text-[9px] tracking-[0.26em] uppercase mb-2">
                TOTAL_CHECKS
              </div>
              <div className="text-[#d6d7da] text-[24px] font-semibold">
                {monitor.total_checks || 0}
              </div>
            </div>
          </Panel>
        </div>

        {/* Heartbeat Chart */}
        {monitor.recent_heartbeats && monitor.recent_heartbeats.length > 0 && (
          <Panel className="mb-8">
            <div className="p-6">
              <HeartbeatChart 
                heartbeats={monitor.recent_heartbeats} 
                monitorType={monitor.monitor_type}
              />
            </div>
          </Panel>
        )}

        {/* Monitor Info */}
        <Panel>
          <div className="p-6">
            <div className="text-[#d6d7da] text-[12px] tracking-[0.26em] uppercase mb-4">
              MONITOR_INFORMATION
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px]">
              <div>
                <span className="text-[#5f636a] tracking-[0.22em] uppercase">TYPE:</span>
                <span className="ml-2 text-[#d6d7da]">{monitor.monitor_type}</span>
              </div>
              <div>
                <span className="text-[#5f636a] tracking-[0.22em] uppercase">INTERVAL:</span>
                <span className="ml-2 text-[#d6d7da]">{monitor.interval_seconds}s</span>
              </div>
              <div>
                <span className="text-[#5f636a] tracking-[0.22em] uppercase">CREATED:</span>
                <span className="ml-2 text-[#d6d7da]">{formatDate(monitor.created_at)}</span>
              </div>
              <div>
                <span className="text-[#5f636a] tracking-[0.22em] uppercase">LAST_CHECK:</span>
                <span className="ml-2 text-[#d6d7da]">{formatDate(monitor.last_checked)}</span>
              </div>
            </div>
          </div>
        </Panel>

        {/* Footer */}
        <div className="mt-8 text-center">
          <div className="text-[#6f6f6f] text-[10px] tracking-[0.22em] uppercase mb-2">
            POWERED_BY_PINGSIGHT
          </div>
          <div className="text-[#5f636a] text-[9px] tracking-[0.20em]">
            This is a public view of a monitored service
          </div>
        </div>
      </div>
    </div>
  );
}
