"use client";

import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';

interface Monitor {
  id: string;
  user_id: string;
  url: string;
  friendly_name: string;
  interval_seconds: number;
  status: string;
  is_active: boolean;
  is_maintenance: boolean;
  last_checked: string | null;
  created_at: string;
  monitor_type: 'simple' | 'scenario' | 'heartbeat';
  steps: Array<{
    url: string;
    name: string;
    order: number;
  }> | null;
  ssl_status: string | null;
  ssl_expiry_date: string | null;
  ssl_days_remaining: number | null;
  domain_status: string | null;
  domain_expiry_date: string | null;
  domain_days_remaining: number | null;
  domain_last_checked: string | null;
  last_ping_received: string | null;
  heartbeat_url: string | null;
}

interface MonitorsResponse {
  monitors: Monitor[];
  total: number;
  page: number;
  per_page: number;
}

export function useMonitors(autoRefresh = true, refreshInterval = 30000) {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetchMonitors = async (page = 1, perPage = 100) => {
    try {
      const token = Cookies.get('access_token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/monitors/?page=${page}&per_page=${perPage}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data: MonitorsResponse = await response.json();
        setMonitors(data.monitors);
        setTotal(data.total);
        setError(null);
      } else {
        setError('Failed to fetch monitors');
      }
    } catch (err) {
      setError('Network error');
      console.error('Failed to fetch monitors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitors();

    if (autoRefresh) {
      const interval = setInterval(() => fetchMonitors(), refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  return { monitors, loading, error, total, refetch: fetchMonitors };
}
