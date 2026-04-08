"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils/ui";
import { BackgroundLayers } from "@/components/dashboard/BackgroundLayers";
import { Panel } from "@/components/dashboard/Panel";
import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/Header";
import { DashboardFooter } from "@/components/dashboard/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/Skeleton";

interface NotificationSettings {
  discord_webhook_url: string | null;
  discord_enabled: boolean;
  slack_webhook_url: string | null;
  slack_enabled: boolean;
  alert_on_down: boolean;
  alert_on_recovery: boolean;
  alert_threshold: number;
  ssl_expiry_alert_days: number;
  domain_expiry_alert_days: number;
}

function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint: string;
}) {
  return (
    <div className="flex items-center justify-between gap-6">
      <div>
        <div className="text-[#d6d7da] text-[12px] tracking-[0.22em] uppercase">
          {label}
        </div>
        <div className="mt-1 text-[#5f636a] text-[11px] leading-relaxed">
          {hint}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-[28px] w-[52px] border",
          "bg-[rgba(255,255,255,0.02)]",
          checked ? "border-[#f2d48a]" : "border-[#2a2d31]",
          "transition"
        )}
        aria-pressed={checked}
        aria-label={label}
      >
        <span
          className={cn(
            "absolute top-[3px] h-[20px] w-[20px]",
            "border border-[#2a2d31] bg-[#d6d7da]",
            "transition-transform",
            checked ? "translate-x-[26px]" : "translate-x-[4px]"
          )}
          style={{ borderColor: checked ? "#f2d48a" : "#2a2d31" }}
        />
      </button>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-[#5f636a] text-[10px] tracking-[0.26em] uppercase">
        {label}
      </div>
      {hint ? (
        <div className="mt-1 text-[#5f636a] text-[11px] leading-relaxed">
          {hint}
        </div>
      ) : null}
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        "w-full h-[38px] px-3",
        "bg-[rgba(0,0,0,0.28)]",
        "border border-[#2a2d31]",
        "text-[#d6d7da] text-[11px] tracking-[0.12em]",
        "placeholder:text-[#60646b]",
        "focus:outline-none focus:border-[#b9c7ff]",
        disabled && "opacity-60 cursor-not-allowed"
      )}
    />
  );
}

function NumberInput({
  value,
  onChange,
  min,
  max,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  disabled?: boolean;
}) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      disabled={disabled}
      onChange={(e) => onChange(Number(e.target.value))}
      className={cn(
        "w-[132px] h-[38px] px-3",
        "bg-[rgba(0,0,0,0.28)]",
        "border border-[#2a2d31]",
        "text-[#d6d7da] text-[11px] tracking-[0.12em]",
        "focus:outline-none focus:border-[#b9c7ff]",
        disabled && "opacity-60 cursor-not-allowed"
      )}
    />
  );
}

