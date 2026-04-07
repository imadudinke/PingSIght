"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Panel } from "@/components/dashboard/Panel";
import { BackgroundLayers } from "@/components/dashboard/BackgroundLayers";
import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/Header";
import { DashboardFooter } from "@/components/dashboard/Footer";
import { CreateStatusPageModalEnhanced } from "@/components/status-pages/CreateStatusPageModalEnhanced";
import { StatusPageCard } from "@/components/status-pages/StatusPageCard";
import { StatusPageCardSkeleton } from "@/components/ui/Skeleton";

export default function StatusPagesPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [statusPages, setStatusPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchStatusPages();
    }
  }, [isAuthenticated]);

  const fetchStatusPages = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:8000/api/status-pages/", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setStatusPages(data);
      }
    } catch (error) {
      console.error("Failed to fetch status pages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this status page?")) return;

    try {
      const response = await fetch(`http://localhost:8000/api/status-pages/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        fetchStatusPages();
      }
    } catch (error) {
      console.error("Failed to delete status page:", error);
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

  return (
    <div className="min-h-screen text-[#b0b3b8] font-mono">
      <BackgroundLayers />

      <div className="flex min-h-screen">
        <DashboardSidebar onNewMonitor={() => router.push("/dashboard/monitors")} />

        <div className="flex-1 flex flex-col ml-[248px]">
          <DashboardHeader userEmail={user?.email} />

          <div className="flex-1 px-8 py-8 overflow-auto">
            <Panel className="p-0">
              <div className="px-6 py-5 border-b border-[#15171a]">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[#d6d7da] text-[14px] tracking-[0.18em] uppercase">
                      STATUS_PAGES
                    </div>
                    <div className="mt-1 text-[#6f6f6f] text-[11px] tracking-[0.10em]">
                      Public status pages for your services
                    </div>
                  </div>

                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="h-10 px-6 bg-[#f2d48a] text-[#0b0c0e] font-mono text-[10px] font-bold tracking-wider uppercase hover:bg-[#d6d7da] transition-all flex items-center gap-2"
                  >
                    <span>+</span>
                    <span>CREATE_STATUS_PAGE</span>
                  </button>
                </div>
              </div>

              <div className="p-6">
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <StatusPageCardSkeleton key={i} />
                    ))}
                  </div>
                ) : statusPages.length === 0 ? (
                  <div className="py-14 text-center">
                    <div className="text-[#6f6f6f] text-[11px] tracking-[0.28em] uppercase mb-4">
                      NO_STATUS_PAGES_YET
                    </div>
                    <div className="text-[#5f636a] text-[10px] tracking-[0.20em] mb-6">
                      Create your first status page to share service status with your users
                    </div>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="h-10 px-6 bg-[#f2d48a] text-[#0b0c0e] font-mono text-[10px] font-bold tracking-wider uppercase hover:bg-[#d6d7da] transition-all"
                    >
                      CREATE_YOUR_FIRST_STATUS_PAGE
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {statusPages.map((page) => (
                      <StatusPageCard
                        key={page.id}
                        statusPage={page}
                        onEdit={() => router.push(`/dashboard/status-pages/${page.id}`)}
                        onDelete={() => handleDelete(page.id)}
                        onView={() => window.open(`/status/${page.slug}`, "_blank")}
                      />
                    ))}
                  </div>
                )}
              </div>
            </Panel>
          </div>

          <DashboardFooter />
        </div>
      </div>

      {showCreateModal && (
        <CreateStatusPageModalEnhanced
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchStatusPages();
          }}
        />
      )}
    </div>
  );
}
