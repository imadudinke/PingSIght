"use client";

import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';

interface SidebarProps {
  onNewMonitor?: () => void;
}

export default function Sidebar({ onNewMonitor }: SidebarProps) {
  const { user, logout } = useAuth();

  return (
    <aside className="w-48 bg-[#0B0E14] border-r border-[#1f2937] flex flex-col p-4">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-[#a5b9ff] flex items-center justify-center font-mono text-black text-xs font-bold">
            PS
          </div>
          <div>
            <h1 className="text-[#e0e0e0] font-semibold text-sm tracking-wider">PINGSIGHT</h1>
            <p className="font-mono text-[8px] text-[#555] tracking-widest">DASHBOARD_V2</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 font-mono text-[10px] tracking-widest">
        <div className="flex items-center gap-3 py-3 px-3 bg-[#151922] border-l-2 border-[#10b981] text-[#e0e0e0]">
          <span>⌂</span> HOME
        </div>
        <div className="flex items-center gap-3 py-3 px-3 text-[#666] hover:text-[#e0e0e0] hover:bg-[#151922] transition-all cursor-pointer">
          <span>◈</span> MONITORS
        </div>
        <div className="flex items-center gap-3 py-3 px-3 text-[#666] hover:text-[#e0e0e0] hover:bg-[#151922] transition-all cursor-pointer">
          <span>♥</span> HEARTBEATS
        </div>
        <div className="flex items-center gap-3 py-3 px-3 text-[#666] hover:text-[#e0e0e0] hover:bg-[#151922] transition-all cursor-pointer">
          <span>◫</span> STATUS
        </div>
        <div className="flex items-center gap-3 py-3 px-3 text-[#666] hover:text-[#e0e0e0] hover:bg-[#151922] transition-all cursor-pointer">
          <span>⚙</span> SETTINGS
        </div>
      </nav>

      {onNewMonitor && (
        <Button
          onClick={onNewMonitor}
          variant="primary"
          size="sm"
          className="w-full mb-4 bg-[#10b981] hover:bg-[#059669]"
        >
          NEW_MONITOR
        </Button>
      )}

      <div className="pt-4 border-t border-[#1f2937]">
        <div className="font-mono text-[8px] text-[#555] mb-2 truncate">{user?.email}</div>
        <button 
          onClick={logout}
          className="font-mono text-[8px] text-[#ef4444] hover:text-[#dc2626] tracking-widest"
        >
          LOGOUT
        </button>
      </div>
    </aside>
  );
}
