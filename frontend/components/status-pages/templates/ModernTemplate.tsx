"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils/ui";

interface ModernTemplateProps {
  theme: string;
  layout: string;
  statusPage: any;
}

function statusTone(status: string) {
  switch (status) {
    case "operational":
      return { 
        gradient: "from-emerald-500 to-green-500", 
        text: "text-emerald-400", 
        label: "All Systems Operational",
        glow: "shadow-emerald-500/20"
      };
    case "degraded_performance":
      return { 
        gradient: "from-amber-500 to-orange-500", 
        text: "text-amber-400", 
        label: "Degraded Performance",
        glow: "shadow-amber-500/20"
      };
    case "partial_outage":
      return { 
        gradient: "from-red-500 to-rose-500", 
        text: "text-red-400", 
        label: "Partial Outage",
        glow: "shadow-red-500/20"
      };
    case "major_outage":
      return { 
        gradient: "from-red-600 to-red-700", 
        text: "text-red-400", 
        label: "Major Outage",
        glow: "shadow-red-600/30"
      };
    default:
      return { 
        gradient: "from-gray-500 to-gray-600", 
        text: "text-gray-400", 
        label: "Unknown Status",
        glow: "shadow-gray-500/20"
      };
  }
}

function severityTone(severity: string) {
  switch (severity) {
    case "minor":
      return { 
        bg: "bg-gradient-to-r from-amber-500/10 to-orange-500/10", 
        border: "border-amber-500/30", 
        text: "text-amber-400",
        glow: "shadow-lg shadow-amber-500/10"
      };
    case "major":
      return { 
        bg: "bg-gradient-to-r from-red-500/10 to-rose-500/10", 
        border: "border-red-500/30", 
        text: "text-red-400",
        glow: "shadow-lg shadow-red-500/10"
      };
    case "critical":
      return { 
        bg: "bg-gradient-to-r from-red-600/15 to-red-700/15", 
        border: "border-red-600/40", 
        text: "text-red-400",
        glow: "shadow-lg shadow-red-600/20"
      };
    default:
      return { 
        bg: "bg-gradient-to-r from-gray-500/10 to-gray-600/10", 
        border: "border-gray-500/30", 
        text: "text-gray-400",
        glow: "shadow-lg shadow-gray-500/10"
      };
  }
}

