"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils/ui";
import { Panel } from "@/components/dashboard/Panel";

interface ModernTemplateProps {
  theme: string;
  layout: string;
  statusPage: any;
}

/**
 * PingSight "Modern" template — reskinned to match Observatory / Graphite system UI:
 * - dark-first palette (#0b0c0e base)
 * - mono + tracking
 * - plates (Panel) + thin status strips + subtle glow
 * - no data logic changes; only presentation
 */

function overallTone(status: string) {
  switch (status) {
    case "operational":
      return {
        strip: "#f2d48a",
        dot: "#f2d48a",
        text: "text-[#f2d48a]",
        label: "ALL_SYSTEMS_OPERATIONAL",
      };
    case "degraded_performance":
      return {
        strip: "#ffa500",
        dot: "#ffa500",
        text: "text-[#ffa500]",
        label: "DEGRADED_PERFORMANCE",
      };
    case "partial_outage":
      return {
        strip: "#ff6a6a",
        dot: "#ff6a6a",
        text: "text-[#ff6a6a]",
        label: "PARTIAL_OUTAGE",
      };
    case "major_outage":
      return {
        strip: "#ff6a6a",
        dot: "#ff6a6a",
        text: "text-[#ff6a6a]",
        label: "MAJOR_OUTAGE",
      };
    default:
      return {
        strip: "#6b6f76",
        dot: "#6b6f76",
        text: "text-[#6b6f76]",
        label: "UNKNOWN_STATUS",
      };
  }
}

function severityTone(severity: string) {
  switch (severity) {
    case "minor":
      return {
        bg: "bg-[rgba(255,165,0,0.08)]",
        border: "border-[rgba(255,165,0,0.28)]",
        text: "text-[#ffa500]",
      };
    case "major":
      return {
        bg: "bg-[rgba(255,106,106,0.08)]",
        border: "border-[rgba(255,106,106,0.28)]",
        text: "text-[#ff6a6a]",
      };
    case "critical":
      return {
        bg: "bg-[rgba(255,106,106,0.12)]",
        border: "border-[rgba(255,106,106,0.38)]",
        text: "text-[#ff6a6a]",
      };
    default:
      return {
        bg: "bg-[rgba(255,255,255,0.02)]",
        border: "border-[#2a2d31]",
        text: "text-[#6b6f76]",
      };
  }
}

