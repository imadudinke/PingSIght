"use client";

import { useRouter, usePathname } from "next/navigation";
import { cn, iconGlyph } from "@/lib/utils/ui";

function SidebarItem({
  active,
  icon,
  label,
  href,
  onClick,
}: {
  active?: boolean;
  icon: "home" | "pulse" | "heart" | "page" | "gear";
  label: string;
  href?: string;
  onClick?: () => void;
}) {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (href) {
      router.push(href);
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

export function DashboardSidebar({ onNewMonitor }: { onNewMonitor?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  // Determine active page based on pathname
  const isHome = pathname === "/dashboard" || pathname === "/dashboard/home";
  const isMonitors = pathname?.startsWith("/dashboard/monitors") && !pathname?.includes("/dashboard/monitors/");
  const isHeartbeats = pathname?.startsWith("/dashboard/heartbeats");
  const isStatusPages = pathname?.startsWith("/dashboard/status-pages");
  const isSettings = pathname?.startsWith("/dashboard/settings");
  const isMonitorDetail = pathname?.includes("/dashboard/monitors/") && pathname !== "/dashboard/monitors";

  const handleNewMonitor = () => {
    if (onNewMonitor) {
      onNewMonitor();
    } else {
      // If no callback provided, navigate to monitors page
      router.push("/dashboard/monitors");
    }
  };

  const showComingSoon = (feature: string) => {
    alert(`${feature} feature is coming soon! This will be available in a future update.`);
  };

  return (
    <aside className="w-[248px] border-r border-[#1b1d20] bg-[rgba(10,10,11,0.35)] backdrop-blur-[2px] flex flex-col">
      <div className="px-6 pt-6 pb-5">
        <button 
          onClick={() => router.push("/dashboard/home")}
          className="flex items-start gap-3 hover:opacity-80 transition"
        >
          <div className="h-9 w-9 border border-[#2a2d31] bg-[rgba(255,255,255,0.03)] grid place-items-center">
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
      <nav className="px-3">
        <SidebarItem 
          active={isHome} 
          icon="home" 
          label="HOME" 
          href="/dashboard/home"
        />
        <SidebarItem 
          active={isMonitors || isMonitorDetail} 
          icon="pulse" 
          label="MONITORS" 
          href="/dashboard/monitors"
        />
        <SidebarItem 
          active={isHeartbeats} 
          icon="heart" 
          label="HEARTBEATS" 
          href="/dashboard/heartbeats"
        />
        <SidebarItem 
          active={isStatusPages} 
          icon="page" 
          label="STATUS_PAGES" 
          onClick={() => showComingSoon("Public Status Pages")}
        />
        <SidebarItem 
          active={isSettings} 
          icon="gear" 
          label="SETTINGS" 
          onClick={() => showComingSoon("Settings")}
        />
        <button
          onClick={handleNewMonitor}
          className={cn(
            "mt-7 w-full h-[40px]",
            "bg-[#b9c7ff] text-[#0b0c0e]",
            "text-[11px] tracking-[0.26em] uppercase",
            "border border-[#c8d2ff]",
            "hover:brightness-95 transition"
          )}
        >
          NEW_MONITOR
        </button>
      </nav>
      <div className="mt-auto px-3 pb-6 pt-8">
        <div className="border-t border-[#1b1d20] pt-4 space-y-2">
          <SidebarMini 
            icon="doc" 
            label="DOCS" 
            onClick={() => window.open("https://github.com/yourusername/pingsight", "_blank")}
          />
          <SidebarMini 
            icon="help" 
            label="HELP" 
            onClick={() => showComingSoon("Help & Support")}
          />
        </div>
      </div>
    </aside>
  );
}
