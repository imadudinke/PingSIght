"use client";

import { useState, useEffect } from 'react';
import { listMonitorsMonitorsGet } from '@/lib/api/sdk.gen';
import type { MonitorResponse } from '@/lib/api/types.gen';

export function useMonitors(autoRefresh = true, refreshInterval = 30000) {
  const [monitors, setMonitors] = useState<MonitorResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetchMonitors = async (page = 1, perPage = 100) => {
    try {
      const response = await listMonitorsMonitorsGet({
        query: { page, per_page: perPage }
      });

      if (response.response.ok && response.data) {
        setMonitors(response.data.monitors);
        setTotal(response.data.total);
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
