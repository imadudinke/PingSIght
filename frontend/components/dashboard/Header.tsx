import { cn } from "@/lib/utils/ui";

function TopTab({
  active,
  children,
}: {
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
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

function IconButton({ label }: { label: string }) {
  return (
    <button
      aria-label={label}
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
  return (
    <header className="h-[64px] border-b border-[#1b1d20] bg-[rgba(10,10,11,0.25)] backdrop-blur-[2px] px-8 flex items-center justify-between">
      <div className="flex items-center gap-8">
        <div className="text-[#d6d7da] text-[14px] tracking-[0.12em] uppercase">
          OBSERVATORY_ALPHA_V1.0
        </div>
        <div className="hidden lg:flex items-center gap-7">
          <TopTab active>LIVE_FEED</TopTab>
          <TopTab>LOGS</TopTab>
          <TopTab>NODES</TopTab>
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
          />
        </div>
        <IconButton label="Notifications" />
        <IconButton label="Display" />
        <div className="h-9 w-9 rounded-sm border border-[#2a2d31] bg-[rgba(255,255,255,0.03)] grid place-items-center text-[12px] text-[#d6d7da] uppercase">
          {userEmail?.charAt(0).toUpperCase() || "U"}
        </div>
      </div>
    </header>
  );
}
