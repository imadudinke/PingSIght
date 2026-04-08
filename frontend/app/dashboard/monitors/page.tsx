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
import { LogRow } from "@/components/dashboard/LogRow";
import { Pagination } from "@/components/dashboard/Pagination";
import { CreateMonitorModal } from "@/components/monitors/CreateMonitorModal";
import { EditMonitorModal } from "@/components/monitors/EditMonitorModal";
import { DeleteConfirmModal } from "@/components/monitors/DeleteConfirmModal";
import { ShareMonitorModal } from "@/components/monitors/ShareMonitorModal";
import { BulkExportModal } from "@/components/monitors/BulkExportModal";
import { MonitorActionsMenu } from "@/components/monitors/MonitorActionsMenu";
import { MonitorRowSkeleton } from "@/components/ui/Skeleton";
import { WorldMap } from "@/components/dashboard/WorldMap";
import type { MonitorResponse } from "@/lib/api/types.gen";

export default function Dashboard() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();
  const { monitors, loading: loadingMonitors, isRefreshing, lastUpdated, refetch, updateMonitor } = useMonitors();
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isBulkExportModalOpen, setIsBulkExportModalOpen] = useState(false);
  const [selectedMonitor, setSelectedMonitor] = useState<MonitorResponse | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const itemsPerPage = 10;

  // Sample world map data - replace with real monitoring nodes later
  const worldMapNodes = useMemo(() => [
    { id: "us-east", name: "US East", lat: 40.7128, lon: -74.0060, status: "ok" as const },
    { id: "us-west", name: "US West", lat: 37.7749, lon: -122.4194, status: "ok" as const },
    { id: "eu-west", name: "EU West", lat: 51.5074, lon: -0.1278, status: "ok" as const },
    { id: "eu-central", name: "EU Central", lat: 50.1109, lon: 8.6821, status: "ok" as const },
    { id: "asia-east", name: "Asia East", lat: 35.6762, lon: 139.6503, status: "ok" as const },
    { id: "asia-south", name: "Asia South", lat: 1.3521, lon: 103.8198, status: "ok" as const },
    { id: "au-east", name: "Australia", lat: -33.8688, lon: 151.2093, status: "ok" as const },
  ], []);

  const worldMapPings = useMemo(() => [
    { id: "ping-1", fromId: "us-east", toId: "eu-west", latencyMs: 85, tone: "ok" as const },
    { id: "ping-2", fromId: "us-west", toId: "asia-east", latencyMs: 120, tone: "ok" as const },
    { id: "ping-3", fromId: "eu-west", toId: "eu-central", latencyMs: 25, tone: "ok" as const },
    { id: "ping-4", fromId: "asia-east", toId: "asia-south", latencyMs: 65, tone: "ok" as const },
    { id: "ping-5", fromId: "asia-south", toId: "au-east", latencyMs: 95, tone: "ok" as const },
    { id: "ping-6", fromId: "us-east", toId: "us-west", latencyMs: 70, tone: "ok" as const },
  ], []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/");
  }, [isAuthenticated, isLoading, router]);

  const operationalCount = useMemo(
    () =>
      monitors.filter((m: any) => (m.last_status ?? m.status) === "UP").length,
    [monitors]
  );

  const issueCount = useMemo(
    () =>
      monitors.filter((m: any) => {
        const s = m.last_status ?? m.status;
        return s !== "UP" && s !== "PENDING";
      }).length,
    [monitors]
  );

  const totalMonitors = monitors.length;
  const totalPages = Math.ceil(totalMonitors / itemsPerPage);

  const paginatedMonitors = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return monitors.slice(startIndex, endIndex);
  }, [monitors, currentPage]);

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
        <DashboardSidebar 
          onNewMonitor={() => setIsCreateModalOpen(true)}
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />

        <div className="flex-1 flex flex-col lg:ml-[248px]">
          <DashboardHeader 
            userEmail={user?.email}
            onMenuClick={() => setIsMobileMenuOpen(true)}
          />

          <div className="flex-1 px-4 md:px-6 lg:px-8 py-6 md:py-8 overflow-auto">
            {/* STATS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              <StatCard
                title="SYSTEM_UPTIME"
                value="99.98%"
                foot="REFERENCE: NODE_A1"
                icon="gauge"
                valueClass="text-[#d6d7da]"
              />
              <StatCard
                title="ACTIVE_INCIDENTS"
                value={String(issueCount).padStart(2, "0")}
                foot=""
                icon="alert"
                valueClass="text-[#ff6a6a]"
                incidentDots={issueCount}
              />
              <StatCard
                title="LATENCY_AVG"
                value="44ms"
                foot="TARGET: <50MS"
                icon="timer"
                valueClass="text-[#f2d48a]"
              />
            </div>

            {/* ACTIVE MONITORS */}
            <section className="mt-6 md:mt-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-3 gap-3">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="text-[#d6d7da] text-[12px] md:text-[14px] tracking-[0.18em] uppercase">
                    ACTIVE_MONITORS [N:{totalMonitors}]
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
                <div className="flex items-center gap-3 md:gap-6 flex-wrap">
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
                    <span className="hidden sm:inline">REFRESH</span>
                  </button>
                  
                  {/* Bulk Export Button */}
                  {monitors.length > 0 && (
                    <button
                      onClick={() => setIsBulkExportModalOpen(true)}
                      className={cn(
                        "h-8 px-3 flex items-center gap-2",
                        "border border-[#2a2d31] bg-[rgba(255,255,255,0.02)]",
                        "text-[10px] tracking-[0.26em] uppercase transition",
                        "text-[#a9acb2] hover:text-[#d6d7da] hover:border-[#3a3d42]"
                      )}
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      <span className="hidden sm:inline">EXPORT_ALL</span>
                    </button>
                  )}
                  
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-[#f2d48a] text-[#0b0c0e] font-mono text-[10px] font-bold tracking-[0.26em] uppercase px-3 md:px-4 py-2 hover:bg-[#d6d7da] transition-all whitespace-nowrap"
                  >
                    + NEW_MONITOR
                  </button>
                  <div className="hidden md:flex items-center gap-6 text-[10px] tracking-[0.26em] uppercase">
                    <LegendDot label="OPERATIONAL" color="#f2d48a" />
                    <LegendDot label="DEGRADED" color="#ff6a6a" />
                  </div>
                </div>
              </div>
              <Panel className="overflow-hidden">
                {loadingMonitors ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                      <thead>
                        <tr className="border-b border-[#15171a]">
                          <th className="px-3 md:px-5 py-3 text-left text-[#5f636a] text-[10px] tracking-[0.26em] uppercase font-normal">
                            MONITOR
                          </th>
                          <th className="px-3 md:px-5 py-3 text-left text-[#5f636a] text-[10px] tracking-[0.26em] uppercase font-normal">
                            STATUS
                          </th>
                          <th className="px-3 md:px-5 py-3 text-left text-[#5f636a] text-[10px] tracking-[0.26em] uppercase font-normal">
                            UPTIME
                          </th>
                          <th className="px-3 md:px-5 py-3 text-left text-[#5f636a] text-[10px] tracking-[0.26em] uppercase font-normal">
                            LATENCY
                          </th>
                          <th className="px-3 md:px-5 py-3 text-left text-[#5f636a] text-[10px] tracking-[0.26em] uppercase font-normal">
                            LAST_CHECK
                          </th>
                          <th className="px-3 md:px-5 py-3 text-left text-[#5f636a] text-[10px] tracking-[0.26em] uppercase font-normal">
                            ACTIONS
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from({ length: 8 }).map((_, i) => (
                          <MonitorRowSkeleton key={i} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : monitors.length === 0 ? (
                  <div className="py-14 text-center text-[#6f6f6f] text-[11px] tracking-[0.28em] uppercase">
                    NO_MONITORS_CONFIGURED
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <div className="min-w-[800px] divide-y divide-[#15171a]">
                        {paginatedMonitors.map((m: any) => (
                          <div key={m.id} className="relative">
                            <div className="flex items-center">
                              <div 
                                className="flex-1 cursor-pointer"
                                onClick={() => router.push(`/dashboard/monitors/${m.id}`)}
                              >
                                <MonitorRow monitor={m} onClick={() => {}} />
                              </div>
                              <div className="px-3 md:px-6">
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
                                  onMaintenanceToggle={(updatedMonitor) => updateMonitor(updatedMonitor)}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
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

            {/* BOTTOM GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mt-6 md:mt-8">
              <Panel>
                <div className="px-4 md:px-6 py-4 md:py-5 border-b border-[#15171a]">
                  <div className="text-[#d6d7da] text-[11px] md:text-[12px] tracking-[0.26em] uppercase">
                    SYSTEM_TOPOLOGY_MAP
                  </div>
                </div>
                <div className="p-4 md:p-6">
                  <WorldMap 
                    nodes={worldMapNodes} 
                    pings={worldMapPings} 
                    animate={true}
                  />
                </div>
              </Panel>

              <Panel>
                <div className="px-4 md:px-6 py-4 md:py-5 border-b border-[#15171a]">
                  <div className="text-[#d6d7da] text-[11px] md:text-[12px] tracking-[0.26em] uppercase">
                    ANNOTATION_LOGS
                  </div>
                </div>
                <div className="p-4 md:p-6 space-y-4 md:space-y-6">
                  <LogRow
                    time="14:02:11"
                    title="NODE_ALPHA_RECOVERY"
                    body="Automated script executed successfully on secondary cluster."
                    tone="ok"
                  />
                  <LogRow
                    time="13:58:44"
                    title="DB_LATENCY_SPIKE"
                    body="IO wait exceeded threshold of 200ms in region US-EAST."
                    tone="alert"
                  />
                  <LogRow
                    time="12:38:06"
                    title="SCHEDULED_BACKUP"
                    body="Daily snapshots completed for all 24 monitoring nodes."
                    tone="neutral"
                  />
                </div>
              </Panel>
            </div>
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

      {/* Bulk Export Modal */}
      <BulkExportModal
        isOpen={isBulkExportModalOpen}
        totalMonitors={monitors.length}
        onClose={() => setIsBulkExportModalOpen(false)}
      />
    </div>
  );
}
