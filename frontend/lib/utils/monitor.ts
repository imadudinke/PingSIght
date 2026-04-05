/**
 * Monitor utility functions
 */

export interface DeepTrace {
  dns: number;
  tcp: number;
  tls: number;
  ttfb: number;
  total: number;
}

/**
 * Extract deep trace timing data from monitor
 * Falls back to calculated values if real data not available
 */
export function getDeepTrace(monitor: any): DeepTrace {
  // If we have timing details from the latest heartbeat
  if (monitor.timing_details) {
    return {
      dns: monitor.timing_details.dns_ms || 0,
      tcp: monitor.timing_details.tcp_connect_ms || 0,
      tls: monitor.timing_details.tls_handshake_ms || 0,
      ttfb: monitor.timing_details.ttfb_ms || 0,
      total: monitor.timing_details.latency_ms || 0
    };
  }

  // Calculate from average latency or use mock data
  const avgLatency = monitor.average_latency || Math.round(Math.random() * 1000 + 200);
  
  return {
    dns: Math.round(avgLatency * 0.05),
    tcp: Math.round(avgLatency * 0.08),
    tls: Math.round(avgLatency * 0.12),
    ttfb: Math.round(avgLatency * 0.75),
    total: avgLatency
  };
}

/**
 * Check if monitor is currently being checked
 * Returns true if last check was within the last 10 seconds
 */
export function isMonitorChecking(monitor: any): boolean {
  if (!monitor.last_checked) return false;
  
  const lastChecked = new Date(monitor.last_checked).getTime();
  const now = new Date().getTime();
  const diffSeconds = (now - lastChecked) / 1000;
  
  return diffSeconds < 10;
}

/**
 * Format latency for display
 */
export function formatLatency(ms: number): string {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Get uptime percentage color
 */
export function getUptimeColor(percentage: number): string {
  if (percentage >= 99.5) return "#f2d48a"; // Yellow - excellent
  if (percentage >= 95) return "#ffa500"; // Orange - good
  return "#ff6a6a"; // Red - poor
}

/**
 * Calculate uptime percentage from monitor data
 */
export function calculateUptime(monitor: any): number {
  // If we have real uptime data
  if (monitor.uptime_percentage !== undefined) {
    return monitor.uptime_percentage;
  }

  // Mock calculation based on status
  const status = monitor.last_status || monitor.status;
  if (status === "UP" || status === "LIVE") return 99.8;
  if (status === "DOWN" || status === "ALERT") return 94.2;
  return 100;
}

/**
 * Get SSL certificate days remaining
 * Returns null if not available
 */
export function getSSLDaysRemaining(monitor: any): number | null {
  return monitor.ssl_days_remaining ?? null;
}

/**
 * Get domain expiry days remaining
 * Returns null if not available
 */
export function getDomainDaysRemaining(monitor: any): number | null {
  return monitor.domain_days_remaining ?? null;
}

/**
 * Get SSL certificate issuer from monitor data
 */
export function getSSLIssuer(monitor: any): string {
  // This would come from backend SSL check data
  // For now, return a placeholder
  return monitor.ssl_issuer || "Unknown";
}

/**
 * Get SSL certificate common name
 */
export function getSSLCommonName(monitor: any): string {
  // Extract from URL or backend data
  try {
    const url = new URL(monitor.url);
    return url.hostname;
  } catch {
    return monitor.url;
  }
}
