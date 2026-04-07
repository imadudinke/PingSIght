"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils/ui";
import { BackgroundLayers } from "@/components/dashboard/BackgroundLayers";
import { Panel } from "@/components/dashboard/Panel";
import { HeartbeatChart } from "@/components/dashboard/HeartbeatChart";
import { getDeepTrace, calculateP95Latency, calculateP99Latency } from "@/lib/utils/monitor";

function PasswordPrompt({ 
  onSubmit, 
  loading, 
  error 
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
      <div className="flex items-center justify-center min-h-screen px-8">
        <Panel className="max-w-md w-full">
          <div className="p-8">
            <div className="text-center mb-6">
              <div className="h-16 w-16 mx-auto mb-4 border border-[#f2d48a]/30 bg-[#f2d48a]/10 grid place-items-center text-[#f2d48a] text-[24px]">
                🔒
              </div>
              <div className="text-[#f2d48a] text-[12px] tracking-[0.26em] uppercase mb-2">
                PASSWORD_REQUIRED
              </div>
              <div className="text-[#6f6f6f] text-[10px] leading-relaxed">
                This shared monitor is password protected. Enter the password to continue.
              </div>
            </div>

            {error && (
              <div className="bg-[#ff6a6a]/10 border border-[#ff6a6a]/30 px-4 py-3 mb-4">
                <div className="text-[#ff6a6a] text-[10px] font-mono">
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
                    placeholder="Enter password"
                    className="w-full px-4 py-3 pr-12 bg-[#0b0c0e] border border-[#1f2227] text-[#d6d7da] text-[11px] font-mono placeholder-[#6b6f76] focus:border-[#f2d48a] focus:outline-none"
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
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !password.trim()}
                className="w-full bg-[#f2d48a] text-[#0b0c0e] font-mono text-xs font-bold tracking-wider uppercase py-3 hover:bg-[#d6d7da] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      fetchSharedMonitor();
    }
  }, [token]);

  const fetchSharedMonitor = async (password?: string) => {
    try {
      const url = new URL(`http://localhost:8000/monitors/shared/${token}`);
      url.searchParams.set('include_heartbeats', '50');
      if (password) {
        url.searchParams.set('password', password);
      }

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        if (response.status === 404) {
          setError("This monitor is not available or sharing has been disabled.");
        } else if (response.status === 410) {
          setError("This share link has expired.");
        } else if (response.status === 401) {
          setRequiresPassword(true);
          setPasswordError("Invalid password. Please try again.");
          return;
        } else {
          setError("Failed to load monitor data.");
        }
        return;
      }

      const data = await response.json();
      setMonitor(data);
      setRequiresPassword(false);
    } catch (err) {
      setError("Failed to connect to the server.");
    } finally {
      setLoading(false);
      setPasswordLoading(false);
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
