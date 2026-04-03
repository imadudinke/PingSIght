import { FooterDot } from "./LegendDot";

export function DashboardFooter() {
  return (
    <footer className="h-[44px] border-t border-[#1b1d20] bg-[rgba(10,10,11,0.25)] backdrop-blur-[2px] px-8 flex items-center justify-between">
      <div className="text-[#5f636a] text-[10px] tracking-[0.26em] uppercase">
        © 2024 PINGSIGHT_SYSTEMS [REF: 44.02-B]
      </div>
      <div className="flex items-center gap-6 text-[10px] tracking-[0.26em] uppercase">
        <FooterDot color="#b9c7ff" label="NODE_A1" />
        <FooterDot color="#f2d48a" label="LATENCY_0MS" />
        <FooterDot color="#d6d7da" label="UPTIME_99.9" />
      </div>
    </footer>
  );
}
