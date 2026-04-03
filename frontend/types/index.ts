export interface User {
  id: string;
  email: string;
  is_active: boolean;
}

export interface Monitor {
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

export interface Heartbeat {
  id: string;
  monitor_id: string;
  status: string;
  response_time_ms?: number;
  status_code?: number;
  error_message?: string;
  is_anomaly?: boolean;
  created_at: string;
}

export interface ApiError {
  detail: string;
  status_code?: number;
}
