"use client";

import React, { useEffect, useMemo, useState } from "react";
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
import { CreateMonitorModal } from "@/components/monitors/CreateMonitorModal";

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();
  const { monitors, loading: loadingMonitors, refetch } = useMonitors();
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/");
  }, [isAuthenticated, isLoading, router]);

  // Calculate stats
  const stats = useMemo(() => {
    const simpleMonitors = monitors.filter((m: any) => m.monitor_type === "simple");
    const scenarioMonitors = monitors.filter((m: any) => m.monitor_type === "scenario");
    const heartbeatMonitors = monitors.filter((m: any) => m.monitor_type === "heartbeat");
    
    const upMonitors = monitors.filter((m: any) => (m.last_status ?? m.status) === "UP");
    const downMonitors = monitors.filter((m: any) => {
      const s = m.last_status ?? m.status;
      return s !== "UP" && s !== "PENDING";
    });
    
    const totalChecks = monitors.reduce((sum: number, m: any) => sum + (m.total_checks || 0), 0);
    
    // Calculate average uptime
    const avgUptime = monitors.length > 0
      ? monitors.reduce((sum: number, m: any) => sum + (m.uptime_percentage || 0), 0) / monitors.length
      : 0;

    return {
      total: monitors.length,
      simple: simpleMonitors.length,
      scenario: scenarioMonitors.length,
      heartbeat: heartbeatMonitors.length,
      up: upMonitors.length,
      down: downMonitors.length,
      totalChecks,
      avgUptime,
    };
  }, [monitors]);

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
            {/* Welcome Section */}
            <div className="mb-8">
              <div className="text-[#d6d7da] text-[18px] tracking-[0.18em] uppercase mb-2">
                WELCOME_TO_PINGSIGHT
              </div>
              <div className="text-[#6f6f6f] text-[11px] tracking-[0.10em] leading-relaxed max-w-3xl">
                Monitor your infrastructure with precision. Track uptime, latency, SSL certificates, and domain expiration.
                Get instant alerts when things go wrong.
              </div>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="TOTAL_MONITORS"
                value={String(stats.total).padStart(2, "0")}
                foot={`${stats.up} UP / ${stats.down} DOWN`}
                icon="gauge"
                valueClass="text-[#d6d7da]"
              />
              <StatCard
                title="SYSTEM_UPTIME"
                value={`${stats.avgUptime.toFixed(2)}%`}
                foot="AVERAGE_ACROSS_ALL"
                icon="timer"
                valueClass="text-[#f2d48a]"
              />
              <StatCard
                title="TOTAL_CHECKS"
                value={String(stats.totalChecks)}
                foot="LIFETIME_CHECKS"
                icon="gauge"
                valueClass="text-[#d6d7da]"
              />
              <StatCard
                title="ACTIVE_INCIDENTS"
                value={String(stats.down).padStart(2, "0")}
                foot=""
                icon="alert"
                valueClass="text-[#ff6a6a]"
                incidentDots={stats.down}
              />
            </div>

            {/* Monitor Types Breakdown */}
            <section className="mb-8">
              <div className="text-[#d6d7da] text-[14px] tracking-[0.18em] uppercase mb-3">
                MONITOR_TYPES_BREAKDOWN
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Simple Monitors */}
                <div className="cursor-pointer" onClick={() => router.push("/dashboard/monitors")}>
                  <Panel className="hover:border-[#3a3d42] transition">
                    <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-[#d6d7da] text-[12px] tracking-[0.26em] uppercase">
                        SIMPLE_MONITORS
                      </div>
                      <div className="h-10 w-10 border border-[#2a2d31] bg-[rgba(255,255,255,0.02)] grid place-items-center text-[#f2d48a]">
                        ∿
                      </div>
                    </div>
                    <div className="text-[#f2d48a] text-[36px] font-semibold mb-2">
                      {stats.simple}
                    </div>
                    <div className="text-[#6f6f6f] text-[10px] tracking-[0.22em] uppercase mb-4">
                      BASIC_HTTP_CHECKS
                    </div>
                    <div className="text-[#6f6f6f] text-[10px] leading-relaxed">
                      Monitor single endpoints with HTTP/HTTPS checks. Track uptime, latency, SSL certificates, and domain expiration.
                    </div>
                  </div>
                </Panel>
                </div>

                {/* Scenario Monitors */}
                <div className="cursor-pointer" onClick={() => router.push("/dashboard/monitors")}>
                  <Panel className="hover:border-[#3a3d42] transition">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-[#d6d7da] text-[12px] tracking-[0.26em] uppercase">
                        SCENARIO_MONITORS
                      </div>
                      <div className="h-10 w-10 border border-[#2a2d31] bg-[rgba(255,255,255,0.02)] grid place-items-center text-[#b9c7ff]">
                        ⚡
                      </div>
                    </div>
                    <div className="text-[#b9c7ff] text-[36px] font-semibold mb-2">
                      {stats.scenario}
                    </div>
                    <div className="text-[#6f6f6f] text-[10px] tracking-[0.22em] uppercase mb-4">
                      MULTI-STEP_WORKFLOWS
                    </div>
                    <div className="text-[#6f6f6f] text-[10px] leading-relaxed">
                      Test complex user journeys with up to 3 steps. Validate page content with keyword matching.
                    </div>
                  </div>
                </Panel>
                </div>

                {/* Heartbeat Monitors */}
                <div className="cursor-pointer" onClick={() => router.push("/dashboard/heartbeats")}>
                  <Panel className="hover:border-[#3a3d42] transition">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-[#d6d7da] text-[12px] tracking-[0.26em] uppercase">
                        HEARTBEAT_MONITORS
                      </div>
                      <div className="h-10 w-10 border border-[#2a2d31] bg-[rgba(255,255,255,0.02)] grid place-items-center text-[#ff6a6a]">
                        ♥
                      </div>
                    </div>
                    <div className="text-[#ff6a6a] text-[36px] font-semibold mb-2">
                      {stats.heartbeat}
                    </div>
                    <div className="text-[#6f6f6f] text-[10px] tracking-[0.22em] uppercase mb-4">
                      REVERSE_PING_MONITORING
                    </div>
                    <div className="text-[#6f6f6f] text-[10px] leading-relaxed">
                      "Silence is the alarm" - Monitor cron jobs, backups, and scheduled tasks. Alert when they stop pinging.
                    </div>
                  </div>
                </Panel>
                </div>
              </div>
            </section>

            {/* Quick Actions */}
            <section className="mb-8">
              <div className="text-[#d6d7da] text-[14px] tracking-[0.18em] uppercase mb-3">
                QUICK_ACTIONS
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Panel>
                  <div className="p-6">
                    <div className="text-[#d6d7da] text-[12px] tracking-[0.26em] uppercase mb-4">
                      CREATE_NEW_MONITOR
                    </div>
                    <div className="space-y-3">
                      <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="w-full h-[44px] bg-[#f2d48a] text-[#0b0c0e] font-mono text-[11px] font-bold tracking-[0.26em] uppercase hover:bg-[#d6d7da] transition-all flex items-center justify-center gap-2"
                      >
                        <span>+</span>
                        <span>NEW_MONITOR</span>
                      </button>
                      <div className="text-[#6f6f6f] text-[10px] leading-relaxed">
                        Set up monitoring for websites, APIs, or scheduled tasks in seconds.
                      </div>
                    </div>
                  </div>
                </Panel>

                <Panel>
                  <div className="p-6">
                    <div className="text-[#d6d7da] text-[12px] tracking-[0.26em] uppercase mb-4">
                      VIEW_ALL_MONITORS
                    </div>
                    <div className="space-y-3">
                      <button
                        onClick={() => router.push("/dashboard/monitors")}
                        className="w-full h-[44px] border border-[#2a2d31] bg-[rgba(255,255,255,0.02)] text-[#d6d7da] font-mono text-[11px] tracking-[0.26em] uppercase hover:border-[#3a3d42] hover:bg-[rgba(255,255,255,0.04)] transition-all"
                      >
                        VIEW_ALL_MONITORS →
                      </button>
                      <div className="text-[#6f6f6f] text-[10px] leading-relaxed">
                        See detailed status, uptime history, and performance metrics for all monitors.
                      </div>
                    </div>
                  </div>
                </Panel>
              </div>
            </section>

            {/* How It Works */}
            <section>
              <div className="text-[#d6d7da] text-[14px] tracking-[0.18em] uppercase mb-3">
                HOW_IT_WORKS
              </div>
              <Panel>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                      <div className="h-12 w-12 border border-[#2a2d31] bg-[rgba(255,255,255,0.02)] grid place-items-center text-[#f2d48a] text-[20px] mb-4">
                        1
                      </div>
                      <div className="text-[#d6d7da] text-[11px] tracking-[0.22em] uppercase mb-2">
                        CREATE_MONITOR
                      </div>
                      <div className="text-[#6f6f6f] text-[10px] leading-relaxed">
                        Add your website URL or create a heartbeat monitor. Configure check interval and alert settings.
                      </div>
                    </div>

                    <div>
                      <div className="h-12 w-12 border border-[#2a2d31] bg-[rgba(255,255,255,0.02)] grid place-items-center text-[#f2d48a] text-[20px] mb-4">
                        2
                      </div>
                      <div className="text-[#d6d7da] text-[11px] tracking-[0.22em] uppercase mb-2">
                        AUTOMATIC_CHECKS
                      </div>
                      <div className="text-[#6f6f6f] text-[10px] leading-relaxed">
                        PingSight checks your endpoints at your specified interval. Deep trace analysis captures DNS, TCP, TLS, and TTFB metrics.
                      </div>
                    </div>

                    <div>
                      <div className="h-12 w-12 border border-[#2a2d31] bg-[rgba(255,255,255,0.02)] grid place-items-center text-[#f2d48a] text-[20px] mb-4">
                        3
                      </div>
                      <div className="text-[#d6d7da] text-[11px] tracking-[0.22em] uppercase mb-2">
                        GET_ALERTED
                      </div>
                      <div className="text-[#6f6f6f] text-[10px] leading-relaxed">
                        Receive instant notifications when downtime is detected. View detailed incident logs and performance history.
                      </div>
                    </div>
                  </div>
                </div>
              </Panel>
            </section>
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
    </div>
  );
}
