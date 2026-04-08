"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/ui";
import { Panel } from "@/components/dashboard/Panel";

interface MinimalTemplateProps {
  theme: string;
  layout: string;
  statusPage: any;
}

function statusTone(status: string) {
  switch (status) {
    case "operational":
      return { dot: "#f2d48a", text: "#f2d48a", label: "OPERATIONAL" };
    case "degraded_performance":
      return { dot: "#ffa500", text: "#ffa500", label: "DEGRADED" };
    case "partial_outage":
      return { dot: "#ff6a6a", text: "#ff6a6a", label: "PARTIAL_OUTAGE" };
    case "major_outage":
      return { dot: "#ff6a6a", text: "#ff6a6a", label: "MAJOR_OUTAGE" };
    default:
      return { dot: "#6b6f76", text: "#6b6f76", label: "UNKNOWN" };
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

function ts(ts: string) {
  return new Date(ts).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MinimalTemplate({ theme, layout, statusPage }: MinimalTemplateProps) {
  const [isDark, setIsDark] = useState(false);
  const primaryColor = statusPage.branding_primary_color || "#b9c7ff";

  useEffect(() => {
    if (theme === "dark") {
      setIsDark(true);
    } else if (theme === "light") {
      setIsDark(false);
    } else {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      setIsDark(mediaQuery.matches);

      const handleChange = (e: MediaQueryListEvent) => setIsDark(e.matches);
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [theme]);

  const overallTone = statusTone(statusPage.overall_status || "operational");

  // Keep “minimal” while matching PingSight system palette.
  // If theme === light, we still keep dark UI (your product concept is dark-first).
  const rootBg = isDark ? "bg-[#0b0c0e]" : "bg-[#0b0c0e]";

  return (
    <div className={cn("min-h-screen font-mono text-[#b0b3b8]", rootBg)}>
      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Header plate */}
        <Panel className="p-0 overflow-hidden">
          <div
            className="h-[3px]"
            style={{ backgroundColor: primaryColor }}
          />

          <div className="px-6 py-6">
            <div className="flex items-start justify-between gap-6">
              <div className="flex items-center gap-4 min-w-0">
                {statusPage.branding_logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={statusPage.branding_logo_url}
                    alt={statusPage.name}
                    className="h-10 w-10 object-contain"
                  />
                ) : (
                  <div className="h-10 w-10 border border-[#2a2d31] bg-[rgba(255,255,255,0.03)] grid place-items-center">
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
                  ) : null}
                </div>
              </div>

              {/* Overall status */}
              <div className="text-right">
                <div className="text-[#5f636a] text-[10px] tracking-[0.28em] uppercase">
                  OVERALL_STATUS
                </div>
                <div className="mt-2 flex items-center justify-end gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: overallTone.dot }}
                  />
                  <span
                    className="text-[11px] tracking-[0.22em] uppercase font-semibold"
                    style={{ color: overallTone.text }}
                  >
                    {overallTone.label}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Panel>

        {/* ACTIVE INCIDENTS */}
        {statusPage.active_incidents && statusPage.active_incidents.length > 0 ? (
          <div className="mt-8">
            <div className="text-[#d6d7da] text-[14px] tracking-[0.18em] uppercase mb-3">
              ACTIVE_INCIDENTS
            </div>

            <div className="space-y-4">
              {statusPage.active_incidents.map((incident: any) => {
                const sev = severityTone(String(incident.severity || "unknown"));
                return (
                  <Panel key={incident.id} className="p-0 overflow-hidden">
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
                          "px-3 py-1 border text-[10px] tracking-[0.22em] uppercase font-semibold",
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
                        {incident.updates.slice(0, 3).map((update: any) => (
                          <div key={update.id} className="flex gap-4">
                            <div className="w-[88px] text-[#5f636a] text-[10px] tracking-[0.22em] uppercase whitespace-nowrap">
                              {ts(update.created_at)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div
                                className="text-[10px] tracking-[0.22em] uppercase font-semibold"
                                style={{ color: primaryColor }}
                              >
                                {String(update.status || "update").toUpperCase()}
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
          </div>
        ) : null}

        {/* SCHEDULED MAINTENANCE */}
        {statusPage.upcoming_maintenances && statusPage.upcoming_maintenances.length > 0 ? (
          <div className="mt-8">
            <div className="text-[#d6d7da] text-[14px] tracking-[0.18em] uppercase mb-3">
              SCHEDULED_MAINTENANCE
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
          </div>
        ) : null}

        {/* COMPONENTS */}
        {statusPage.components && statusPage.components.length > 0 ? (
          <div className="mt-8">
            <div className="text-[#d6d7da] text-[14px] tracking-[0.18em] uppercase mb-3">
              COMPONENTS
            </div>

            <div
              className={cn(
                layout === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 gap-4"
                  : "space-y-3"
              )}
            >
              {statusPage.components.map((c: any) => {
                const t = statusTone(String(c.current_status || "unknown"));
                return (
                  <Panel key={c.id} className="p-0 overflow-hidden">
                    <div className="px-6 py-5 flex items-center justify-between gap-6">
                      <div className="min-w-0">
                        <div className="text-[#d6d7da] text-[13px] tracking-[0.14em] uppercase truncate">
                          {c.name}
                        </div>
                        {c.description ? (
                          <div className="mt-2 text-[#6f6f6f] text-[10px] leading-relaxed">
                            {c.description}
                          </div>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: t.dot }} />
                        <span
                          className="text-[11px] tracking-[0.22em] uppercase"
                          style={{ color: t.text }}
                        >
                          {t.label}
                        </span>
                      </div>
                    </div>
                  </Panel>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* Footer */}
        <div className="mt-12 text-center text-[#5f636a] text-[10px] tracking-[0.26em] uppercase pt-10 border-t border-[#1f2227]">
          POWERED_BY_PINGSIGHT
        </div>
      </div>
    </div>
  );
}