function Toast({
  tone,
  title,
  message,
  onClose,
}: {
  tone: "error" | "ok";
  title: string;
  message: string;
  onClose: () => void;
}) {
  const strip = tone === "error" ? "bg-[#ff6a6a]" : "bg-[#f2d48a]";
  const titleColor = tone === "error" ? "text-[#ff6a6a]" : "text-[#f2d48a]";

  return (
    <div className="mb-6">
      <div className="relative border border-[#2a2d31] bg-[rgba(0,0,0,0.35)] backdrop-blur-sm">
        <div className={cn("absolute left-0 top-0 bottom-0 w-[3px]", strip)} />
        <div className="px-5 py-4 flex items-start gap-4">
          <div className={cn("text-[10px] tracking-[0.28em] uppercase", titleColor)}>
            {title}
          </div>
          <div className="flex-1 text-[#6f6f6f] text-[11px] leading-relaxed">
            {message}
          </div>
          <button
            onClick={onClose}
            className="text-[#6f6f6f] hover:text-[#d6d7da] transition text-[12px]"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();

  const [settings, setSettings] = useState<NotificationSettings>({
    discord_webhook_url: null,
    discord_enabled: false,
    slack_webhook_url: null,
    slack_enabled: false,
    alert_on_down: true,
    alert_on_recovery: true,
    alert_threshold: 1,
    ssl_expiry_alert_days: 7,
    domain_expiry_alert_days: 7,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.push("/");
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated && !isLoading) fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isLoading]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        "http://localhost:8000/api/notifications/settings",
        { credentials: "include" }
      );

      if (!response.ok) throw new Error("FAILED_TO_FETCH_SETTINGS");

      const data = await response.json();
      setSettings(data);
    } catch (err: any) {
      setError(err.message || "FAILED_TO_LOAD_SETTINGS");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(
        "http://localhost:8000/api/notifications/settings",
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(settings),
        }
      );

      if (!response.ok) {
        let detail = "FAILED_TO_SAVE_SETTINGS";
        try {
          const errorData = await response.json();
          detail = errorData.detail || detail;
        } catch {
          // ignore
        }
        throw new Error(detail);
      }

      const data = await response.json();
      setSettings(data);
      setSuccess("SETTINGS_SAVED");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || "FAILED_TO_SAVE_SETTINGS");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(
        "http://localhost:8000/api/notifications/test",
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: "This is a test notification from PingSight!",
          }),
        }
      );

      if (!response.ok) {
        let detail = "FAILED_TO_SEND_TEST_NOTIFICATION";
        try {
          const errorData = await response.json();
          detail = errorData.detail || detail;
        } catch {
          // ignore
        }
        throw new Error(detail);
      }

      setSuccess("TEST_NOTIFICATION_SENT");
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.message || "FAILED_TO_SEND_TEST_NOTIFICATION");
    } finally {
      setTesting(false);
    }
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0b0c0e] flex items-center justify-center">
        <div className="font-mono text-[#6b6f76] tracking-[0.28em] animate-pulse text-[11px] uppercase">
          LOADING_SYSTEM...
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen text-[#b0b3b8] font-mono">
        <BackgroundLayers />
        <div className="flex min-h-screen">
          <DashboardSidebar 
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
          />
          <div className="flex-1 flex flex-col lg:ml-[248px]">
            <DashboardHeader 
              userEmail={user?.email}
              onMenuClick={() => setIsMobileMenuOpen(true)}
            />
            <div className="flex-1 px-4 md:px-6 lg:px-8 py-6 md:py-8 overflow-auto">
              <Panel className="p-0">
                <div className="px-6 py-5 border-b border-[#15171a]">
                  <div className="text-[#d6d7da] text-[14px] tracking-[0.18em] uppercase">
                    NOTIFICATIONS
                  </div>
                  <Skeleton className="h-3 w-48 mt-1" />
                </div>
                <div className="p-6">
                  <div className="space-y-6">
                    {/* Discord Section Skeleton */}
                    <div className="space-y-4">
                      <Skeleton className="h-4 w-32" />
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Skeleton className="w-4 h-4" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                        <Skeleton className="h-10 w-full" />
                      </div>
                    </div>

                    {/* Slack Section Skeleton */}
                    <div className="space-y-4">
                      <Skeleton className="h-4 w-24" />
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Skeleton className="w-4 h-4" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                        <Skeleton className="h-10 w-full" />
                      </div>
                    </div>

                    {/* Alert Settings Skeleton */}
                    <div className="space-y-4">
                      <Skeleton className="h-4 w-36" />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <Skeleton className="w-4 h-4" />
                            <Skeleton className="h-3 w-32" />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons Skeleton */}
                    <div className="flex items-center gap-4 pt-4">
                      <Skeleton className="h-10 w-24" />
                      <Skeleton className="h-10 w-20" />
                    </div>
                  </div>
                </div>
              </Panel>
            </div>
            <DashboardFooter />
          </div>
        </div>
      </div>
    );
  }

  const canTest = Boolean(
    (settings.discord_webhook_url && settings.discord_enabled) ||
    (settings.slack_webhook_url && settings.slack_enabled)
  );

  return (
    <div className="min-h-screen text-[#b0b3b8] font-mono">
      <BackgroundLayers />

      <div className="flex min-h-screen">
        <DashboardSidebar 
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />

        <div className="flex-1 flex flex-col lg:ml-[248px]">
          <DashboardHeader 
            userEmail={user?.email}
            onMenuClick={() => setIsMobileMenuOpen(true)}
          />

          <div className="flex-1 px-4 md:px-6 lg:px-8 py-6 md:py-8 overflow-auto max-w-5xl">
            <div className="mb-4 md:mb-6">
              <div className="text-[#d6d7da] text-[12px] md:text-[14px] tracking-[0.18em] uppercase">
                NOTIFICATIONS
              </div>
              <div className="mt-1 text-[#6f6f6f] text-[10px] md:text-[11px] tracking-[0.10em]">
                DISCORD_AND_SLACK_WEBHOOKS_AND_ALERT_PREFERENCES
              </div>
            </div>

            {error ? (
              <Toast
                tone="error"
                title="ERROR"
                message={error}
                onClose={() => setError(null)}
              />
            ) : null}

            {success ? (
              <Toast
                tone="ok"
                title="OK"
                message={success}
                onClose={() => setSuccess(null)}
              />
            ) : null}

            {/* DISCORD */}
            <Panel className="p-0 mb-6">
              <div className="px-6 py-5 border-b border-[#15171a] flex items-start justify-between gap-6">
                <div>
                  <div className="text-[#d6d7da] text-[12px] tracking-[0.26em] uppercase">
                    DISCORD_NOTIFICATIONS
                  </div>
                  <div className="mt-1 text-[#5f636a] text-[11px] leading-relaxed">
                    RECEIVE_ALERTS_VIA_DISCORD_WEBHOOK
                  </div>
                </div>

                <Toggle
                  checked={settings.discord_enabled}
                  onChange={(v) =>
                    setSettings((s) => ({ ...s, discord_enabled: v }))
                  }
                  label="DISCORD_ENABLED"
                  hint="ENABLE_OR_DISABLE_DISCORD_DELIVERY"
                />
              </div>

              <div className="p-6 space-y-6">
                <Field
                  label="DISCORD_WEBHOOK_URL"
                  hint="SERVER_SETTINGS → INTEGRATIONS → WEBHOOKS"
                >
                  <Input
                    type="url"
                    value={settings.discord_webhook_url || ""}
                    onChange={(v) =>
                      setSettings((s) => ({
                        ...s,
                        discord_webhook_url: v || null,
                      }))
                    }
                    placeholder="https://discord.com/api/webhooks/..."
                    disabled={!settings.discord_enabled}
                  />
                </Field>

                <div className="flex items-center justify-between gap-6 border-t border-[#15171a] pt-6">
                  <div className="text-[#5f636a] text-[10px] tracking-[0.26em] uppercase">
                    TEST_CHANNEL_DELIVERY
                  </div>

                  <button
                    onClick={handleTest}
                    disabled={!canTest || testing}
                    className={cn(
                      "h-[38px] px-5",
                      "text-[10px] tracking-[0.26em] uppercase font-bold",
                      "border border-[#2a2d31]",
                      canTest && !testing
                        ? "bg-[#b9c7ff] text-[#0b0c0e] border-[#c8d2ff] hover:brightness-95"
                        : "bg-[rgba(255,255,255,0.02)] text-[#6f6f6f] cursor-not-allowed",
                      "transition"
                    )}
                  >
                    {testing ? "SENDING..." : "SEND_TEST_NOTIFICATION"}
                  </button>
                </div>
              </div>
            </Panel>

            {/* SLACK */}
            <Panel className="p-0 mb-6">
              <div className="px-6 py-5 border-b border-[#15171a] flex items-start justify-between gap-6">
                <div>
                  <div className="text-[#d6d7da] text-[12px] tracking-[0.26em] uppercase">
                    SLACK_NOTIFICATIONS
                  </div>
                  <div className="mt-1 text-[#5f636a] text-[11px] leading-relaxed">
                    RECEIVE_ALERTS_VIA_SLACK_WEBHOOK
                  </div>
                </div>

                <Toggle
                  checked={settings.slack_enabled}
                  onChange={(v) =>
                    setSettings((s) => ({ ...s, slack_enabled: v }))
                  }
                  label="SLACK_ENABLED"
                  hint="ENABLE_OR_DISABLE_SLACK_DELIVERY"
                />
              </div>

              <div className="p-6 space-y-6">
                <Field
                  label="SLACK_WEBHOOK_URL"
                  hint="WORKSPACE → APPS → INCOMING_WEBHOOKS"
                >
                  <Input
                    type="url"
                    value={settings.slack_webhook_url || ""}
                    onChange={(v) =>
                      setSettings((s) => ({
                        ...s,
                        slack_webhook_url: v || null,
                      }))
                    }
                    placeholder="https://hooks.slack.com/services/..."
                    disabled={!settings.slack_enabled}
                  />
                </Field>

                <div className="border border-[#f2d48a]/20 bg-[#f2d48a]/5 p-4">
                  <div className="text-[#f2d48a] text-[10px] tracking-[0.26em] uppercase mb-2">
                    HOW_TO_GET_SLACK_WEBHOOK
                  </div>
                  <div className="text-[#d6d7da] text-[10px] leading-relaxed space-y-1">
                    <p>1. Go to your Slack workspace settings</p>
                    <p>2. Navigate to Apps → Incoming Webhooks</p>
                    <p>3. Click "Add to Slack" and select a channel</p>
                    <p>4. Copy the webhook URL and paste it above</p>
                  </div>
                </div>
              </div>
            </Panel>

            {/* ALERT PREFERENCES */}
            <Panel className="p-0 mb-6">
              <div className="px-6 py-5 border-b border-[#15171a]">
                <div className="text-[#d6d7da] text-[12px] tracking-[0.26em] uppercase">
                  ALERT_PREFERENCES
                </div>
                <div className="mt-1 text-[#5f636a] text-[11px] leading-relaxed">
                  DEFINE_WHEN_ALERTS_TRIGGER
                </div>
              </div>

              <div className="p-6 space-y-6">
                <Toggle
                  checked={settings.alert_on_down}
                  onChange={(v) =>
                    setSettings((s) => ({ ...s, alert_on_down: v }))
                  }
                  label="ALERT_ON_DOWN"
                  hint="TRIGGER_WHEN_MONITOR_FAILS"
                />

                <Toggle
                  checked={settings.alert_on_recovery}
                  onChange={(v) =>
                    setSettings((s) => ({ ...s, alert_on_recovery: v }))
                  }
                  label="ALERT_ON_RECOVERY"
                  hint="TRIGGER_WHEN_MONITOR_RECOVERS"
                />

                <div className="border-t border-[#15171a] pt-6">
                  <Field
                    label="ALERT_THRESHOLD"
                    hint="CONSECUTIVE_FAILURES_REQUIRED (1–10)"
                  >
                    <NumberInput
                      value={settings.alert_threshold}
                      min={1}
                      max={10}
                      onChange={(v) =>
                        setSettings((s) => ({ ...s, alert_threshold: v }))
                      }
                    />
                  </Field>
                </div>
              </div>
            </Panel>

            {/* EXPIRY */}
            <Panel className="p-0 mb-6">
              <div className="px-6 py-5 border-b border-[#15171a]">
                <div className="text-[#d6d7da] text-[12px] tracking-[0.26em] uppercase">
                  EXPIRY_ALERTS
                </div>
                <div className="mt-1 text-[#5f636a] text-[11px] leading-relaxed">
                  SSL_AND_DOMAIN_EXPIRATION_THRESHOLDS
                </div>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="SSL_EXPIRY_ALERT_DAYS" hint="1–90 DAYS BEFORE EXPIRY">
                  <NumberInput
                    value={settings.ssl_expiry_alert_days}
                    min={1}
                    max={90}
                    onChange={(v) =>
                      setSettings((s) => ({ ...s, ssl_expiry_alert_days: v }))
                    }
                  />
                </Field>

                <Field label="DOMAIN_EXPIRY_ALERT_DAYS" hint="1–365 DAYS BEFORE EXPIRY">
                  <NumberInput
                    value={settings.domain_expiry_alert_days}
                    min={1}
                    max={365}
                    onChange={(v) =>
                      setSettings((s) => ({
                        ...s,
                        domain_expiry_alert_days: v,
                      }))
                    }
                  />
                </Field>
              </div>
            </Panel>

            {/* SAVE */}
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={fetchSettings}
                disabled={saving || testing}
                className={cn(
                  "h-[40px] px-5",
                  "border border-[#2a2d31] bg-[rgba(255,255,255,0.02)]",
                  "text-[#6f6f6f] hover:text-[#d6d7da] hover:border-[#3a3d42] transition",
                  "text-[10px] tracking-[0.26em] uppercase",
                  (saving || testing) && "opacity-60 cursor-not-allowed"
                )}
              >
                RELOAD
              </button>

              <button
                onClick={handleSave}
                disabled={saving}
                className={cn(
                  "h-[40px] px-6",
                  "text-[10px] tracking-[0.26em] uppercase font-bold",
                  saving
                    ? "bg-[rgba(255,255,255,0.02)] text-[#6f6f6f] border border-[#2a2d31] cursor-not-allowed"
                    : "bg-[#f2d48a] text-[#0b0c0e] border border-[#f2d48a] hover:bg-[#d6d7da]",
                  "transition"
                )}
              >
                {saving ? "SAVING..." : "SAVE_NOTIFICATIONS"}
              </button>
            </div>
          </div>

          <DashboardFooter />
        </div>
      </div>
    </div>
  );
}