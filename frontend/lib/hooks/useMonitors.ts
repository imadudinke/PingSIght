"use client";

import { useState, useEffect, useCallback } from 'react';
import { listMonitorsMonitorsGet } from '@/lib/api/sdk.gen';
import type { MonitorResponse } from '@/lib/api/types.gen';

export function useMonitors(autoRefresh = true, refreshInterval = 30000) {
  const [monitors, setMonitors] = useState<MonitorResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchMonitors = useCallback(async (page = 1, perPage = 100, isBackgroundRefresh = false) => {
    try {
      if (!isBackgroundRefresh) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }

      const response = await listMonitorsMonitorsGet({
        query: { page, per_page: perPage }
      });

      if (response.response.ok && response.data) {
        setMonitors(response.data.monitors);
        setTotal(response.data.total);
        setError(null);
        setLastUpdated(new Date());
      } else {
        setError('Failed to fetch monitors');
      }
    } catch (err) {
      setError('Network error');
      console.error('Failed to fetch monitors:', err);
    } finally {
      if (!isBackgroundRefresh) {
        setLoading(false);
      } else {
        setIsRefreshing(false);
      }
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchMonitors(1, 100, false);
  }, [fetchMonitors]);

  // Auto-refresh with visibility detection
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Only refresh if page is visible (battery/performance optimization)
      if (document.visibilityState === 'visible') {
        fetchMonitors(1, 100, true);
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchMonitors]);

  // Refresh when page becomes visible again
  useEffect(() => {
    if (!autoRefresh) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchMonitors(1, 100, true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [autoRefresh, fetchMonitors]);

  return { 
    monitors, 
    loading, 
    error, 
    total, 
    isRefreshing,
    lastUpdated,
    refetch: (page?: number, perPage?: number) => fetchMonitors(page, perPage, false)
  };
}
