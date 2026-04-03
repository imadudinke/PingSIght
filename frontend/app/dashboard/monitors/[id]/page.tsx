"use client";

import { useEffect, useState } from "react";
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

type MonitorDetail = GetMonitorMonitorsMonitorIdGetResponses[200];

export default function MonitorDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, isLoading, user, logout } = useAuth();

  const [monitor, setMonitor] = useState<MonitorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
                <div className="text-[#d6d7da] text-[14px] tracking-[0.18em] uppercase">
                  MONITOR_DETAILS
                </div>
                {monitor && (
                  <div className="mt-1 text-[#6f6f6f] text-[11px] tracking-[0.10em]">
                    {monitor.friendly_name}
                  </div>
                )}
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="border border-[#2a2d31] bg-[rgba(255,255,255,0.02)] p-4">
                        <div className="text-[#5f636a] text-[10px] tracking-[0.26em] uppercase mb-2">
                          UPTIME
                        </div>
                        <div className="text-[#f2d48a] text-[28px] font-semibold">
                          {monitor.uptime_percentage?.toFixed(2) ?? "0.00"}%
                        </div>
                      </div>
                      <div className="border border-[#2a2d31] bg-[rgba(255,255,255,0.02)] p-4">
                        <div className="text-[#5f636a] text-[10px] tracking-[0.26em] uppercase mb-2">
                          AVG_LATENCY
                        </div>
                        <div className="text-[#d6d7da] text-[28px] font-semibold">
                          {monitor.average_latency ?? 0}ms
                        </div>
                      </div>
                      <div className="border border-[#2a2d31] bg-[rgba(255,255,255,0.02)] p-4">
                        <div className="text-[#5f636a] text-[10px] tracking-[0.26em] uppercase mb-2">
                          TOTAL_CHECKS
                        </div>
                        <div className="text-[#d6d7da] text-[28px] font-semibold">
                          {monitor.total_checks ?? 0}
                        </div>
                      </div>
                    </div>

                    <div className="border border-[#2a2d31] bg-[rgba(255,255,255,0.02)] p-5">
                      <div className="text-[#d6d7da] text-[12px] tracking-[0.26em] uppercase mb-4">
                        CONFIGURATION
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px]">
                        <div>
                          <span className="text-[#5f636a] tracking-[0.22em] uppercase">
                            TYPE:
                          </span>
                          <span className="ml-2 text-[#d6d7da]">
                            {monitor.monitor_type}
                          </span>
                        </div>

                        <div>
                          <span className="text-[#5f636a] tracking-[0.22em] uppercase">
                            STATUS:
                          </span>
                          <span
                            className={cn(
                              "ml-2",
                              monitor.status === "UP"
                                ? "text-[#f2d48a]"
                                : "text-[#ff6a6a]"
                            )}
                          >
                            {monitor.status}
                          </span>
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
                            ACTIVE:
                          </span>
                          <span className="ml-2 text-[#d6d7da]">
                            {monitor.is_active ? "YES" : "NO"}
                          </span>
                        </div>

                        <div className="md:col-span-2">
                          <span className="text-[#5f636a] tracking-[0.22em] uppercase">
                            URL:
                          </span>
                          <span className="ml-2 text-[#d6d7da] break-all">
                            {monitor.url}
                          </span>
                        </div>

                        <div>
                          <span className="text-[#5f636a] tracking-[0.22em] uppercase">
                            CREATED:
                          </span>
                          <span className="ml-2 text-[#d6d7da]">
                            {formatDate(monitor.created_at)}
                          </span>
                        </div>

                        <div>
                          <span className="text-[#5f636a] tracking-[0.22em] uppercase">
                            LAST_CHECK:
                          </span>
                          <span className="ml-2 text-[#d6d7da]">
                            {formatDate(monitor.last_checked)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {(monitor.ssl_status || monitor.domain_status) && (
                      <div className="border border-[#2a2d31] bg-[rgba(255,255,255,0.02)] p-5">
                        <div className="text-[#d6d7da] text-[12px] tracking-[0.26em] uppercase mb-4">
                          SECURITY_&_DOMAIN
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px]">
                          {monitor.ssl_status && (
                            <>
                              <div>
                                <span className="text-[#5f636a] tracking-[0.22em] uppercase">
                                  SSL_STATUS:
                                </span>
                                <span
                                  className={cn(
                                    "ml-2",
                                    monitor.ssl_status === "valid"
                                      ? "text-[#f2d48a]"
                                      : "text-[#ff6a6a]"
                                  )}
                                >
                                  {monitor.ssl_status}
                                </span>
                              </div>

                              <div>
                                <span className="text-[#5f636a] tracking-[0.22em] uppercase">
                                  SSL_DAYS_LEFT:
                                </span>
                                <span className="ml-2 text-[#d6d7da]">
                                  {monitor.ssl_days_remaining ?? "N/A"}
                                </span>
                              </div>
                            </>
                          )}

                          {monitor.domain_status && (
                            <>
                              <div>
                                <span className="text-[#5f636a] tracking-[0.22em] uppercase">
                                  DOMAIN_STATUS:
                                </span>
                                <span className="ml-2 text-[#d6d7da]">
                                  {monitor.domain_status}
                                </span>
                              </div>

                              <div>
                                <span className="text-[#5f636a] tracking-[0.22em] uppercase">
                                  DOMAIN_DAYS_LEFT:
                                </span>
                                <span className="ml-2 text-[#d6d7da]">
                                  {monitor.domain_days_remaining ?? "N/A"}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="border border-[#2a2d31] bg-[rgba(255,255,255,0.02)]">
                      <div className="px-5 py-4 border-b border-[#15171a]">
                        <div className="text-[#d6d7da] text-[12px] tracking-[0.26em] uppercase">
                          HEARTBEAT_ANALYSIS [{monitor.recent_heartbeats?.length ?? 0}]
                        </div>
                      </div>

                      <div className="p-5">
                        <HeartbeatChart heartbeats={monitor.recent_heartbeats || []} />
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