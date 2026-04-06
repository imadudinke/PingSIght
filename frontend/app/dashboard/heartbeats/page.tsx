"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useMonitors } from "@/lib/hooks/useMonitors";
import { cn } from "@/lib/utils/ui";
import { BackgroundLayers } from "@/components/dashboard/BackgroundLayers";
import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/Header";
import { DashboardFooter } from "@/components/dashboard/Footer";
import { StatCard } from "@/components/dashboard/StatCard";
import { Panel } from "@/components/dashboard/Panel";
import { LegendDot } from "@/components/dashboard/LegendDot";
import { MonitorRow } from "@/components/dashboard/MonitorRow";
import { Pagination } from "@/components/dashboard/Pagination";
import { CreateMonitorModal } from "@/components/monitors/CreateMonitorModal";
import { EditMonitorModal } from "@/components/monitors/EditMonitorModal";
import { DeleteConfirmModal } from "@/components/monitors/DeleteConfirmModal";
import { ShareMonitorModal } from "@/components/monitors/ShareMonitorModal";
import { MonitorActionsMenu } from "@/components/monitors/MonitorActionsMenu";
import type { MonitorResponse } from "@/lib/api/types.gen";

export default function HeartbeatsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();
  const { monitors, loading: loadingMonitors, isRefreshing, lastUpdated, refetch } = useMonitors();
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedMonitor, setSelectedMonitor] = useState<MonitorResponse | null>(null);
  const itemsPerPage = 10;

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/");
  }, [isAuthenticated, isLoading, router]);

  // Filter only heartbeat monitors
  const heartbeatMonitors = useMemo(
    () => monitors.filter((m: any) => m.monitor_type === "heartbeat"),
    [monitors]
  );

  const operationalCount = useMemo(
    () =>
      heartbeatMonitors.filter((m: any) => (m.last_status ?? m.status) === "UP").length,
    [heartbeatMonitors]
  );

  const issueCount = useMemo(
    () =>
      heartbeatMonitors.filter((m: any) => {
        const s = m.last_status ?? m.status;
        return s !== "UP" && s !== "PENDING";
      }).length,
    [heartbeatMonitors]
  );

  const pendingCount = useMemo(
    () =>
      heartbeatMonitors.filter((m: any) => (m.last_status ?? m.status) === "PENDING").length,
    [heartbeatMonitors]
  );

  const totalMonitors = heartbeatMonitors.length;
  const totalPages = Math.ceil(totalMonitors / itemsPerPage);

  const paginatedMonitors = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return heartbeatMonitors.slice(startIndex, endIndex);
  }, [heartbeatMonitors, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

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
        <DashboardSidebar onNewMonitor={() => setIsCreateModalOpen(true)} />

        <div className="flex-1 flex flex-col">
          <DashboardHeader userEmail={user?.email} />

          <div className="flex-1 px-8 py-8 overflow-auto">
            {/* Page Header */}
            <div className="mb-6">
              <div className="text-[#d6d7da] text-[18px] tracking-[0.18em] uppercase mb-2">
                HEARTBEAT_MONITORS
              </div>
              <div className="text-[#6f6f6f] text-[11px] tracking-[0.10em] leading-relaxed max-w-3xl">
                "Silence is the Alarm" - Monitor cron jobs, backups, and scheduled tasks. Get alerted when they stop pinging.
              </div>
            </div>

            {/* STATS */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="TOTAL_HEARTBEATS"
                value={String(totalMonitors).padStart(2, "0")}
                foot={`${operationalCount} RECEIVING_PINGS`}
                icon="gauge"
                valueClass="text-[#ff6a6a]"
              />
              <StatCard
                title="RECEIVING_PINGS"
                value={String(operationalCount).padStart(2, "0")}
                foot="HEALTHY_STATUS"
                icon="gauge"
                valueClass="text-[#f2d48a]"
              />
              <StatCard
                title="MISSED_PINGS"
                value={String(issueCount).padStart(2, "0")}
                foot="REQUIRES_ATTENTION"
                icon="alert"
                valueClass="text-[#ff6a6a]"
                incidentDots={issueCount}
              />
              <StatCard
                title="PENDING"
                value={String(pendingCount).padStart(2, "0")}
                foot="AWAITING_FIRST_PING"
                icon="timer"
                valueClass="text-[#6f6f6f]"
              />
            </div>

            {/* Info Panel */}
            {totalMonitors === 0 && (
              <Panel className="mb-8">
                <div className="p-8 text-center">
                  <div className="h-16 w-16 mx-auto mb-4 border border-[#2a2d31] bg-[rgba(255,255,255,0.02)] grid place-items-center text-[#ff6a6a] text-[32px]">
                    ♥
                  </div>
                  <div className="text-[#d6d7da] text-[12px] tracking-[0.26em] uppercase mb-3">
                    NO_HEARTBEAT_MONITORS_YET
                  </div>
                  <div className="text-[#6f6f6f] text-[10px] leading-relaxed max-w-2xl mx-auto mb-6">
                    Heartbeat monitors work in reverse: instead of us checking your service, your service pings us.
                    Perfect for monitoring cron jobs, backups, and scheduled tasks that run on their own schedule.
                  </div>
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-[#f2d48a] text-[#0b0c0e] font-mono text-[10px] font-bold tracking-[0.26em] uppercase px-6 py-3 hover:bg-[#d6d7da] transition-all"
                  >
                    + CREATE_HEARTBEAT_MONITOR
                  </button>
                </div>
              </Panel>
            )}

            {/* HEARTBEAT MONITORS LIST */}
            {totalMonitors > 0 && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <div className="text-[#d6d7da] text-[14px] tracking-[0.18em] uppercase">
                      HEARTBEAT_MONITORS [N:{totalMonitors}]
                    </div>
                    
                    {/* Auto-refresh indicator */}
                    {isRefreshing && (
                      <div className="flex items-center gap-2 text-[#f2d48a] text-[10px] tracking-[0.26em] uppercase">
                        <div className="w-2 h-2 rounded-full bg-[#f2d48a] animate-pulse"></div>
                        <span>UPDATING...</span>
                      </div>
                    )}
                    
                    {/* Last updated timestamp */}
                    {lastUpdated && !isRefreshing && (
                      <div className="text-[#5f636a] text-[10px] tracking-[0.22em] uppercase">
                        UPDATED: {lastUpdated.toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-6">
                    {/* Manual refresh button */}
                    <button
                      onClick={() => refetch()}
                      disabled={isRefreshing}
                      className={cn(
                        "h-8 px-3 flex items-center gap-2",
                        "border border-[#2a2d31] bg-[rgba(255,255,255,0.02)]",
                        "text-[10px] tracking-[0.26em] uppercase transition",
                        isRefreshing 
                          ? "text-[#5f636a] cursor-not-allowed opacity-50"
                          : "text-[#a9acb2] hover:text-[#d6d7da] hover:border-[#3a3d42]"
                      )}
                    >
                      <span className={cn(isRefreshing && "animate-spin")}>↻</span>
                      <span>REFRESH</span>
                    </button>
                    
                    <button
                      onClick={() => setIsCreateModalOpen(true)}
                      className="bg-[#f2d48a] text-[#0b0c0e] font-mono text-[10px] font-bold tracking-[0.26em] uppercase px-4 py-2 hover:bg-[#d6d7da] transition-all"
                    >
                      + NEW_HEARTBEAT
                    </button>
                    <div className="flex items-center gap-6 text-[10px] tracking-[0.26em] uppercase">
                      <LegendDot label="RECEIVING" color="#f2d48a" />
                      <LegendDot label="MISSED" color="#ff6a6a" />
                    </div>
                  </div>
                </div>
                <Panel className="overflow-hidden">
                  {loadingMonitors ? (
                    <div className="py-14 text-center text-[#6f6f6f] text-[11px] tracking-[0.28em] uppercase">
                      LOADING_HEARTBEATS...
                    </div>
                  ) : (
                    <>
                      <div className="divide-y divide-[#15171a]">
                        {paginatedMonitors.map((m: any) => (
                          <div key={m.id} className="relative">
                            <div className="flex items-center">
                              <div 
                                className="flex-1 cursor-pointer"
                                onClick={() => router.push(`/dashboard/monitors/${m.id}`)}
                              >
                                <MonitorRow monitor={m} onClick={() => {}} />
                              </div>
                              <div className="px-6">
                                <MonitorActionsMenu
                                  monitor={m}
                                  onEdit={() => {
                                    setSelectedMonitor(m);
                                    setIsEditModalOpen(true);
                                  }}
                                  onDelete={() => {
                                    setSelectedMonitor(m);
                                    setIsDeleteModalOpen(true);
                                  }}
                                  onShare={() => {
                                    setSelectedMonitor(m);
                                    setIsShareModalOpen(true);
                                  }}
                                  onMaintenanceToggle={() => refetch()}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalRecords={totalMonitors}
                        onPageChange={setCurrentPage}
                      />
                    </>
                  )}
                </Panel>
              </section>
            )}
          </div>

          <DashboardFooter />
        </div>
      </div>

      {/* Create Monitor Modal */}
      <CreateMonitorModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          refetch();
        }}
      />

      {/* Edit Monitor Modal */}
      <EditMonitorModal
        isOpen={isEditModalOpen}
        monitor={selectedMonitor}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedMonitor(null);
        }}
        onSuccess={() => {
          refetch();
        }}
      />

      {/* Delete Confirm Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        monitor={selectedMonitor}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedMonitor(null);
        }}
        onSuccess={() => {
          refetch();
        }}
      />

      {/* Share Monitor Modal */}
      <ShareMonitorModal
        isOpen={isShareModalOpen}
        monitorId={selectedMonitor?.id || ""}
        monitorName={selectedMonitor?.friendly_name || ""}
        onClose={() => {
          setIsShareModalOpen(false);
          setSelectedMonitor(null);
        }}
      />
    </div>
  );
}
