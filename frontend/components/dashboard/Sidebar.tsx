import { cn, iconGlyph } from "@/lib/utils/ui";

function SidebarItem({
  active,
  icon,
  label,
}: {
  active?: boolean;
  icon: "home" | "pulse" | "heart" | "page" | "team" | "gear";
  label: string;
}) {
  return (
    <button
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

function SidebarMini({ icon, label }: { icon: "doc" | "help"; label: string }) {
  return (
    <button className="w-full h-[36px] px-4 flex items-center gap-3 text-[11px] tracking-[0.26em] uppercase text-[#6f6f6f] hover:text-[#d6d7da] transition">
      <span className="opacity-80">{icon === "doc" ? "▣" : "?"}</span>
      <span>{label}</span>
    </button>
  );
}

export function DashboardSidebar() {
  return (
    <aside className="w-[248px] border-r border-[#1b1d20] bg-[rgba(10,10,11,0.35)] backdrop-blur-[2px]">
      <div className="px-6 pt-6 pb-5">
        <div className="flex items-start gap-3">
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
        </div>
      </div>
      <nav className="px-3">
        <SidebarItem active icon="home" label="HOME" />
        <SidebarItem icon="pulse" label="MONITORS" />
        <SidebarItem icon="heart" label="HEARTBEATS" />
        <SidebarItem icon="page" label="STATUS_PAGES" />
        <SidebarItem icon="team" label="TEAM" />
        <SidebarItem icon="gear" label="SETTINGS" />
        <button
          className={cn(
            "mt-7 w-full h-[40px]",
            "bg-[#b9c7ff] text-[#0b0c0e]",
            "text-[11px] tracking-[0.26em] uppercase",
            "border border-[#c8d2ff]",
            "hover:brightness-95 transition"
          )}
        >
          NEW_SCAN
        </button>
      </nav>
      <div className="mt-auto px-3 pb-6 pt-8">
        <div className="border-t border-[#1b1d20] pt-4 space-y-2">
          <SidebarMini icon="doc" label="DOCS" />
          <SidebarMini icon="help" label="HELP" />
        </div>
      </div>
    </aside>
  );
}
