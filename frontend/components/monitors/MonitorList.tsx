import MonitorCard from './MonitorCard';

interface Monitor {
  id: string;
  url: string;
  friendly_name: string;
  interval_seconds: number;
  last_status: string;
  is_active: boolean;
  monitor_type: string;
  ssl_status?: string;
  ssl_days_remaining?: number;
  domain_days_remaining?: number;
  last_checked?: string;
}

interface MonitorListProps {
  monitors: Monitor[];
  loading?: boolean;
  onMonitorAction?: (monitor: Monitor) => void;
  onCreateMonitor?: () => void;
}

export default function MonitorList({ 
  monitors, 
  loading = false, 
  onMonitorAction,
  onCreateMonitor 
}: MonitorListProps) {
  const operationalCount = monitors.filter(m => m.last_status === 'UP').length;

  if (loading) {
    return (
      <div className="bg-[#151922] border border-[#1f2937] p-8 text-center">
        <div className="font-mono text-[10px] text-[#555] tracking-widest animate-pulse">
          LOADING_MONITORS...
        </div>
      </div>
    );
  }

  if (monitors.length === 0) {
    return (
      <div className="bg-[#151922] border border-[#1f2937] p-8 text-center">
        <div className="font-mono text-sm text-[#555] tracking-widest mb-4">
          NO_MONITORS_CONFIGURED
        </div>
        {onCreateMonitor && (
          <button 
            onClick={onCreateMonitor}
            className="bg-[#10b981] text-black font-mono text-xs font-bold px-6 py-3 tracking-widest hover:bg-[#059669] transition-all"
          >
            CREATE_FIRST_MONITOR
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-mono text-xs tracking-widest text-[#e0e0e0]">
          ACTIVE_MONITORS [N:{monitors.length}]
        </h3>
        <div className="flex gap-4 font-mono text-[10px] tracking-widest">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" style={{ boxShadow: '0 0 8px #10b981' }}></span>
            OPERATIONAL ({operationalCount})
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#ef4444] animate-pulse" style={{ boxShadow: '0 0 8px #ef4444' }}></span>
            DEGRADED ({monitors.length - operationalCount})
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {monitors.map((monitor) => (
          <MonitorCard 
            key={monitor.id} 
            monitor={monitor} 
            onAction={onMonitorAction}
          />
        ))}
      </div>
    </div>
  );
}
