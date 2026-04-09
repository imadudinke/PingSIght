"use client";

import { useState, useEffect } from "react";
import { Panel } from "@/components/dashboard/Panel";
import { API_BASE_URL } from "@/lib/constants";

interface AdminStatsData {
  totalUsers: number;
  activeUsers: number;
  totalMonitors: number;
  totalHeartbeats: number;
  totalStatusPages: number;
  systemUptime: string;
}

export function AdminStats() {
  const [stats, setStats] = useState<AdminStatsData>({
    totalUsers: 0,
    activeUsers: 0,
    totalMonitors: 0,
    totalHeartbeats: 0,
    totalStatusPages: 0,
    systemUptime: "0d 0h 0m"
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/stats`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setStats({
          totalUsers: data.total_users,
          activeUsers: data.active_users,
          totalMonitors: data.total_monitors,
          totalHeartbeats: data.total_heartbeats,
          totalStatusPages: data.total_status_pages,
          systemUptime: data.system_uptime
        });
      } else {
        console.error("Failed to fetch admin stats:", response.status);
      }
    } catch (error) {
      console.error("Failed to fetch admin stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    subtitle, 
    icon, 
    trend 
  }: { 
    title: string; 
    value: string | number; 
    subtitle?: string; 
    icon: string; 
    trend?: { value: number; isPositive: boolean };
  }) => (
    <Panel className="p-4 md:p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="text-[#6f6f6f] text-[10px] md:text-[11px] tracking-[0.22em] uppercase mb-2">
            {title}
          </div>
          <div className="text-[#d6d7da] text-[20px] md:text-[24px] font-mono font-bold mb-1">
            {loading ? (
              <div className="animate-pulse bg-[#1b1d20] h-6 w-16 rounded"></div>
            ) : (
              value
            )}
          </div>
          {subtitle && (
            <div className="text-[#6f6f6f] text-[9px] md:text-[10px] tracking-[0.18em] uppercase">
              {subtitle}
            </div>
          )}
          {trend && (
            <div className={`text-[9px] md:text-[10px] tracking-[0.18em] uppercase mt-1 ${
              trend.isPositive ? 'text-[#10b981]' : 'text-[#ef4444]'
            }`}>
              {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}% vs last month
            </div>
          )}
        </div>
        <div className="text-[#f2d48a] text-[16px] md:text-[18px] ml-4">
          {icon}
        </div>
      </div>
    </Panel>
  );

  return (
    <div className="mb-6 md:mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="TOTAL_USERS"
          value={stats.totalUsers}
          subtitle="REGISTERED"
          icon="👥"
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="ACTIVE_USERS"
          value={stats.activeUsers}
          subtitle="LAST_30_DAYS"
          icon="🟢"
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          title="MONITORS"
          value={stats.totalMonitors}
          subtitle="TOTAL_CREATED"
          icon="📊"
          trend={{ value: 15, isPositive: true }}
        />
        <StatCard
          title="HEARTBEATS"
          value={stats.totalHeartbeats.toLocaleString()}
          subtitle="TOTAL_RECEIVED"
          icon="💓"
          trend={{ value: 23, isPositive: true }}
        />
        <StatCard
          title="STATUS_PAGES"
          value={stats.totalStatusPages}
          subtitle="PUBLISHED"
          icon="📄"
          trend={{ value: 5, isPositive: true }}
        />
        <StatCard
          title="SYSTEM_UPTIME"
          value={stats.systemUptime}
          subtitle="CURRENT_SESSION"
          icon="⚡"
        />
      </div>
    </div>
  );
}