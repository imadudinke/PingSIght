import Card from '@/components/ui/Card';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  ledColor?: string;
  valueColor?: string;
  indicators?: number;
}

export default function StatsCard({ 
  title, 
  value, 
  subtitle, 
  ledColor = '#6b7280',
  valueColor = '#e0e0e0',
  indicators = 0
}: StatsCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="font-mono text-[10px] tracking-widest text-[#555]">{title}</div>
        <div className="w-10 h-10 rounded-full bg-[#0B0E14] border border-[#1f2937] flex items-center justify-center">
          <div 
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ 
              backgroundColor: ledColor,
              boxShadow: `0 0 8px ${ledColor}`
            }}
          />
        </div>
      </div>
      <div className="text-4xl font-bold mb-1" style={{ color: valueColor }}>
        {value}
      </div>
      {subtitle && (
        <div className="font-mono text-[8px] tracking-widest text-[#555]">{subtitle}</div>
      )}
      {indicators > 0 && (
        <div className="flex gap-1 mt-2">
          {Array.from({ length: indicators }).map((_, i) => (
            <div key={i} className="w-2 h-2" style={{ backgroundColor: ledColor }}></div>
          ))}
        </div>
      )}
    </Card>
  );
}
