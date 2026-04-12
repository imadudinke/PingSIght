/**
 * BFF: same-origin /api/v1 → FastAPI (next.config rewrites). On Vercel, BFF defaults on
 * unless NEXT_PUBLIC_BFF=0 (see next.config.ts env.NEXT_PUBLIC_BFF).
 *
 * Direct API: NEXT_PUBLIC_BFF=0 and NEXT_PUBLIC_API_URL=https://your-api.onrender.com
 */
export const BFF_API_PREFIX = "/api/v1";

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
