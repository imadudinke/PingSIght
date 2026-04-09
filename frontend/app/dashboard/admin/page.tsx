"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils/ui";
import { BackgroundLayers } from "@/components/dashboard/BackgroundLayers";
import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/Header";
import { DashboardFooter } from "@/components/dashboard/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { AdminStats } from "@/components/admin/AdminStats";
import { UserManagement } from "@/components/admin/UserManagement";
import { AdminManagement } from "@/components/admin/AdminManagement";
import { BlockedEmails } from "@/components/admin/BlockedEmails";

type SectionId = "users" | "admins" | "blocked" | "logs";

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const [activeSection, setActiveSection] = useState<SectionId>("users");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && (!user || !user.is_admin)) {
      router.replace("/dashboard/home");
    }
  }, [user, isLoading, router]);

  // Responsive: close sidebar when switching tabs on small screens
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    // if user changes tabs, keep UI clean on mobile
    // (only affects mobile because sidebar uses overlay)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection]);

  if (!isLoading && !user?.is_admin) return null;

  const sections = useMemo(
    () =>
      [
        { id: "users", label: "USERS", icon: "👥" },
        { id: "admins", label: "ADMINS", icon: "🛡" },
        { id: "blocked", label: "BLOCKED", icon: "⊗" },
        { id: "logs", label: "LOGS", icon: "▣" },
      ] as const,
    [],
  );

  return (
    <div className="min-h-screen text-[#b0b3b8] font-mono">
      <BackgroundLayers />

      <div className="flex min-h-screen">
        <DashboardSidebar
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />

        <div className="flex-1 flex flex-col lg:ml-[248px] min-w-0">
          <DashboardHeader
            userEmail={user?.email}
            onMenuClick={() => setIsMobileMenuOpen(true)}
          />

          <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 overflow-auto min-w-0">
            {isLoading ? (
              <div className="flex min-h-[40vh] items-center justify-center">
                <div className="font-mono text-[#6b6f76] tracking-[0.28em] animate-pulse text-[11px] uppercase">
                  LOADING_ADMIN_SYSTEM...
                </div>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="mb-6 sm:mb-8">
                  <div className="text-[#d6d7da] text-[15px] sm:text-[18px] tracking-[0.18em] uppercase mb-2 flex items-center gap-3">
                    <span className="text-[#f2d48a]">🛡</span>
                    <span className="break-words">ADMIN_CONTROL_PANEL</span>
                  </div>
                  <div className="text-[#6f6f6f] text-[10px] sm:text-[11px] tracking-[0.10em] leading-relaxed max-w-3xl">
                    SYSTEM_OVERVIEW // PRD-ALPHA-01 //
                    ELEVATED_PRIVILEGES_ACTIVE
                  </div>
                </div>

                {/* Stats */}
                <AdminStats />

                {/* Navigation Tabs (responsive, scrollable, good touch targets) */}
                <div className="mt-6 mb-6">
                  <div className="flex gap-2 overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch]">
                    {sections.map((section) => {
                      const active = activeSection === section.id;
                      return (
                        <button
                          key={section.id}
                          onClick={() => setActiveSection(section.id)}
                          type="button"
                          className={cn(
                            "h-9 px-3 sm:px-4",
                            "text-[10px] sm:text-[11px] tracking-[0.26em] uppercase whitespace-nowrap",
                            "border transition-colors",
                            "flex items-center gap-2",
                            active
                              ? "bg-[rgba(242,212,138,0.10)] border-[#f2d48a] text-[#f2d48a]"
                              : "border-[#1b1d20] text-[#6f6f6f] hover:border-[#2a2d31] hover:text-[#d6d7da]",
                          )}
                        >
                          <span aria-hidden>{section.icon}</span>
                          <span>{section.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Content Area */}
                <div className="min-w-0">
                  {activeSection === "users" && <UserManagement />}
                  {activeSection === "admins" && <AdminManagement />}
                  {activeSection === "blocked" && <BlockedEmails />}
                  {activeSection === "logs" && (
                    <div className="text-[#6f6f6f] text-[11px] tracking-[0.22em] uppercase">
                      FEATURE_PENDING_IMPLEMENTATION
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <DashboardFooter />
        </div>
      </div>
    </div>
  );
}
