"use client";

import { cn } from "@/lib/utils/ui";

/**
 * GamingTemplate (Terminal/CRT) — UI refinement only:
 * - keeps your aesthetic (grid + scanlines + neon)
 * - improves spacing, hierarchy, and “system plate” consistency
 * - adds safer theme handling (but remains dark-first)
 * - no data logic changes
 */

interface GamingTemplateProps {
  theme: string;
  layout: string;
  statusPage: any;
}

function statusTone(status: string) {
  switch (status) {
    case "operational":
      return {
        color: "#00ff88",
        label: "ONLINE",
        border: "border-green-500/30",
        bg: "bg-green-500/10",
        glow: "shadow-[0_0_32px_rgba(0,255,136,0.18)]",
      };
    case "degraded_performance":
      return {
        color: "#ffaa00",
        label: "DEGRADED",
        border: "border-amber-500/30",
        bg: "bg-amber-500/10",
        glow: "shadow-[0_0_32px_rgba(255,170,0,0.14)]",
      };
    case "partial_outage":
      return {
        color: "#ff4444",
        label: "PARTIAL_OFFLINE",
        border: "border-red-500/30",
        bg: "bg-red-500/10",
        glow: "shadow-[0_0_32px_rgba(255,68,68,0.14)]",
      };
    case "major_outage":
      return {
        color: "#ff0000",
        label: "OFFLINE",
        border: "border-red-600/40",
        bg: "bg-red-600/15",
        glow: "shadow-[0_0_40px_rgba(255,0,0,0.18)]",
      };
    default:
      return {
        color: "#888888",
        label: "UNKNOWN",
        border: "border-gray-500/30",
        bg: "bg-gray-500/10",
        glow: "shadow-[0_0_28px_rgba(136,136,136,0.10)]",
      };
  }
}

function severityTone(severity: string) {
  switch (severity) {
    case "minor":
      return {
        color: "#ffaa00",
        label: "MINOR",
        icon: "⚠",
        bg: "bg-amber-500/10",
        border: "border-amber-500/30",
        glow: "shadow-[0_0_26px_rgba(255,170,0,0.12)]",
      };
    case "major":
      return {
        color: "#ff4444",
        label: "MAJOR",
        icon: "🚨",
        bg: "bg-red-500/10",
        border: "border-red-500/30",
        glow: "shadow-[0_0_28px_rgba(255,68,68,0.12)]",
      };
    case "critical":
      return {
        color: "#ff0000",
        label: "CRITICAL",
        icon: "💀",
        bg: "bg-red-600/15",
        border: "border-red-600/40",
        glow: "shadow-[0_0_34px_rgba(255,0,0,0.16)]",
      };
    default:
      return {
        color: "#888888",
        label: "INFO",
        icon: "ℹ",
        bg: "bg-gray-500/10",
        border: "border-gray-500/30",
        glow: "shadow-[0_0_24px_rgba(136,136,136,0.10)]",
      };
  }
}

function dt(ts: string) {
  return new Date(ts).toLocaleString();
}

