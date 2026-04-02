"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Cookies from 'js-cookie';

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

export default function Dashboard() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [loadingMonitors, setLoadingMonitors] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchMonitors();
      const interval = setInterval(fetchMonitors, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const fetchMonitors = async () => {
    try {
      const token = Cookies.get('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/monitors/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMonitors(data);
      }
    } catch (error) {
      console.error('Failed to fetch monitors:', error);
    } finally {
      setLoadingMonitors(false);
    }
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center">
        <div className="font-mono text-[#a5b9ff] tracking-widest animate-pulse">
          LOADING_SYSTEM...
        </div>
      </div>
    );
  }

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

  const operationalCount = monitors.filter(m => m.last_status === 'UP').length;
  const issueCount = monitors.filter(m => m.last_status !== 'UP' && m.last_status !== 'PENDING').length;

  return (
    <div className="min-h-screen bg-[#0B0E14] text-[#888] flex">
      <style dangerouslySetInnerHTML={{ __html: `
        .panel { background-color: #151922; border: 1px solid #1f2937; position: relative; }
        .status-led { 
          width: 8px; 
          height: 8px; 
          border-radius: 50%; 
          box-shadow: 0 0 8px currentColor;
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}} />

      {/* SIDEBAR */}
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

        <button className="w-full bg-[#10b981] text-black font-mono text-[10px] font-bold py-3 tracking-widest hover:bg-[#059669] transition-all mb-4">
          NEW_MONITOR
        </button>

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

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col">
        {/* TOP BAR */}
        <header className="bg-[#0B0E14] border-b border-[#1f2937] px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-[#e0e0e0] font-mono text-sm tracking-widest">OBSERVATORY_ALPHA_V1.0</h2>
              <div className="flex gap-6 mt-1 font-mono text-[10px] tracking-widest">
                <span className="text-[#10b981]">LIVE_FEED</span>
                <span className="text-[#555]">LOGS</span>
                <span className="text-[#555]">NODES</span>
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

        {/* DASHBOARD CONTENT */}
        <div className="flex-1 p-8 overflow-auto">
          {/* STATS CARDS */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="panel p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="font-mono text-[10px] tracking-widest text-[#555]">SYSTEM_UPTIME</div>
                <div className="w-10 h-10 rounded-full bg-[#0B0E14] border border-[#1f2937] flex items-center justify-center">
                  <div className="status-led" style={{ backgroundColor: '#10b981' }}></div>
                </div>
              </div>
              <div className="text-4xl font-bold text-[#e0e0e0] mb-1">
                {monitors.length > 0 ? '99.98%' : '--'}
              </div>
              <div className="font-mono text-[8px] tracking-widest text-[#555]">REFERENCE: NODE_A1</div>
            </div>

            <div className="panel p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="font-mono text-[10px] tracking-widest text-[#555]">ACTIVE_INCIDENTS</div>
                <div className="w-10 h-10 rounded-full bg-[#0B0E14] border border-[#1f2937] flex items-center justify-center">
                  <div className="status-led" style={{ backgroundColor: issueCount > 0 ? '#ef4444' : '#6b7280' }}></div>
                </div>
              </div>
              <div className={`text-4xl font-bold mb-1 ${issueCount > 0 ? 'text-[#ef4444]' : 'text-[#6b7280]'}`}>
                {issueCount.toString().padStart(2, '0')}
              </div>
              <div className="flex gap-1 mt-2">
                {Array.from({ length: issueCount }).map((_, i) => (
                  <div key={i} className="w-2 h-2 bg-[#ef4444]"></div>
                ))}
              </div>
            </div>

            <div className="panel p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="font-mono text-[10px] tracking-widest text-[#555]">LATENCY_AVG</div>
                <div className="w-10 h-10 rounded-full bg-[#0B0E14] border border-[#1f2937] flex items-center justify-center">
                  <div className="status-led" style={{ backgroundColor: '#f59e0b' }}></div>
                </div>
              </div>
              <div className="text-4xl font-bold text-[#f59e0b] mb-1">44ms</div>
              <div className="font-mono text-[8px] tracking-widest text-[#555]">TARGET: &lt;50MS</div>
            </div>
          </div>

          {/* ACTIVE MONITORS */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-mono text-xs tracking-widest text-[#e0e0e0]">
                ACTIVE_MONITORS [N:{monitors.length}]
              </h3>
              <div className="flex gap-4 font-mono text-[10px] tracking-widest">
                <span className="flex items-center gap-2">
                  <span className="status-led" style={{ backgroundColor: '#10b981' }}></span> OPERATIONAL
                </span>
                <span className="flex items-center gap-2">
                  <span className="status-led" style={{ backgroundColor: '#ef4444' }}></span> DEGRADED
                </span>
              </div>
            </div>

            {loadingMonitors ? (
              <div className="panel p-8 text-center">
                <div className="font-mono text-[10px] text-[#555] tracking-widest animate-pulse">
                  LOADING_MONITORS...
                </div>
              </div>
            ) : monitors.length === 0 ? (
              <div className="panel p-8 text-center">
                <div className="font-mono text-sm text-[#555] tracking-widest mb-4">
                  NO_MONITORS_CONFIGURED
                </div>
                <button className="bg-[#10b981] text-black font-mono text-xs font-bold px-6 py-3 tracking-widest hover:bg-[#059669] transition-all">
                  CREATE_FIRST_MONITOR
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {monitors.map((monitor) => (
                  <div key={monitor.id} className="panel p-6">
                    <div 
                      className="absolute left-0 top-0 bottom-0 w-1" 
                      style={{ backgroundColor: getStatusColor(monitor.last_status) }}
                    ></div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <h4 className="font-mono text-sm tracking-wider text-[#e0e0e0]">
                            {monitor.friendly_name}
                          </h4>
                          <span 
                            className="font-mono text-[10px] px-2 py-1 border"
                            style={{ 
                              borderColor: getStatusColor(monitor.last_status),
                              color: getStatusColor(monitor.last_status)
                            }}
                          >
                            {getStatusText(monitor.last_status)}
                          </span>
                          {monitor.last_status === 'UP' && (
                            <span className="font-mono text-[10px] text-[#10b981] flex items-center gap-1">
                              <span className="status-led" style={{ backgroundColor: '#10b981' }}></span> LIVE
                            </span>
                          )}
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

                        <button className="w-8 h-8 bg-[#0B0E14] border border-[#1f2937] flex items-center justify-center text-[#666] hover:text-[#10b981] hover:border-[#10b981] transition-colors font-mono text-xs">
                          ⋮
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* BOTTOM GRID */}
          <div className="grid grid-cols-2 gap-6">
            {/* SYSTEM TOPOLOGY */}
            <div className="panel p-6">
              <h3 className="font-mono text-xs tracking-widest text-[#e0e0e0] mb-4">SYSTEM_TOPOLOGY_MAP</h3>
              <div className="h-64 flex items-center justify-center">
                <div className="font-mono text-[10px] text-[#333] text-center space-y-4">
                  <div className="flex justify-center gap-8">
                    <div className="w-16 h-16 border border-[#1f2937] flex items-center justify-center text-[#10b981]">
                      NODE<br/>A1
                    </div>
                    <div className="w-16 h-16 border border-[#1f2937] flex items-center justify-center text-[#10b981]">
                      NODE<br/>B2
                    </div>
                  </div>
                  <div className="text-[#555]">├─────┼─────┤</div>
                  <div className="w-16 h-16 border border-[#1f2937] flex items-center justify-center text-[#f59e0b] mx-auto">
                    CORE<br/>SYS
                  </div>
                  <div className="font-mono text-[10px] text-[#10b981] tracking-widest animate-pulse">
                    GLOBAL_INFRASTRUCTURE_VISUALIZER_LOADING...
                  </div>
                </div>
              </div>
            </div>

            {/* ANNOTATION LOGS */}
            <div className="panel p-6">
              <h3 className="font-mono text-xs tracking-widest text-[#e0e0e0] mb-4">ANNOTATION_LOGS</h3>
              <div className="space-y-3 font-mono text-[10px]">
                <div className="border-l-2 border-[#1f2937] pl-4 py-2 hover:border-[#10b981] transition-colors">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-[#555]">14:02:33</span>
                    <span className="tracking-widest text-[#10b981]">NODE_ALPHA_RECOVERY</span>
                  </div>
                  <div className="text-[#555] text-[9px]">Restored connectivity to secondary node</div>
                </div>
                <div className="border-l-2 border-[#1f2937] pl-4 py-2 hover:border-[#10b981] transition-colors">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-[#555]">13:58:44</span>
                    <span className="tracking-widest text-[#ef4444]">DB_LATENCY_SPIKE</span>
                  </div>
                  <div className="text-[#555] text-[9px]">Detected 2x increase in response time [ALERT]</div>
                </div>
                <div className="border-l-2 border-[#1f2937] pl-4 py-2 hover:border-[#10b981] transition-colors">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-[#555]">12:45:06</span>
                    <span className="tracking-widest text-[#f59e0b]">SCHEDULED_BACKUP</span>
                  </div>
                  <div className="text-[#555] text-[9px]">Snapshot created for all monitoring nodes</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <footer className="bg-[#0B0E14] border-t border-[#1f2937] px-8 py-3 flex justify-between items-center font-mono text-[8px] tracking-widest text-[#555]">
          <div>© 2024 PINGSIGHT_SYSTEMS // V2.0.4_GRAPHITE // ALL_PROTOCOLS_RESERVED</div>
          <div className="flex gap-6">
            <span>LIVE_API <span className="text-[#10b981]">34ms (STABLE)</span></span>
            <span>LATENCY_AVG <span className="text-[#f59e0b]">44ms</span></span>
            <span>UPTIME_30D <span className="text-[#10b981]">99.98%</span></span>
          </div>
        </footer>
      </main>
    </div>
  );
}
