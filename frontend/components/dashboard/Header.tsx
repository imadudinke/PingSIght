"use client";

import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils/ui";

function TopTab({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative pt-[2px] pb-[10px]",
        "text-[11px] tracking-[0.26em] uppercase",
        active ? "text-[#f2d48a]" : "text-[#6f6f6f] hover:text-[#d6d7da] transition"
      )}
    >
      {children}
      {active && (
        <span className="absolute left-0 right-0 -bottom-[1px] h-[2px] bg-[#f2d48a]" />
      )}
    </button>
  );
}

function IconButton({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className={cn(
        "h-9 w-9 grid place-items-center",
        "border border-[#2a2d31]",
        "bg-[rgba(255,255,255,0.02)]",
        "text-[#6f6f6f] hover:text-[#d6d7da] hover:border-[#3a3d42] transition"
      )}
    >
      <span className="text-[12px]">▦</span>
    </button>
  );
}

export function DashboardHeader({ userEmail }: { userEmail?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();

  const isLiveFeed = pathname === "/dashboard" || pathname === "/dashboard/home" || pathname?.startsWith("/dashboard/monitors") || pathname?.startsWith("/dashboard/heartbeats");
  const isLogs = pathname?.startsWith("/dashboard/logs");
  const isNodes = pathname?.startsWith("/dashboard/nodes");

  const showComingSoon = (feature: string) => {
    alert(`${feature} feature is coming soon! This will be available in a future update.`);
  };

  return (
    <header className="h-[64px] border-b border-[#1b1d20] bg-[rgba(10,10,11,0.25)] backdrop-blur-[2px] px-8 flex items-center justify-between">
      <div className="flex items-center gap-8">
        <div className="text-[#d6d7da] text-[14px] tracking-[0.12em] uppercase">
          OBSERVATORY_ALPHA_V1.0
        </div>
        <div className="hidden lg:flex items-center gap-7">
          <TopTab 
            active={isLiveFeed}
            onClick={() => router.push("/dashboard/home")}
          >
            LIVE_FEED
          </TopTab>
          <TopTab 
            active={isLogs}
            onClick={() => showComingSoon("System Logs")}
          >
            LOGS
          </TopTab>
          <TopTab 
            active={isNodes}
            onClick={() => showComingSoon("Node Management")}
          >
            NODES
          </TopTab>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden md:block">
          <input
            type="text"
            placeholder="QUERY_SYSTEM..."
            className={cn(
              "w-[260px] h-[34px] px-3",
              "bg-[rgba(0,0,0,0.28)]",
              "border border-[#2a2d31]",
              "text-[11px] tracking-[0.20em] uppercase",
              "placeholder:text-[#60646b]",
              "focus:outline-none focus:border-[#b9c7ff]"
            )}
            onFocus={() => showComingSoon("System Query")}
          />
        </div>
        <IconButton 
          label="Notifications" 
          onClick={() => showComingSoon("Notifications")}
        />
        <IconButton 
          label="Display" 
          onClick={() => showComingSoon("Display Settings")}
        />
        <button
          onClick={() => {
            if (confirm("Are you sure you want to logout?")) {
              logout();
              router.push("/");
            }
          }}
          className="h-9 w-9 rounded-sm border border-[#2a2d31] bg-[rgba(255,255,255,0.03)] grid place-items-center text-[12px] text-[#d6d7da] uppercase hover:border-[#3a3d42] hover:bg-[rgba(255,255,255,0.05)] transition"
          title="Click to logout"
        >
          {userEmail?.charAt(0).toUpperCase() || "U"}
        </button>
      </div>
    </header>
  );
}
