"use client";

interface DashboardHeaderProps {
  title?: string;
  tabs?: string[];
  activeTab?: string;
}

export default function DashboardHeader({ 
  title = "OBSERVATORY_ALPHA_V1.0", 
  tabs = ["LIVE_FEED", "LOGS", "NODES"],
  activeTab = "LIVE_FEED"
}: DashboardHeaderProps) {
  return (
    <header className="bg-[#0B0E14] border-b border-[#1f2937] px-8 py-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-[#e0e0e0] font-mono text-sm tracking-widest">{title}</h2>
          <div className="flex gap-6 mt-1 font-mono text-[10px] tracking-widest">
            {tabs.map((tab) => (
              <span 
                key={tab}
                className={tab === activeTab ? "text-[#10b981]" : "text-[#555] cursor-pointer hover:text-[#888]"}
              >
                {tab}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <input 
            type="text" 
            placeholder="QUERY_SYSTEM..." 
            className="bg-[#151922] border border-[#1f2937] text-[#e0e0e0] font-mono text-xs px-4 py-2 w-64 focus:outline-none focus:border-[#10b981] transition-colors"
          />
          <button className="w-8 h-8 bg-[#151922] border border-[#1f2937] flex items-center justify-center text-[#888] hover:text-[#10b981] transition-colors">
            🔔
          </button>
          <button className="w-8 h-8 bg-[#151922] border border-[#1f2937] flex items-center justify-center text-[#888] hover:text-[#10b981] transition-colors">
            👤
          </button>
        </div>
      </div>
    </header>
  );
}