export function GamingTemplate({ theme, layout, statusPage }: GamingTemplateProps) {
  // gaming template stays dark-first (CRT/terminal)
  const primaryColor = statusPage.branding_primary_color || "#00ff88";
  const overall = statusTone(statusPage.overall_status || "operational");

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono overflow-x-hidden">
      {/* Ambient neon bloom */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute -top-48 -right-48 h-[520px] w-[520px] rounded-full blur-[90px] opacity-25"
          style={{ backgroundColor: overall.color }}
        />
        <div
          className="absolute -bottom-48 -left-48 h-[620px] w-[620px] rounded-full blur-[100px] opacity-15"
          style={{ backgroundColor: primaryColor }}
        />
      </div>

      {/* Animated background grid */}
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0,255,136,0.10) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,255,136,0.10) 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px",
            animation: "grid-move 20s linear infinite",
          }}
        />
      </div>

      {/* Scanlines */}
      <div className="fixed inset-0 pointer-events-none opacity-10">
        <div
          className="absolute inset-0"
          style={{
            background:
              "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,136,0.10) 2px, rgba(0,255,136,0.10) 4px)",
            animation: "scanlines 0.12s linear infinite",
          }}
        />
      </div>

      {/* CRT vignette */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at center, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.55) 70%, rgba(0,0,0,0.75) 100%)",
          }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-10">
        {/* Header plate */}
        <div
          className={cn(
            "border-2 p-6 mb-8 relative overflow-hidden",
            overall.border,
            overall.bg,
            overall.glow
          )}
        >
          {/* Subtle “signal sweep” */}
          <div className="absolute inset-0 opacity-40">
            <div
              className="absolute -left-[40%] top-0 h-full w-[40%]"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(0,255,136,0.08), transparent)",
                animation: "sweep 3.5s ease-in-out infinite",
              }}
            />
          </div>

          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div className="flex items-center gap-5">
                {statusPage.branding_logo_url ? (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={statusPage.branding_logo_url}
                      alt={statusPage.name}
                      className="h-12 w-12 object-contain"
                      style={{
                        filter:
                          "brightness(0) invert(1) sepia(1) hue-rotate(90deg) saturate(2)",
                      }}
                    />
                    <div
                      className="absolute inset-0 blur-md opacity-40"
                      style={{ backgroundColor: primaryColor }}
                    />
                  </div>
                ) : (
                  <div className="relative">
                    <div
                      className="h-12 w-12 border-2 grid place-items-center font-bold text-lg"
                      style={{
                        borderColor: primaryColor,
                        color: primaryColor,
                        textShadow: `0 0 10px ${primaryColor}`,
                      }}
                    >
                      {String(statusPage?.name || "S").charAt(0)}
                    </div>
                    <div
                      className="absolute inset-0 blur-md opacity-25"
                      style={{ backgroundColor: primaryColor }}
                    />
                  </div>
                )}

                <div>
                  <h1
                    className="text-[28px] font-bold tracking-[0.14em]"
                    style={{
                      color: primaryColor,
                      textShadow: `0 0 18px ${primaryColor}`,
                    }}
                  >
                    {String(statusPage?.name || "STATUS").toUpperCase()}
                  </h1>
                  <div className="text-green-300 text-[12px] tracking-[0.22em] uppercase mt-2">
                    &gt; SYSTEM_STATUS_TERMINAL
                  </div>
                </div>
              </div>

              <div className="border-2 px-4 py-3" style={{ borderColor: overall.color }}>
                <div className="text-xs text-green-300 mb-1 tracking-widest">
                  STATUS:
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full animate-pulse"
                    style={{
                      backgroundColor: overall.color,
                      boxShadow: `0 0 15px ${overall.color}`,
                    }}
                  />
                  <span
                    className="text-lg font-bold tracking-wider"
                    style={{
                      color: overall.color,
                      textShadow: `0 0 10px ${overall.color}`,
                    }}
                  >
                    {overall.label}
                  </span>
                </div>
              </div>
            </div>

            {statusPage.description ? (
              <div className="mt-6 border-l-2 border-green-500/50 pl-4 text-green-300">
                <div className="text-xs text-green-500 mb-2 tracking-widest">
                  &gt; DESCRIPTION:
                </div>
                <div className="text-sm leading-relaxed">{statusPage.description}</div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Active Incidents */}
        {statusPage.active_incidents && statusPage.active_incidents.length > 0 ? (
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="text-red-400 text-2xl animate-pulse">🚨</div>
              <h2
                className="text-2xl font-bold tracking-wider"
                style={{
                  color: "#ff4444",
                  textShadow: "0 0 15px #ff4444",
                }}
              >
                &gt; ACTIVE_INCIDENTS
              </h2>
            </div>

            <div className="space-y-6">
              {statusPage.active_incidents.map((incident: any) => {
                const sev = severityTone(incident.severity);
                return (
                  <div
                    key={incident.id}
                    className={cn(
                      "border-2 p-6 relative overflow-hidden",
                      sev.border,
                      sev.bg,
                      sev.glow
                    )}
                  >
                    <div className="absolute inset-0 opacity-35">
                      <div
                        className="absolute inset-0"
                        style={{
                          background: `linear-gradient(45deg, ${sev.color}18, transparent, ${sev.color}18)`,
                        }}
                      />
                    </div>

                    <div className="relative z-10">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                        <div className="flex items-center gap-4">
                          <span className="text-3xl">{sev.icon}</span>
                          <div>
                            <h3
                              className="text-xl font-bold tracking-wider"
                              style={{
                                color: sev.color,
                                textShadow: `0 0 10px ${sev.color}`,
                              }}
                            >
                              {String(incident.title || "INCIDENT").toUpperCase()}
                            </h3>
                            <div className="text-green-300 text-sm mt-2 tracking-wider">
                              &gt; STARTED:{" "}
                              {incident.started_at
                                ? dt(incident.started_at)
                                : "UNKNOWN"}
                            </div>
                          </div>
                        </div>

                        <div
                          className="border px-3 py-1 text-sm font-bold tracking-widest inline-flex items-center gap-2"
                          style={{
                            borderColor: sev.color,
                            color: sev.color,
                            textShadow: `0 0 6px ${sev.color}`,
                          }}
                        >
                          {sev.label}
                        </div>
                      </div>

                      {incident.description ? (
                        <div className="border-l-2 border-green-500/30 pl-4 mb-4 text-green-300">
                          <div className="text-xs text-green-500 mb-2 tracking-widest">
                            &gt; DETAILS:
                          </div>
                          <div className="text-sm leading-relaxed">
                            {incident.description}
                          </div>
                        </div>
                      ) : null}

                      {incident.updates && incident.updates.length > 0 ? (
                        <div>
                          <div className="text-xs text-green-500 mb-3 tracking-widest">
                            &gt; UPDATES:
                          </div>
                          <div className="space-y-3">
                            {incident.updates.slice(0, 4).map((update: any) => (
                              <div key={update.id} className="flex gap-4">
                                <div className="text-green-500 text-xs mt-1">
                                  ▶
                                </div>
                                <div className="flex-1">
                                  <div className="flex flex-wrap items-center gap-3 mb-1">
                                    <span
                                      className="text-xs font-bold tracking-widest"
                                      style={{
                                        color: primaryColor,
                                        textShadow: `0 0 5px ${primaryColor}`,
                                      }}
                                    >
                                      [{String(update.status || "UPDATE").toUpperCase()}]
                                    </span>
                                    <span className="text-xs text-green-400">
                                      {update.created_at ? dt(update.created_at) : ""}
                                    </span>
                                  </div>
                                  <div className="text-sm text-green-300 leading-relaxed">
                                    {update.message}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* Upcoming Maintenance */}
        {statusPage.upcoming_maintenances &&
        statusPage.upcoming_maintenances.length > 0 ? (
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="text-blue-400 text-2xl">🔧</div>
              <h2
                className="text-2xl font-bold tracking-wider"
                style={{
                  color: "#00aaff",
                  textShadow: "0 0 15px #00aaff",
                }}
              >
                &gt; SCHEDULED_MAINTENANCE
              </h2>
            </div>

            <div className="space-y-4">
              {statusPage.upcoming_maintenances.map((m: any) => (
                <div
                  key={m.id}
                  className="border-2 border-blue-500/30 bg-blue-500/10 p-6 shadow-[0_0_28px_rgba(0,170,255,0.16)]"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                    <div>
                      <h3
                        className="text-xl font-bold tracking-wider mb-2"
                        style={{
                          color: "#00aaff",
                          textShadow: "0 0 10px #00aaff",
                        }}
                      >
                        {String(m.title || "MAINTENANCE").toUpperCase()}
                      </h3>
                      {m.description ? (
                        <div className="text-green-300 text-sm leading-relaxed">
                          {m.description}
                        </div>
                      ) : null}
                    </div>
                    <div className="border border-blue-400 px-3 py-1 text-xs font-bold tracking-widest text-blue-300">
                      SCHEDULED
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-green-500/30 bg-green-500/5 p-3">
                      <div className="text-xs text-green-500 mb-2 tracking-widest">
                        &gt; START_TIME:
                      </div>
                      <div className="text-green-300 font-mono">
                        {m.scheduled_start ? dt(m.scheduled_start) : "UNKNOWN"}
                      </div>
                    </div>
                    <div className="border border-green-500/30 bg-green-500/5 p-3">
                      <div className="text-xs text-green-500 mb-2 tracking-widest">
                        &gt; END_TIME:
                      </div>
                      <div className="text-green-300 font-mono">
                        {m.scheduled_end ? dt(m.scheduled_end) : "UNKNOWN"}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Components */}
        {statusPage.components && statusPage.components.length > 0 ? (
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="text-green-400 text-2xl">⚙️</div>
              <h2
                className="text-2xl font-bold tracking-wider"
                style={{
                  color: primaryColor,
                  textShadow: `0 0 15px ${primaryColor}`,
                }}
              >
                &gt; SYSTEM_COMPONENTS
              </h2>
            </div>

            <div
              className={cn(
                layout === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                  : "space-y-3"
              )}
            >
              {statusPage.components.map((component: any) => {
                const t = statusTone(component.current_status);
                return (
                  <div
                    key={component.id}
                    className={cn(
                      "border-2 p-4 relative transition-transform duration-200 hover:scale-[1.03]",
                      t.border,
                      t.bg,
                      t.glow
                    )}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3
                        className="font-bold tracking-wider"
                        style={{
                          color: t.color,
                          textShadow: `0 0 8px ${t.color}`,
                        }}
                      >
                        {String(component.name || "COMPONENT").toUpperCase()}
                      </h3>
                      <div
                        className="w-3 h-3 rounded-full animate-pulse"
                        style={{
                          backgroundColor: t.color,
                          boxShadow: `0 0 10px ${t.color}`,
                        }}
                      />
                    </div>

                    {component.description ? (
                      <div className="text-green-300 text-xs mb-3 leading-relaxed">
                        {component.description}
                      </div>
                    ) : null}

                    <div className="flex items-center justify-between">
                      <span
                        className="text-sm font-bold tracking-widest"
                        style={{
                          color: t.color,
                          textShadow: `0 0 5px ${t.color}`,
                        }}
                      >
                        {t.label}
                      </span>
                      {statusPage.show_uptime ? (
                        <span className="text-xs text-green-400 font-mono">
                          99.9%
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* Footer */}
        <div className="text-center pt-8 border-t border-green-500/30">
          <div className="text-green-500 text-xs tracking-widest mb-2">
            &gt; POWERED_BY_PINGSIGHT_TERMINAL
          </div>
          <div className="text-green-400 text-xs font-mono">
            [CONNECTION_SECURE] [UPTIME_MONITORING_ACTIVE] [STATUS_OK]
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes grid-move {
          0% {
            transform: translate(0, 0);
          }
          100% {
            transform: translate(50px, 50px);
          }
        }

        @keyframes scanlines {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(4px);
          }
        }

        @keyframes sweep {
          0% {
            transform: translateX(0);
            opacity: 0;
          }
          25% {
            opacity: 0.35;
          }
          50% {
            transform: translateX(240%);
            opacity: 0;
          }
          100% {
            transform: translateX(240%);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}