export function ModernTemplate({ theme, layout, statusPage }: ModernTemplateProps) {
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
      "min-h-screen font-sans transition-all duration-500",
      isDark 
        ? "bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 text-gray-100" 
        : "bg-gradient-to-br from-slate-50 via-white to-gray-50 text-gray-900"
    )}>
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={cn(
          "absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-20 animate-pulse",
          `bg-gradient-to-br ${overallTone.gradient}`
        )} />
        <div className={cn(
          "absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-10 animate-pulse",
          `bg-gradient-to-tr ${overallTone.gradient}`
        )} style={{ animationDelay: "2s" }} />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className={cn(
          "backdrop-blur-xl border rounded-2xl p-8 mb-12 transition-all duration-300 hover:scale-[1.01]",
          overallTone.glow,
          isDark 
            ? "bg-gray-800/40 border-gray-700/50" 
            : "bg-white/60 border-gray-200/50"
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              {statusPage.branding_logo_url ? (
                <div className="relative">
                  <img
                    src={statusPage.branding_logo_url}
                    alt={statusPage.name}
                    className="h-12 w-12 object-contain"
                  />
                  <div className={cn(
                    "absolute inset-0 rounded-full blur-xl opacity-30",
                    `bg-gradient-to-br ${overallTone.gradient}`
                  )} />
                </div>
              ) : (
                <div className="relative">
                  <div 
                    className="h-12 w-12 rounded-xl shadow-lg"
                    style={{ 
                      background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` 
                    }}
                  />
                  <div 
                    className="absolute inset-0 rounded-xl blur-xl opacity-40"
                    style={{ backgroundColor: primaryColor }}
                  />
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                  {statusPage.name}
                </h1>
                {statusPage.description && (
                  <p className={cn("text-lg mt-2", isDark ? "text-gray-300" : "text-gray-600")}>
                    {statusPage.description}
                  </p>
                )}
              </div>
            </div>
            
            <div className="text-right">
              <div className={cn("text-sm uppercase tracking-wider mb-3 font-medium", isDark ? "text-gray-400" : "text-gray-500")}>
                System Status
              </div>
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-4 h-4 rounded-full animate-pulse",
                  `bg-gradient-to-br ${overallTone.gradient}`,
                  overallTone.glow
                )} />
                <span className={cn("text-lg font-semibold", overallTone.text)}>
                  {overallTone.label}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Active Incidents */}
        {statusPage.active_incidents && statusPage.active_incidents.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-red-500 to-rose-500 bg-clip-text text-transparent">
              Active Incidents
            </h2>
            <div className="space-y-6">
              {statusPage.active_incidents.map((incident: any) => {
                const sev = severityTone(incident.severity);
                return (
                  <div
                    key={incident.id}
                    className={cn(
                      "backdrop-blur-xl border rounded-2xl p-6 transition-all duration-300 hover:scale-[1.01]",
                      sev.glow,
                      isDark ? "bg-gray-800/40 border-gray-700/50" : "bg-white/60 border-gray-200/50"
                    )}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-xl font-semibold">{incident.title}</h3>
                      <span className={cn(
                        "px-4 py-2 text-sm font-bold rounded-full border backdrop-blur-sm",
                        sev.bg, sev.border, sev.text
                      )}>
                        {incident.severity?.toUpperCase()}
                      </span>
                    </div>
                    {incident.description && (
                      <p className={cn("text-base mb-4", isDark ? "text-gray-300" : "text-gray-600")}>
                        {incident.description}
                      </p>
                    )}
                    {incident.updates && incident.updates.length > 0 && (
                      <div className="space-y-4">
                        {incident.updates.slice(0, 3).map((update: any) => (
                          <div key={update.id} className={cn(
                            "p-4 rounded-xl border",
                            isDark ? "bg-gray-900/30 border-gray-700/30" : "bg-gray-50/50 border-gray-200/30"
                          )}>
                            <div className="flex items-center gap-3 mb-2">
                              <span 
                                style={{ color: primaryColor }} 
                                className="font-bold text-sm uppercase tracking-wider"
                              >
                                {update.status}
                              </span>
                              <span className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
                                {new Date(update.created_at).toLocaleString()}
                              </span>
                            </div>
                            <p className={cn("leading-relaxed", isDark ? "text-gray-200" : "text-gray-700")}>
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
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
              Scheduled Maintenance
            </h2>
            <div className="space-y-6">
              {statusPage.upcoming_maintenances.map((maintenance: any) => (
                <div
                  key={maintenance.id}
                  className={cn(
                    "backdrop-blur-xl border rounded-2xl p-6 transition-all duration-300 hover:scale-[1.01] shadow-lg shadow-blue-500/10",
                    isDark ? "bg-gray-800/40 border-gray-700/50" : "bg-white/60 border-gray-200/50"
                  )}
                >
                  <h3 className="text-xl font-semibold mb-3">{maintenance.title}</h3>
                  {maintenance.description && (
                    <p className={cn("text-base mb-4", isDark ? "text-gray-300" : "text-gray-600")}>
                      {maintenance.description}
                    </p>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={cn(
                      "p-3 rounded-lg border",
                      isDark ? "bg-gray-900/30 border-gray-700/30" : "bg-gray-50/50 border-gray-200/30"
                    )}>
                      <span className={cn("text-xs uppercase tracking-wider font-medium", isDark ? "text-gray-400" : "text-gray-500")}>
                        Start Time
                      </span>
                      <div className="mt-1 font-semibold">
                        {new Date(maintenance.scheduled_start).toLocaleString()}
                      </div>
                    </div>
                    <div className={cn(
                      "p-3 rounded-lg border",
                      isDark ? "bg-gray-900/30 border-gray-700/30" : "bg-gray-50/50 border-gray-200/30"
                    )}>
                      <span className={cn("text-xs uppercase tracking-wider font-medium", isDark ? "text-gray-400" : "text-gray-500")}>
                        End Time
                      </span>
                      <div className="mt-1 font-semibold">
                        {new Date(maintenance.scheduled_end).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Components */}
        {statusPage.components && statusPage.components.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
              Service Components
            </h2>
            <div className={cn(
              layout === "grid" 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
                : "space-y-4"
            )}>
              {statusPage.components.map((component: any) => {
                const componentTone = statusTone(component.current_status);
                return (
                  <div
                    key={component.id}
                    className={cn(
                      "backdrop-blur-xl border rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02]",
                      componentTone.glow,
                      isDark ? "bg-gray-800/40 border-gray-700/50" : "bg-white/60 border-gray-200/50"
                    )}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold">{component.name}</h3>
                      <div className={cn(
                        "w-3 h-3 rounded-full animate-pulse",
                        `bg-gradient-to-br ${componentTone.gradient}`
                      )} />
                    </div>
                    {component.description && (
                      <p className={cn("text-sm mb-4", isDark ? "text-gray-300" : "text-gray-600")}>
                        {component.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className={cn("text-sm font-medium", componentTone.text)}>
                        {componentTone.label}
                      </span>
                      {statusPage.show_uptime && (
                        <span className={cn("text-xs", isDark ? "text-gray-400" : "text-gray-500")}>
                          99.9% uptime
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className={cn(
          "text-center pt-12 border-t backdrop-blur-sm",
          isDark ? "text-gray-400 border-gray-700/50" : "text-gray-500 border-gray-200/50"
        )}>
          <div className="text-sm font-medium bg-gradient-to-r from-gray-600 to-gray-400 bg-clip-text text-transparent">
            Powered by PingSight
          </div>
        </div>
      </div>
    </div>
  );
}