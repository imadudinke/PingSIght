"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { cn, iconGlyph } from "@/lib/utils/ui";
import { AlertModal } from "@/components/ui/ConfirmModal";

function SidebarItem({
  active,
  icon,
  label,
  href,
  onClick,
  onItemClick,
}: {
  active?: boolean;
  icon: "home" | "pulse" | "heart" | "page" | "gear";
  label: string;
  href?: string;
  onClick?: () => void;
  onItemClick?: () => void;
}) {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (href) {
      router.push(href);
    }
    // Close mobile menu after navigation
    if (onItemClick) {
      onItemClick();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "w-full h-[46px] px-4 flex items-center gap-3",
        "text-[11px] tracking-[0.26em] uppercase",
        "transition-colors",
        active
          ? "bg-[rgba(255,255,255,0.045)] text-[#d6d7da]"
          : "text-[#6f6f6f] hover:text-[#d6d7da]"
      )}
    >
      <span
        className={cn(
          "mr-1 h-[28px] w-[2px] block",
          active ? "bg-[#f2d48a]" : "bg-transparent"
        )}
      />
      <span className="opacity-90">{iconGlyph(icon)}</span>
      <span>{label}</span>
    </button>
  );
}

function SidebarMini({ 
  icon, 
  label, 
  onClick 
}: { 
  icon: "doc" | "help"; 
  label: string;
  onClick?: () => void;
}) {
  return (
    <button 
      onClick={onClick}
      className="w-full h-[36px] px-4 flex items-center gap-3 text-[11px] tracking-[0.26em] uppercase text-[#6f6f6f] hover:text-[#d6d7da] transition"
    >
      <span className="opacity-80">{icon === "doc" ? "▣" : "?"}</span>
      <span>{label}</span>
    </button>
  );
}

export function DashboardSidebar({ 
  onNewMonitor,
  isOpen,
  onClose,
}: { 
  onNewMonitor?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [comingSoonAlert, setComingSoonAlert] = useState<string | null>(null);

  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && onClose) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when sidebar is open on mobile
      if (window.innerWidth < 1024) {
        document.body.style.overflow = "hidden";
      }
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      if (window.innerWidth < 1024) {
        document.body.style.overflow = "unset";
      }
    };
  }, [isOpen, onClose]);

  // Determine active page based on pathname
  const isHome = pathname === "/dashboard" || pathname === "/dashboard/home";
  const isMonitors = pathname?.startsWith("/dashboard/monitors");
  const isHeartbeats = pathname?.startsWith("/dashboard/heartbeats");
  const isStatusPages = pathname?.startsWith("/dashboard/status-pages");
  const isSettings = pathname?.startsWith("/dashboard/settings");

  const handleNewMonitor = () => {
    if (onNewMonitor) {
      onNewMonitor();
    } else {
      // If no callback provided, navigate to monitors page
      router.push("/dashboard/monitors");
    }
    // Close mobile menu
    if (onClose) {
      onClose();
    }
  };

  const showComingSoon = (feature: string) => {
    setComingSoonAlert(feature);
  };

  const handleItemClick = () => {
    // Close mobile menu when item is clicked
    if (onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Overlay - Click to close */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={(e) => {
            e.stopPropagation();
            onClose?.();
          }}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed left-0 top-0 bottom-0 w-[280px] sm:w-[320px]",
          "border-r border-[#1b1d20] bg-[rgba(10,10,11,0.98)] backdrop-blur-md",
          "flex flex-col transition-transform duration-300 ease-in-out",
          // Desktop: always visible
          "lg:w-[248px] lg:translate-x-0 lg:z-30",
          // Mobile: slide in/out with higher z-index
          isOpen ? "translate-x-0 z-50" : "-translate-x-full z-50"
        )}
        aria-label="Sidebar navigation"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button for mobile */}
        <button
          onClick={onClose}
          className="lg:hidden absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-[#6f6f6f] hover:text-[#d6d7da] hover:bg-[rgba(255,255,255,0.05)] rounded transition z-10"
          aria-label="Close menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="px-6 pt-6 pb-5">
          <button 
            onClick={() => {
              router.push("/dashboard/home");
              handleItemClick();
            }}
            className="flex items-start gap-3 hover:opacity-80 transition"
          >
            <div className="h-9 w-9 border border-[#2a2d31] bg-[rgba(255,255,255,0.03)] grid place-items-center flex-shrink-0">
              <div className="h-4 w-4 bg-[#b9c7ff]" />
            </div>
            <div>
              <div className="text-[#d6d7da] text-[14px] tracking-[0.08em] uppercase">
                PINGSIGHT
              </div>
              <div className="text-[#6f6f6f] text-[10px] tracking-[0.24em] mt-0.5 uppercase">
                TERMINAL-01
              </div>
            </div>
          </button>
        </div>
        <nav className="px-3 flex-1 overflow-y-auto">
          <SidebarItem 
            active={isHome} 
            icon="home" 
            label="HOME" 
            href="/dashboard/home"
            onItemClick={handleItemClick}
          />
          <SidebarItem 
            active={isMonitors} 
            icon="pulse" 
            label="MONITORS" 
            href="/dashboard/monitors"
            onItemClick={handleItemClick}
          />
          <SidebarItem 
            active={isHeartbeats} 
            icon="heart" 
            label="HEARTBEATS" 
            href="/dashboard/heartbeats"
            onItemClick={handleItemClick}
          />
          <SidebarItem 
            active={isStatusPages} 
            icon="page" 
            label="STATUS_PAGES" 
            href="/dashboard/status-pages"
            onItemClick={handleItemClick}
          />
          <SidebarItem 
            active={isSettings} 
            icon="gear" 
            label="NOTIFICATIONS" 
            href="/dashboard/settings"
            onItemClick={handleItemClick}
          />
          <button
            onClick={handleNewMonitor}
            className={cn(
              "mt-7 w-full h-[40px]",
              "bg-[#b9c7ff] text-[#0b0c0e]",
              "text-[11px] tracking-[0.26em] uppercase font-medium",
              "border border-[#c8d2ff]",
              "hover:brightness-95 active:scale-[0.98] transition-all"
            )}
          >
            NEW_MONITOR
          </button>
        </nav>
        <div className="px-3 pb-6 pt-8">
          <div className="border-t border-[#1b1d20] pt-4 space-y-2">
            <SidebarMini 
              icon="doc" 
              label="DOCS" 
              onClick={() => {
                window.open("https://github.com/yourusername/pingsight", "_blank");
                handleItemClick();
              }}
            />
            <SidebarMini 
              icon="help" 
              label="HELP" 
              onClick={() => {
                showComingSoon("Help & Support");
                handleItemClick();
              }}
            />
          </div>
        </div>
      </aside>

      <AlertModal
        isOpen={!!comingSoonAlert}
        onClose={() => setComingSoonAlert(null)}
        title="COMING_SOON"
        message={`${comingSoonAlert} feature will be available in a future update. Stay tuned!`}
        variant="info"
      />
    </>
  );
}
