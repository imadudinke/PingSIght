"use client";

import { useState, useEffect } from "react";
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
      return { dot: "#10b981", text: "#10b981", label: "OPERATIONAL" };
    case "degraded_performance":
      return { dot: "#f59e0b", text: "#f59e0b", label: "DEGRADED" };
    case "partial_outage":
      return { dot: "#ef4444", text: "#ef4444", label: "PARTIAL_OUTAGE" };
    case "major_outage":
      return { dot: "#dc2626", text: "#dc2626", label: "MAJOR_OUTAGE" };
    default:
      return { dot: "#6b7280", text: "#6b7280", label: "UNKNOWN" };
  }
}

function severityTone(severity: string) {
  switch (severity) {
    case "minor":
      return { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-500" };
    case "major":
      return { bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-500" };
    case "critical":
      return { bg: "bg-red-600/15", border: "border-red-600/40", text: "text-red-600" };
    default:
      return { bg: "bg-gray-500/10", border: "border-gray-500/30", text: "text-gray-500" };
  }
}

export function MinimalTemplate({ theme, layout, statusPage }: MinimalTemplateProps) {
  const [isDark, setIsDark] = useState(false);
  const primaryColor = statusPage.branding_primary_color || "#10b981";
  
  useEffect(() => {
    if (theme === "dark") {
      setIsDark(true);
    } else if (theme === "light") {
      setIsDark(false);
    } else {
      // Auto theme
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      setIsDark(mediaQuery.matches);
      
      const handleChange = (e: MediaQueryListEvent) => setIsDark(e.matches);
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [theme]);
  
  const overallTone = statusTone(statusPage.overall_status || "operational");

  return (
    <div className={cn(
      "min-h-screen font-mono transition-colors duration-300",
      isDark ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"
    )}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className={cn(
          "border rounded-lg p-6 mb-8",
          isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {statusPage.branding_logo_url ? (
                <img
                  src={statusPage.branding_logo_url}
                  alt={statusPage.name}
                  className="h-8 w-8 object-contain"
                />
              ) : (
                <div 
                  className="h-8 w-8 rounded"
                  style={{ backgroundColor: primaryColor }}
                />
              )}
              <div>
                <h1 className="text-xl font-semibold">{statusPage.name}</h1>
                {statusPage.description && (
                  <p className={cn("text-sm mt-1", isDark ? "text-gray-400" : "text-gray-600")}>
                    {statusPage.description}
                  </p>
                )}
              </div>
            </div>
            
            <div className="text-right">
              <div className={cn("text-xs uppercase tracking-wide mb-1", isDark ? "text-gray-500" : "text-gray-400")}>
                Status
              </div>
              <div className="flex items-center gap-2">
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: overallTone.dot }}
                />
                <span className="text-sm font-medium" style={{ color: overallTone.text }}>
                  {overallTone.label}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Active Incidents */}
        {statusPage.active_incidents && statusPage.active_incidents.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Active Incidents</h2>
            <div className="space-y-4">
              {statusPage.active_incidents.map((incident: any) => {
                const sev = severityTone(incident.severity);
                return (
                  <div
                    key={incident.id}
                    className={cn(
                      "border rounded-lg p-4",
                      isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                    )}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-medium">{incident.title}</h3>
                      <span className={cn(
                        "px-2 py-1 text-xs font-medium rounded border",
                        sev.bg, sev.border, sev.text
                      )}>
                        {incident.severity?.toUpperCase()}
                      </span>
                    </div>
                    {incident.description && (
                      <p className={cn("text-sm mb-3", isDark ? "text-gray-400" : "text-gray-600")}>
                        {incident.description}
                      </p>
                    )}
                    {incident.updates && incident.updates.length > 0 && (
                      <div className="space-y-2">
                        {incident.updates.slice(0, 3).map((update: any) => (
                          <div key={update.id} className="text-sm">
                            <div className="flex items-center gap-2 mb-1">
                              <span style={{ color: primaryColor }} className="font-medium text-xs uppercase">
                                {update.status}
                              </span>
                              <span className={cn("text-xs", isDark ? "text-gray-500" : "text-gray-400")}>
                                {new Date(update.created_at).toLocaleString()}
                              </span>
                            </div>
                            <p className={cn(isDark ? "text-gray-300" : "text-gray-700")}>
                              {update.message}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Upcoming Maintenance */}
        {statusPage.upcoming_maintenances && statusPage.upcoming_maintenances.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Scheduled Maintenance</h2>
            <div className="space-y-4">
              {statusPage.upcoming_maintenances.map((maintenance: any) => (
                <div
                  key={maintenance.id}
                  className={cn(
                    "border rounded-lg p-4",
                    isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                  )}
                >
                  <h3 className="font-medium mb-2">{maintenance.title}</h3>
                  {maintenance.description && (
                    <p className={cn("text-sm mb-3", isDark ? "text-gray-400" : "text-gray-600")}>
                      {maintenance.description}
                    </p>
                  )}
                  <div className="flex gap-4 text-sm">
                    <div>
                      <span className={cn("text-xs uppercase tracking-wide", isDark ? "text-gray-500" : "text-gray-400")}>
                        Start:
                      </span>
                      <span className="ml-2">
                        {new Date(maintenance.scheduled_start).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className={cn("text-xs uppercase tracking-wide", isDark ? "text-gray-500" : "text-gray-400")}>
                        End:
                      </span>
                      <span className="ml-2">
                        {new Date(maintenance.scheduled_end).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Components */}
        {statusPage.components && statusPage.components.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Services</h2>
            <div className={cn(
              "space-y-2",
              layout === "grid" && "grid grid-cols-1 md:grid-cols-2 gap-4 space-y-0"
            )}>
              {statusPage.components.map((component: any) => {
                const componentTone = statusTone(component.current_status);
                return (
                  <div
                    key={component.id}
                    className={cn(
                      "border rounded-lg p-4 flex items-center justify-between",
                      isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                    )}
                  >
                    <div>
                      <h3 className="font-medium">{component.name}</h3>
                      {component.description && (
                        <p className={cn("text-sm mt-1", isDark ? "text-gray-400" : "text-gray-600")}>
                          {component.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: componentTone.dot }}
                      />
                      <span className="text-sm" style={{ color: componentTone.text }}>
                        {componentTone.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className={cn(
          "text-center text-xs pt-8 border-t",
          isDark ? "text-gray-500 border-gray-700" : "text-gray-400 border-gray-200"
        )}>
          Powered by PingSight
        </div>
      </div>
    </div>
  );
}