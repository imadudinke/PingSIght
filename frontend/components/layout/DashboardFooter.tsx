export default function DashboardFooter() {
  return (
    <footer className="bg-[#0B0E14] border-t border-[#1f2937] px-8 py-3 flex justify-between items-center font-mono text-[8px] tracking-widest text-[#555]">
      <div>© 2024 PINGSIGHT_SYSTEMS // V2.0.4_GRAPHITE // ALL_PROTOCOLS_RESERVED</div>
      <div className="flex gap-6">
        <span>LIVE_API <span className="text-[#10b981]">34ms (STABLE)</span></span>
        <span>LATENCY_AVG <span className="text-[#f59e0b]">44ms</span></span>
        <span>UPTIME_30D <span className="text-[#10b981]">99.98%</span></span>
      </div>
    </footer>
  );
}
