"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useMonitors } from "@/lib/hooks/useMonitors";
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

export default function Dashboard() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();
  const { monitors, loading: loadingMonitors } = useMonitors();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
        <DashboardSidebar />

        <div className="flex-1 flex flex-col">
          <DashboardHeader userEmail={user?.email} />

          <div className="flex-1 px-8 py-8 overflow-auto">
            {/* STATS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
            <section className="mt-8">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[#d6d7da] text-[14px] tracking-[0.18em] uppercase">
                  ACTIVE_MONITORS [N:{totalMonitors}]
                </div>
                <div className="flex items-center gap-6 text-[10px] tracking-[0.26em] uppercase">
                  <LegendDot label="OPERATIONAL" color="#f2d48a" />
                  <LegendDot label="DEGRADED" color="#ff6a6a" />
                </div>
              </div>
              <Panel className="overflow-hidden">
                {loadingMonitors ? (
                  <div className="py-14 text-center text-[#6f6f6f] text-[11px] tracking-[0.28em] uppercase">
                    LOADING_MONITORS...
                  </div>
                ) : monitors.length === 0 ? (
                  <div className="py-14 text-center text-[#6f6f6f] text-[11px] tracking-[0.28em] uppercase">
                    NO_MONITORS_CONFIGURED
                  </div>
                ) : (
                  <>
                    <div className="divide-y divide-[#15171a]">
                      {paginatedMonitors.map((m: any) => (
                        <MonitorRow 
                          key={m.id} 
                          monitor={m}
                          onClick={() => router.push(`/dashboard/monitors/${m.id}`)}
                        />
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

            {/* BOTTOM GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
              <Panel>
                <div className="px-6 py-5 border-b border-[#15171a]">
                  <div className="text-[#d6d7da] text-[12px] tracking-[0.26em] uppercase">
                    SYSTEM_TOPOLOGY_MAP
                  </div>
                </div>
                <div className="p-6">
                  <div className="h-[280px] border border-[#15171a] bg-[rgba(0,0,0,0.18)] flex items-center justify-center">
                    <div className="text-center">
                      <div className="mx-auto h-16 w-16 rounded-full border border-[#2a2d31] grid place-items-center">
                        <div className="h-6 w-6 rounded-full border border-[#6f6f6f]" />
                      </div>
                      <div className="mt-6 text-[10px] tracking-[0.26em] uppercase text-[#6f6f6f]">
                        GLOBAL_INFRASTRUCTURE_VISUALIZER_LOADING...
                      </div>
                    </div>
                  </div>
                </div>
              </Panel>

              <Panel>
                <div className="px-6 py-5 border-b border-[#15171a]">
                  <div className="text-[#d6d7da] text-[12px] tracking-[0.26em] uppercase">
                    ANNOTATION_LOGS
                  </div>
                </div>
                <div className="p-6 space-y-6">
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
    </div>
  );
}
