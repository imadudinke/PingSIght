"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Panel } from "@/components/dashboard/Panel";
import { BackgroundLayers } from "@/components/dashboard/BackgroundLayers";
import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/Header";
import { DashboardFooter } from "@/components/dashboard/Footer";
import { EditStatusPageModal } from "@/components/status-pages/EditStatusPageModal";
import { ComponentList } from "@/components/status-pages/ComponentList";
import { IncidentList } from "@/components/status-pages/IncidentList";
import { MaintenanceList } from "@/components/status-pages/MaintenanceList";
import { cn } from "@/lib/utils/ui";

type TabType = "overview" | "components" | "incidents" | "maintenances";

export default function StatusPageDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, isLoading, user } = useAuth();
  const statusPageId = params?.id as string;

  const [statusPage, setStatusPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated && statusPageId) {
      fetchStatusPage();
    }
  }, [isAuthenticated, statusPageId]);

  const fetchStatusPage = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:8000/api/status-pages/${statusPageId}`,
        {
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        setStatusPage(data);
      } else if (response.status === 404) {
        router.push("/dashboard/status-pages");
      }
    } catch (error) {
      console.error("Failed to fetch status page:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyPublicUrl = () => {
    if (statusPage) {
      const url = `${window.location.origin}/status/${statusPage.slug}`;
      navigator.clipboard.writeText(url);
      alert("Public URL copied to clipboard!");
    }
  };

  const openPublicPage = () => {
    if (statusPage) {
      window.open(`/status/${statusPage.slug}`, "_blank");
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0c0e] flex items-center justify-center">
        <div className="font-mono text-[#6b6f76] tracking-[0.28em] animate-pulse text-[11px] uppercase">
          LOADING_STATUS_PAGE...
        </div>
      </div>
    );
  }

  if (!statusPage) {
    return (
      <div className="min-h-screen bg-[#0b0c0e] flex items-center justify-center">
        <div className="text-center">
          <div className="font-mono text-[#ff6a6a] tracking-[0.28em] text-[11px] uppercase mb-4">
            STATUS_PAGE_NOT_FOUND
          </div>
          <button
            onClick={() => router.push("/dashboard/status-pages")}
            className="h-10 px-6 bg-[#f2d48a] text-[#0b0c0e] font-mono text-[10px] font-bold tracking-wider uppercase hover:bg-[#d6d7da] transition-all"
          >
            BACK_TO_STATUS_PAGES
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-[#b0b3b8] font-mono">
      <BackgroundLayers />

      <div className="flex min-h-screen">
        <DashboardSidebar onNewMonitor={() => router.push("/dashboard/monitors")} />

        <div className="flex-1 flex flex-col ml-[248px]">
          <DashboardHeader userEmail={user?.email} />

          <div className="flex-1 px-8 py-8 overflow-auto">
            {/* Back Button */}
            <button
              onClick={() => router.push("/dashboard/status-pages")}
              className={cn(
                "mb-6 h-10 px-4 flex items-center gap-2",
                "border border-[#2a2d31] bg-[rgba(255,255,255,0.02)]",
                "text-[#a9acb2] hover:text-[#d6d7da] hover:border-[#3a3d42] transition",
                "text-[11px] tracking-[0.26em] uppercase"
              )}
            >
              <span>‹</span>
              <span>BACK_TO_STATUS_PAGES</span>
            </button>

            <Panel className="p-0">
              {/* Header */}
              <div className="px-6 py-5 border-b border-[#15171a]">
                <div className="flex items-start justify-between gap-8">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <div className="text-[#d6d7da] text-[14px] tracking-[0.18em] uppercase">
                        {statusPage.name}
                      </div>
                      {statusPage.is_public && (
                        <div className="px-2 py-1 bg-[#10b981]/10 border border-[#10b981]/30 text-[#10b981] text-[9px] tracking-wider uppercase">
                          PUBLIC
                        </div>
                      )}
                    </div>
                    {statusPage.description && (
                      <div className="text-[#6f6f6f] text-[11px] tracking-[0.10em]">
                        {statusPage.description}
                      </div>
                    )}
                    <div className="mt-3 flex items-center gap-4 text-[10px]">
                      <div className="flex items-center gap-2">
                        <span className="text-[#5f636a] tracking-[0.22em] uppercase">SLUG:</span>
                        <span className="text-[#d6d7da] font-mono">{statusPage.slug}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[#5f636a] tracking-[0.22em] uppercase">URL:</span>
                        <button
                          onClick={copyPublicUrl}
                          className="text-[#f2d48a] hover:text-[#d6d7da] transition-colors font-mono flex items-center gap-1"
                          title="Click to copy"
                        >
                          <span>/status/{statusPage.slug}</span>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={openPublicPage}
                      className="h-10 px-4 border border-[#2a2d31] bg-[rgba(255,255,255,0.02)] text-[#a9acb2] hover:text-[#d6d7da] hover:border-[#3a3d42] transition text-[10px] tracking-[0.26em] uppercase"
                    >
                      VIEW_PUBLIC_PAGE
                    </button>
                    <button
                      onClick={() => setShowEditModal(true)}
                      className="h-10 px-6 bg-[#f2d48a] text-[#0b0c0e] font-mono text-[10px] font-bold tracking-wider uppercase hover:bg-[#d6d7da] transition-all"
                    >
                      EDIT_SETTINGS
                    </button>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b border-[#15171a] px-6">
                <div className="flex gap-1">
                  {[
                    { key: "overview", label: "OVERVIEW" },
                    { key: "components", label: "COMPONENTS" },
                    { key: "incidents", label: "INCIDENTS" },
                    { key: "maintenances", label: "MAINTENANCES" },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key as TabType)}
                      className={cn(
                        "px-6 py-4 text-[10px] tracking-[0.26em] uppercase transition",
                        "border-b-2",
                        activeTab === tab.key
                          ? "border-[#f2d48a] text-[#f2d48a]"
                          : "border-transparent text-[#6f6f6f] hover:text-[#d6d7da]"
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === "overview" && (
                  <div className="space-y-6">
                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="border border-[#2a2d31] bg-[rgba(255,255,255,0.02)] p-4">
                        <div className="text-[#5f636a] text-[10px] tracking-[0.26em] uppercase mb-2">
                          COMPONENTS
                        </div>
                        <div className="text-[#d6d7da] text-[24px] font-semibold">0</div>
                      </div>
                      <div className="border border-[#2a2d31] bg-[rgba(255,255,255,0.02)] p-4">
                        <div className="text-[#5f636a] text-[10px] tracking-[0.26em] uppercase mb-2">
                          ACTIVE_INCIDENTS
                        </div>
                        <div className="text-[#d6d7da] text-[24px] font-semibold">0</div>
                      </div>
                      <div className="border border-[#2a2d31] bg-[rgba(255,255,255,0.02)] p-4">
                        <div className="text-[#5f636a] text-[10px] tracking-[0.26em] uppercase mb-2">
                          SCHEDULED_MAINTENANCES
                        </div>
                        <div className="text-[#d6d7da] text-[24px] font-semibold">0</div>
                      </div>
                      <div className="border border-[#2a2d31] bg-[rgba(255,255,255,0.02)] p-4">
                        <div className="text-[#5f636a] text-[10px] tracking-[0.26em] uppercase mb-2">
                          SUBSCRIBERS
                        </div>
                        <div className="text-[#d6d7da] text-[24px] font-semibold">0</div>
                      </div>
                    </div>

                    {/* Settings Summary */}
                    <div className="border border-[#2a2d31] bg-[rgba(255,255,255,0.02)] p-5">
                      <div className="text-[#d6d7da] text-[12px] tracking-[0.26em] uppercase mb-4">
                        SETTINGS
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px]">
                        <div>
                          <span className="text-[#5f636a] tracking-[0.22em] uppercase">VISIBILITY:</span>
                          <span className="ml-2 text-[#d6d7da]">
                            {statusPage.is_public ? "Public" : "Private"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#5f636a] tracking-[0.22em] uppercase">SHOW_UPTIME:</span>
                          <span className="ml-2 text-[#d6d7da]">
                            {statusPage.show_uptime ? "Yes" : "No"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#5f636a] tracking-[0.22em] uppercase">SHOW_INCIDENTS:</span>
                          <span className="ml-2 text-[#d6d7da]">
                            {statusPage.show_incident_history ? "Yes" : "No"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#5f636a] tracking-[0.22em] uppercase">PRIMARY_COLOR:</span>
                          <span className="ml-2 text-[#d6d7da] flex items-center gap-2">
                            <span
                              className="w-4 h-4 border border-[#2a2d31]"
                              style={{ backgroundColor: statusPage.branding_primary_color || "#10b981" }}
                            />
                            {statusPage.branding_primary_color || "#10b981"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Getting Started */}
                    <div className="border border-[#f2d48a]/30 bg-[#f2d48a]/5 p-5">
                      <div className="text-[#f2d48a] text-[12px] tracking-[0.26em] uppercase mb-3 font-bold">
                        GETTING_STARTED
                      </div>
                      <div className="space-y-2 text-[11px] text-[#d6d7da] leading-relaxed">
                        <p>1. Create components to group your monitors</p>
                        <p>2. Add monitors to components</p>
                        <p>3. Create incidents when issues occur</p>
                        <p>4. Schedule maintenance windows</p>
                        <p>5. Share the public URL with your users</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "components" && (
                  <ComponentList statusPageId={statusPageId} />
                )}

                {activeTab === "incidents" && (
                  <IncidentList statusPageId={statusPageId} />
                )}

                {activeTab === "maintenances" && (
                  <MaintenanceList statusPageId={statusPageId} />
                )}
              </div>
            </Panel>
          </div>

          <DashboardFooter />
        </div>
      </div>

      {showEditModal && (
        <EditStatusPageModal
          statusPage={statusPage}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false);
            fetchStatusPage();
          }}
        />
      )}
    </div>
  );
}
