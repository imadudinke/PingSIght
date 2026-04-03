import Card from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';

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

interface MonitorCardProps {
  monitor: Monitor;
  onAction?: (monitor: Monitor) => void;
}

export default function MonitorCard({ monitor, onAction }: MonitorCardProps) {
  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'UP': return '#10b981';
      case 'DOWN': return '#ef4444';
      case 'ISSUE': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  return (
    <Card borderColor={getStatusColor(monitor.last_status)} className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-2">
            <h4 className="font-mono text-sm tracking-wider text-[#e0e0e0]">
              {monitor.friendly_name}
            </h4>
            <StatusBadge status={monitor.last_status} showLed={monitor.last_status === 'UP'} />
            <span className="font-mono text-[10px] px-2 py-1 bg-[#0B0E14] text-[#555]">
              {monitor.monitor_type.toUpperCase()}
            </span>
          </div>
          <div className="font-mono text-[10px] text-[#666]">{monitor.url}</div>
        </div>

        <div className="flex gap-8 items-center">
          {monitor.ssl_status && (
            <div className="text-right">
              <div className="font-mono text-[10px] text-[#555] tracking-widest mb-1">SSL_STATUS</div>
              <div className={`font-mono text-xs ${
                monitor.ssl_status === 'valid' ? 'text-[#10b981]' :
                monitor.ssl_status === 'warning' ? 'text-[#f59e0b]' :
                'text-[#ef4444]'
              }`}>
                {monitor.ssl_status.toUpperCase()} 
                {monitor.ssl_days_remaining && ` (${monitor.ssl_days_remaining}d)`}
              </div>
            </div>
          )}

          <div className="text-right">
            <div className="font-mono text-[10px] text-[#555] tracking-widest mb-1">INTERVAL</div>
            <div className="font-mono text-xs text-[#e0e0e0]">
              {monitor.interval_seconds}s
            </div>
          </div>

          {onAction && (
            <button 
              onClick={() => onAction(monitor)}
              className="w-8 h-8 bg-[#0B0E14] border border-[#1f2937] flex items-center justify-center text-[#666] hover:text-[#10b981] hover:border-[#10b981] transition-colors font-mono text-xs"
            >
              ⋮
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}
