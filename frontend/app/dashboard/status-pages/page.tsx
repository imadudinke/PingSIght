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
import { StatusPageCardSkeleton } from "@/components/ui/skeleton";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { listStatusPagesApiStatusPagesGet, deleteStatusPageApiStatusPagesStatusPageIdDelete } from "@/lib/api/sdk.gen";

export default function StatusPagesPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [statusPages, setStatusPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

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
      const response = await listStatusPagesApiStatusPagesGet();

      // Handle both SDK response styles (`fields` and `data`) plus network failures.
      if (Array.isArray(response)) {
        setStatusPages(response);
        return;
      }

      if (response?.response?.ok && Array.isArray(response.data)) {
        setStatusPages(response.data);
        return;
      }

      if (response?.error) {
        console.error("Failed to fetch status pages:", response.error);
        return;
      }

      console.error(
        "Failed to fetch status pages:",
        response?.response?.status ?? "unknown_error"
      );
    } catch (error) {
      console.error("Failed to fetch status pages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id: string, name: string) => {
    setDeleteConfirm({ id, name });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;

    try {
      const response = await deleteStatusPageApiStatusPagesStatusPageIdDelete({
        path: { status_page_id: deleteConfirm.id }
      });

      if (response?.response?.ok) {
        fetchStatusPages();
      } else if (response?.error) {
        console.error("Failed to delete status page:", response.error);
      } else {
        console.error(
          "Failed to delete status page:",
          response?.response?.status ?? "unknown_error"
        );
      }
    } catch (error) {
      console.error("Failed to delete status page:", error);
    } finally {
      setDeleteConfirm(null);
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
        <DashboardSidebar 
          onNewMonitor={() => router.push("/dashboard/monitors")}
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />

        <div className="flex-1 flex flex-col lg:ml-[248px]">
          <DashboardHeader 
            userEmail={user?.email}
            onMenuClick={() => setIsMobileMenuOpen(true)}
          />

          <div className="flex-1 px-4 md:px-6 lg:px-8 py-6 md:py-8 overflow-auto">
            <Panel className="p-0">
              <div className="px-4 md:px-6 py-4 md:py-5 border-b border-[#15171a]">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="text-[#d6d7da] text-[12px] md:text-[14px] tracking-[0.18em] uppercase">
                      STATUS_PAGES
                    </div>
                    <div className="mt-1 text-[#6f6f6f] text-[10px] md:text-[11px] tracking-[0.10em]">
                      Public status pages for your services
                    </div>
                  </div>

                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="h-10 px-4 md:px-6 bg-[#f2d48a] text-[#0b0c0e] font-mono text-[10px] font-bold tracking-wider uppercase hover:bg-[#d6d7da] transition-all flex items-center gap-2 whitespace-nowrap"
                  >
                    <span>+</span>
                    <span className="hidden sm:inline">CREATE_STATUS_PAGE</span>
                    <span className="sm:hidden">CREATE</span>
                  </button>
                </div>
              </div>

              <div className="p-4 md:p-6">
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
                        onDelete={() => handleDeleteClick(page.id, page.name)}
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

      <ConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDeleteConfirm}
        title="DELETE_STATUS_PAGE"
        message={`Are you sure you want to delete "${deleteConfirm?.name}"? This action cannot be undone and the public status page will no longer be accessible.`}
        confirmText="DELETE"
        cancelText="CANCEL"
        variant="danger"
      />
    </div>
  );
}
