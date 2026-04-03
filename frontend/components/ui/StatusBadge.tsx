interface StatusBadgeProps {
  status: string;
  showLed?: boolean;
}

export default function StatusBadge({ status, showLed = false }: StatusBadgeProps) {
  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'UP': return '#10b981';
      case 'DOWN': return '#ef4444';
      case 'ISSUE': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'UP': return 'OPERATIONAL';
      case 'DOWN': return 'DOWN';
      case 'ISSUE': return 'DEGRADED';
      default: return 'PENDING';
    }
  };

  const color = getStatusColor(status);

  return (
    <span 
      className="font-mono text-[10px] px-2 py-1 border inline-flex items-center gap-2"
      style={{ borderColor: color, color }}
    >
      {showLed && (
        <span 
          className="w-2 h-2 rounded-full animate-pulse"
          style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
        />
      )}
      {getStatusText(status)}
    </span>
  );
}