function tsShort(ts: string) {
  return new Date(ts).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ModernTemplate({ theme, layout, statusPage }: ModernTemplateProps) {
  // keep theme prop for compatibility, but PingSight concept is dark-first
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    if (theme === "light") setIsDark(false);
    else if (theme === "dark") setIsDark(true);
    else {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      setIsDark(mq.matches);
      const onChange = (e: MediaQueryListEvent) => setIsDark(e.matches);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    }
  }, [theme]);

  // Still keep the "modern" feel via subtle glows — but in Graphite palette.
  const primaryColor = statusPage.branding_primary_color || "#b9c7ff";
  const tone = useMemo(
    () => overallTone(statusPage.overall_status || "operational"),
    [statusPage.overall_status]
  );

  const rootBg = isDark ? "bg-[#0b0c0e]" : "bg-[#0b0c0e]"; // product is dark-first
  const cardBg = "bg-[rgba(255,255,255,0.02)]";
  const border = "border border-[#2a2d31]";

  return (
    <div className={cn("min-h-screen font-mono text-[#b0b3b8]", rootBg)}>
      {/* subtle system glow fields */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-40 -right-40 h-[420px] w-[420px] rounded-full blur-[80px] opacity-20"
          style={{ backgroundColor: tone.strip }}
        />
        <div
          className="absolute -bottom-40 -left-40 h-[520px] w-[520px] rounded-full blur-[90px] opacity-10"
          style={{ backgroundColor: primaryColor }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-10">
        {/* Header plate */}
        <Panel className="p-0 overflow-hidden">
          <div className="h-[3px]" style={{ backgroundColor: tone.strip }} />

          <div className="px-6 py-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              {/* Brand block */}
              <div className="flex items-center gap-4 min-w-0">
                {statusPage.branding_logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={statusPage.branding_logo_url}
                    alt={statusPage.name}
                    className="h-11 w-11 object-contain"
                  />
                ) : (
                  <div className={cn("h-11 w-11 grid place-items-center", border, "bg-[rgba(255,255,255,0.03)]")}>
                    <div className="h-4 w-4" style={{ backgroundColor: primaryColor }} />
                  </div>
                )}

                <div className="min-w-0">
                  <div className="text-[#d6d7da] text-[18px] tracking-[0.14em] uppercase truncate">
                    {statusPage.name}
                  </div>
                  {statusPage.description ? (
                    <div className="mt-2 text-[#6f6f6f] text-[12px] leading-relaxed">
                      {statusPage.description}
                    </div>
                  ) : (
                    <div className="mt-2 text-[#5f636a] text-[11px] tracking-[0.12em]">
                      PUBLIC_STATUS_INTERFACE
                    </div>
                  )}
                </div>
              </div>

              {/* Overall status */}
              <div className="text-left lg:text-right">
                <div className="text-[#5f636a] text-[10px] tracking-[0.28em] uppercase">
                  OVERALL_STATUS
                </div>
                <div className="mt-2 flex items-center gap-2 lg:justify-end">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tone.dot }} />
                  <span className={cn("text-[11px] tracking-[0.22em] uppercase font-semibold", tone.text)}>
                    {tone.label}
                  </span>
                </div>

                <div className="mt-3 text-[#5f636a] text-[10px] tracking-[0.26em] uppercase">
                  TEMPLATE: MODERN / LAYOUT: {String(layout || "list").toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </Panel>

        {/* Active Incidents */}
        {statusPage.active_incidents && statusPage.active_incidents.length > 0 ? (
          <section className="mt-8">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[#d6d7da] text-[14px] tracking-[0.18em] uppercase">
                ACTIVE_INCIDENTS
              </div>
              <div className="text-[#5f636a] text-[10px] tracking-[0.26em] uppercase">
                COUNT: {statusPage.active_incidents.length}
              </div>
            </div>

            <div className="space-y-4">
              {statusPage.active_incidents.map((incident: any) => {
                const sev = severityTone(String(incident.severity || "unknown"));
                return (
                  <Panel key={incident.id} className="p-0 overflow-hidden">
                    <div className={cn("h-[2px]", sev.bg)} />

                    <div className="px-6 py-5 border-b border-[#15171a] flex items-start justify-between gap-6">
                      <div className="min-w-0">
                        <div className="text-[#d6d7da] text-[13px] tracking-[0.14em] uppercase truncate">
                          {incident.title}
                        </div>
                        {incident.description ? (
                          <div className="mt-2 text-[#6f6f6f] text-[11px] leading-relaxed">
                            {incident.description}
                          </div>
                        ) : null}
                      </div>

                      <div
                        className={cn(
                          "px-3 py-1 border text-[10px] tracking-[0.22em] uppercase font-semibold whitespace-nowrap",
                          sev.bg,
                          sev.border,
                          sev.text
                        )}
                      >
                        {String(incident.severity || "unknown").toUpperCase()}
                      </div>
                    </div>

                    {incident.updates && incident.updates.length > 0 ? (
                      <div className="px-6 py-5 space-y-4">
                        {incident.updates.slice(0, 4).map((update: any) => (
                          <div key={update.id} className="flex gap-4">
                            <div className="w-[92px] text-[#5f636a] text-[10px] tracking-[0.22em] uppercase whitespace-nowrap">
                              {tsShort(update.created_at)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3">
                                <div
                                  className="text-[10px] tracking-[0.22em] uppercase font-semibold"
                                  style={{ color: primaryColor }}
                                >
                                  {String(update.status || "update").toUpperCase()}
                                </div>
                                <div className="text-[#5f636a] text-[10px] tracking-[0.22em] uppercase">
                                  UPDATE
                                </div>
                              </div>
                              <div className="mt-2 text-[#6f6f6f] text-[11px] leading-relaxed">
                                {update.message}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </Panel>
                );
              })}
            </div>
          </section>
        ) : (
          <section className="mt-8">
            <Panel className="p-0 overflow-hidden">
              <div className="px-6 py-6 flex items-center justify-between">
                <div>
                  <div className="text-[#d6d7da] text-[12px] tracking-[0.26em] uppercase">
                    ACTIVE_INCIDENTS
                  </div>
                  <div className="mt-2 text-[#6f6f6f] text-[11px] tracking-[0.10em]">
                    NONE_REPORTED
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "#f2d48a" }} />
                  <span className="text-[#5f636a] text-[10px] tracking-[0.26em] uppercase">
                    CLEAR
                  </span>
                </div>
              </div>
            </Panel>
          </section>
        )}

        {/* Upcoming Maintenance */}
        {statusPage.upcoming_maintenances && statusPage.upcoming_maintenances.length > 0 ? (
          <section className="mt-8">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[#d6d7da] text-[14px] tracking-[0.18em] uppercase">
                SCHEDULED_MAINTENANCE
              </div>
              <div className="text-[#5f636a] text-[10px] tracking-[0.26em] uppercase">
                COUNT: {statusPage.upcoming_maintenances.length}
              </div>
            </div>

            <div className="space-y-4">
              {statusPage.upcoming_maintenances.map((m: any) => (
                <Panel key={m.id} className="p-0 overflow-hidden">
                  <div className="px-6 py-5 border-b border-[#15171a]">
                    <div className="text-[#d6d7da] text-[13px] tracking-[0.14em] uppercase">
                      {m.title}
                    </div>
                    {m.description ? (
                      <div className="mt-2 text-[#6f6f6f] text-[11px] leading-relaxed">
                        {m.description}
                      </div>
                    ) : null}
                  </div>

                  <div className="px-6 py-5 flex flex-col sm:flex-row gap-3 sm:gap-10 text-[#5f636a] text-[10px] tracking-[0.22em] uppercase">
                    <div>
                      START:{" "}
                      <span className="text-[#d6d7da] tracking-[0.14em]">
                        {new Date(m.scheduled_start).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      END:{" "}
                      <span className="text-[#d6d7da] tracking-[0.14em]">
                        {new Date(m.scheduled_end).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </Panel>
              ))}
            </div>
          </section>
        ) : null}

        {/* Components */}
        {statusPage.components && statusPage.components.length > 0 ? (
          <section className="mt-8">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[#d6d7da] text-[14px] tracking-[0.18em] uppercase">
                COMPONENTS
              </div>
              <div className="text-[#5f636a] text-[10px] tracking-[0.26em] uppercase">
                COUNT: {statusPage.components.length}
              </div>
            </div>

            <div
              className={cn(
                layout === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                  : "space-y-3"
              )}
            >
              {statusPage.components.map((component: any) => {
                const t = overallTone(String(component.current_status || "unknown"));
                return (
                  <div
                    key={component.id}
                    className={cn(border, cardBg, "px-6 py-5")}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-[#d6d7da] text-[13px] tracking-[0.14em] uppercase truncate">
                          {component.name}
                        </div>
                        {component.description ? (
                          <div className="mt-2 text-[#6f6f6f] text-[10px] leading-relaxed">
                            {component.description}
                          </div>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: t.dot }} />
                        <span className={cn("text-[11px] tracking-[0.22em] uppercase", t.text)}>
                          {t.label}
                        </span>
                      </div>
                    </div>

                    {statusPage.show_uptime ? (
                      <div className="mt-4 pt-4 border-t border-[#15171a] flex items-center justify-between">
                        <div className="text-[#5f636a] text-[10px] tracking-[0.26em] uppercase">
                          UPTIME (DISPLAY_ONLY)
                        </div>
                        <div className="text-[#6f6f6f] text-[10px] tracking-[0.22em] uppercase">
                          99.9%
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        {/* Footer */}
        <div className="mt-12 text-center text-[#5f636a] text-[10px] tracking-[0.26em] uppercase pt-10 border-t border-[#1f2227]">
          POWERED_BY_PINGSIGHT
        </div>
      </div>
    </div>
  );
}