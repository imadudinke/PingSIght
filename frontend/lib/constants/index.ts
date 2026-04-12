/**
 * API base for browser calls. Prefer getApiBaseUrl() — it fixes Vercel even if the build
 * still has NEXT_PUBLIC_API_URL pointing at Render.
 *
 * BFF: Next.js rewrites /api/v1/* → BACKEND_INTERNAL_URL (set on Vercel).
 */
export const BFF_API_PREFIX = "/api/v1";

/**
 * Resolves API base at call time (browser). On *.vercel.app, uses same-origin /api/v1
 * unless NEXT_PUBLIC_BFF=0 (direct-to-Render mode).
 */
export function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_BFF === "0") {
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  }
  if (process.env.NEXT_PUBLIC_BFF === "1") {
    return BFF_API_PREFIX;
  }
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host.endsWith(".vercel.app")) {
      return BFF_API_PREFIX;
    }
    // Production on a real host (e.g. custom domain): same-origin BFF unless opted out above.
    if (
      process.env.NODE_ENV === "production" &&
      host !== "localhost" &&
      host !== "127.0.0.1"
    ) {
      return BFF_API_PREFIX;
    }
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
}

/** Static fallback (SSR / import time). Prefer getApiBaseUrl() in client components. */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_BFF === "1"
    ? BFF_API_PREFIX
    : process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const MONITOR_TYPES = {
  SIMPLE: 'simple',
  SCENARIO: 'scenario',
} as const;

export const MONITOR_STATUS = {
  UP: 'UP',
  DOWN: 'DOWN',
  ISSUE: 'ISSUE',
  PENDING: 'PENDING',
} as const;

export const SSL_STATUS = {
  VALID: 'valid',
  WARNING: 'warning',
  CRITICAL: 'critical',
  EXPIRED: 'expired',
} as const;

export const STATUS_COLORS = {
  [MONITOR_STATUS.UP]: '#10b981',
  [MONITOR_STATUS.DOWN]: '#ef4444',
  [MONITOR_STATUS.ISSUE]: '#f59e0b',
  [MONITOR_STATUS.PENDING]: '#6b7280',
} as const;

export const REFRESH_INTERVALS = {
  FAST: 10000,    // 10 seconds
  NORMAL: 30000,  // 30 seconds
  SLOW: 60000,    // 1 minute
} as const;
