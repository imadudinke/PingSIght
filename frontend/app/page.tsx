"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import LoginModal from "@/components/auth/LoginModal";
import { useAuth } from "@/contexts/AuthContext";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function Panel({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "relative border border-[#1b1d20]",
        "bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))]",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.06),transparent_55%)] opacity-[0.35]" />
      <div className="relative">{children}</div>
    </div>
  );
}

function Metric({ value, label, tone }: { value: string; label: string; tone: "blue" | "sand" | "white" }) {
  const color =
    tone === "blue" ? "text-[#b9c7ff]" : tone === "sand" ? "text-[#f2d48a]" : "text-[#d6d7da]";
  return (
    <div>
      <div className={cn("text-[22px] leading-none font-semibold tracking-tight", color)}>{value}</div>
      <div className="mt-2 text-[#5f636a] text-[10px] tracking-[0.28em] uppercase">{label}</div>
    </div>
  );
}

function GhostButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "h-[46px] px-8",
        "border border-[#2a2d31] bg-[rgba(255,255,255,0.02)]",
        "text-[#d6d7da] hover:text-[#b9c7ff] hover:border-[#b9c7ff] transition",
        "text-[11px] tracking-[0.26em] uppercase font-mono"
      )}
    >
      {children}
    </button>
  );
}

function PrimaryButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "h-[46px] px-8",
        "bg-[#b9c7ff] text-[#0b0c0e] border border-[#c8d2ff]",
        "hover:brightness-95 transition",
        "text-[11px] tracking-[0.26em] uppercase font-mono font-semibold"
      )}
    >
      {children}
    </button>
  );
}

function TopTab({ active, children, href }: { active?: boolean; children: React.ReactNode; href?: string }) {
  return (
    <a
      href={href ?? "#"}
      className={cn(
        "relative pt-[2px] pb-[10px]",
        "text-[11px] tracking-[0.26em] uppercase font-mono",
        active ? "text-[#f2d48a]" : "text-[#6f6f6f] hover:text-[#d6d7da] transition"
      )}
    >
      {children}
      {active && <span className="absolute left-0 right-0 -bottom-[1px] h-[2px] bg-[#f2d48a]" />}
    </a>
  );
}

export default function Home() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { isAuthenticated, logout, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!isLoading && isAuthenticated) router.push("/dashboard");
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    const error = searchParams.get("error");
    if (!error) return;

    const errorMessages: Record<string, string> = {
      auth_failed: "AUTHENTICATION_FAILED — PLEASE TRY AGAIN",
      database_error: "DATABASE_ERROR — PLEASE CONTACT SUPPORT",
      no_token: "NO_TOKEN_RECEIVED — AUTHENTICATION INCOMPLETE",
    };

    setErrorMessage(errorMessages[error] || "UNKNOWN_ERROR — PLEASE TRY AGAIN");
    const t = setTimeout(() => setErrorMessage(null), 5000);
    return () => clearTimeout(t);
  }, [searchParams]);

  const navCta = useMemo(() => {
    if (isAuthenticated) {
      return (
        <button
          onClick={logout}
          className={cn(
            "h-[34px] px-5",
            "border border-[#ff6a6a] text-[#ff6a6a]",
            "hover:bg-[#ff6a6a] hover:text-[#0b0c0e] transition",
            "text-[11px] tracking-[0.26em] uppercase font-mono"
          )}
        >
          LOGOUT
        </button>
      );
    }
    return (
      <button
        onClick={() => setIsLoginOpen(true)}
        className={cn(
          "h-[34px] px-5",
          "border border-[#b9c7ff] text-[#b9c7ff]",
          "hover:bg-[#b9c7ff] hover:text-[#0b0c0e] transition",
          "text-[11px] tracking-[0.26em] uppercase font-mono"
        )}
      >
        LOGIN
      </button>
    );
  }, [isAuthenticated, logout]);

  return (
    <div className="min-h-screen bg-[#0b0c0e] text-[#b0b3b8] font-mono selection:bg-[#b9c7ff] selection:text-black">
      {/* Background: base + glow + vignette + grain (same as Dashboard) */}
      <div className="fixed inset-0 -z-10 bg-[#0b0c0e]" />
      <div className="fixed inset-0 -z-10 opacity-[0.22] bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.08),transparent_55%)]" />
      <div className="fixed inset-0 -z-10 opacity-[0.35] bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0),rgba(0,0,0,0.85))]" />
      <div
        className="fixed inset-0 -z-10 opacity-[0.08] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)' opacity='.55'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Error toast — restyled to match plates */}
      {errorMessage && (
        <div className="fixed top-24 right-8 z-50">
          <Panel className="w-[420px]">
            <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#ff6a6a]" />
            <div className="px-5 py-4 flex items-start gap-4">
              <div className="text-[#ff6a6a] text-[12px] leading-none pt-1">!</div>
              <div className="flex-1">
                <div className="text-[#ff6a6a] text-[10px] tracking-[0.28em] uppercase">
                  ERROR
                </div>
                <div className="mt-2 text-[#6f6f6f] text-[11px] tracking-[0.12em]">
                  {errorMessage}
                </div>
              </div>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-[#6f6f6f] hover:text-[#d6d7da] transition text-[12px]"
                aria-label="Dismiss error"
              >
                ×
              </button>
            </div>
          </Panel>
        </div>
      )}

      {/* NAV (Observatory style) */}
      <header className="fixed top-0 left-0 right-0 z-50 h-[64px] border-b border-[#1b1d20] bg-[rgba(10,10,11,0.25)] backdrop-blur-[2px]">
        <div className="h-full max-w-[1400px] mx-auto px-8 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="h-9 w-9 border border-[#2a2d31] bg-[rgba(255,255,255,0.03)] grid place-items-center">
              <div className="h-4 w-4 bg-[#b9c7ff]" />
            </div>
            <div>
              <div className="text-[#d6d7da] text-[14px] tracking-[0.10em] uppercase">
                PINGSIGHT
              </div>
              <div className="text-[#6f6f6f] text-[10px] tracking-[0.26em] uppercase">
                OBSERVATORY_FRONTEND
              </div>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-7">
            <TopTab active href="#overview">OBSERVATORY</TopTab>
            <TopTab href="#capabilities">CAPABILITIES</TopTab>
            <TopTab href="#diagnostics">DIAGNOSTICS</TopTab>
            <TopTab href="#spec">SYSTEM</TopTab>
          </nav>

          <div className="flex items-center gap-3">
            <input
              className="hidden md:block w-[240px] h-[34px] px-3 bg-[rgba(0,0,0,0.28)] border border-[#2a2d31] text-[11px] tracking-[0.20em] uppercase placeholder:text-[#60646b] focus:outline-none focus:border-[#b9c7ff]"
              placeholder="QUERY_SIGNAL..."
            />
            {navCta}
          </div>
        </div>
      </header>

      {/* HERO (Figma composition) */}
      <main id="overview" className="pt-[112px] pb-20">
        <div className="max-w-[1400px] mx-auto px-8">
          <div className="text-[#5f636a] text-[10px] tracking-[0.32em] uppercase">
            SYSTEM_IDENTITY: PINGSIGHT K-20
          </div>

          <div className="mt-5 grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-12 items-start">
            {/* Left: giant wordmark style title */}
            <div>
              <h1 className="text-[#d6d7da] font-black uppercase tracking-[-0.03em] leading-[0.86] text-[78px] sm:text-[96px] lg:text-[112px]">
                THE
                <br />
                OBSERVATORY
              </h1>

              <div className="mt-8 max-w-[520px] text-[#6f6f6f] text-[13px] leading-relaxed">
                A schematic synthesis of global network intelligence. We translate cold telemetry
                into high-fidelity visibility. Monitor the pulse of the digital void with
                military-grade precision.
              </div>

              <div className="mt-10 flex flex-wrap gap-3">
                <PrimaryButton onClick={() => setIsLoginOpen(true)}>
                  INITIATE_OBSERVER
                </PrimaryButton>
                <GhostButton onClick={() => router.push("/docs")}>READ_PROTOCOL</GhostButton>
              </div>

              <div className="mt-10 border-t border-[#1b1d20] pt-6 grid grid-cols-3 gap-8">
                <Metric value="30s" label="CHECK_INTERVAL" tone="blue" />
                <Metric value="99.9%" label="UPTIME_TARGET" tone="white" />
                <Metric value="<5ms" label="DETECTION" tone="sand" />
              </div>
            </div>

            {/* Right: render panel like Figma (mechanical silhouette) */}
            <Panel className="p-6">
              <div className="flex items-start justify-between">
                <div className="text-[#5f636a] text-[10px] tracking-[0.28em] uppercase">
                  [MC-VII_008]
                </div>
                <div className="text-right text-[#5f636a] text-[10px] tracking-[0.26em] uppercase">
                  SIGNAL: 88.2%
                  <br />
                  LATENCY: 12ms
                </div>
              </div>

              <div className="mt-6 h-[260px] border border-[#15171a] bg-[rgba(0,0,0,0.18)] relative overflow-hidden">
                {/* “Machine” silhouette approximation */}
                <div className="absolute inset-0 opacity-[0.55] bg-[radial-gradient(circle_at_60%_40%,rgba(255,255,255,0.10),transparent_55%)]" />
                <div className="absolute left-[56%] top-[18%] w-[110px] h-[220px] border border-[#2a2d31]" />
                <div className="absolute left-[66%] top-[8%] w-[24px] h-[260px] border-x border-[#2a2d31]" />
                <div className="absolute left-[48%] top-[36%] w-[220px] h-[220px] rounded-full border border-[#2a2d31]" />
                <div className="absolute left-[58%] top-[56%] w-[120px] h-[120px] rounded-full border border-[#2a2d31]" />
              </div>

              <div className="mt-5 flex items-center justify-between">
                <div className="text-[#5f636a] text-[10px] tracking-[0.28em] uppercase">
                  AUTH_PROTOCOL: V4.0
                </div>
                <div className="text-[#5f636a] text-[10px] tracking-[0.28em] uppercase">
                  NODE: SG-1
                </div>
              </div>
            </Panel>
          </div>
        </div>
      </main>

      {/* CAPABILITIES (use Figma modules) */}
      <section id="capabilities" className="py-16">
        <div className="max-w-[1400px] mx-auto px-8">
          <div className="text-[#5f636a] text-[10px] tracking-[0.28em] uppercase">
            MODULE_INDEX
          </div>
          <div className="mt-3 text-[#d6d7da] text-[28px] tracking-[-0.02em] font-bold uppercase">
            SYSTEM_CAPABILITIES
          </div>

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Panel className="p-8">
              <div className="text-[#b9c7ff] text-[10px] tracking-[0.28em] uppercase">MODULE_01</div>
              <div className="mt-3 text-[#d6d7da] text-[22px] font-bold uppercase tracking-tight">
                SIMPLE_MONITORING
              </div>
              <div className="mt-4 text-[#6f6f6f] text-[12px] leading-relaxed">
                Monitor endpoints with status validation, timing, SSL expiry and domain health. Designed for APIs and
                public sites.
              </div>

              <div className="mt-6 space-y-3 text-[11px] tracking-[0.14em] text-[#8b8f96]">
                <div className="flex items-center gap-3">
                  <span className="text-[#b9c7ff]">✓</span> HTTP_STATUS + LATENCY
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[#b9c7ff]">✓</span> SSL_EXPIRY SIGNALING
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[#b9c7ff]">✓</span> 30–3600s INTERVALS
                </div>
              </div>
            </Panel>

            <Panel className="p-8">
              <div className="text-[#f2d48a] text-[10px] tracking-[0.28em] uppercase">MODULE_02</div>
              <div className="mt-3 text-[#d6d7da] text-[22px] font-bold uppercase tracking-tight">
                SCENARIO_MONITORING
              </div>
              <div className="mt-4 text-[#6f6f6f] text-[12px] leading-relaxed">
                Multi-step journey tracing with step timing, failure point location and deep request diagnostics.
              </div>

              <div className="mt-6 space-y-3 text-[11px] tracking-[0.14em] text-[#8b8f96]">
                <div className="flex items-center gap-3">
                  <span className="text-[#f2d48a]">✓</span> STEP_TIMING BREAKDOWN
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[#f2d48a]">✓</span> FAILURE POINT IDENTIFICATION
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[#f2d48a]">✓</span> UP TO 3 STEPS / SCENARIO
                </div>
              </div>
            </Panel>
          </div>
        </div>
      </section>

      {/* DIAGNOSTICS (waterfall like your system) */}
      <section id="diagnostics" className="py-16">
        <div className="max-w-[1400px] mx-auto px-8">
          <div className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-10 items-start">
            <div>
              <div className="text-[#5f636a] text-[10px] tracking-[0.28em] uppercase">
                PERFORMANCE_ANALYSIS
              </div>
              <div className="mt-3 text-[#d6d7da] text-[36px] font-black uppercase tracking-tight leading-[0.92]">
                DEEP_TRACE
                <br />
                DIAGNOSTICS
              </div>
              <div className="mt-6 text-[#6f6f6f] text-[13px] leading-relaxed">
                Every request is instrumented with trace hooks that capture timing at each network layer. Identify
                bottlenecks in DNS, TCP, TLS and time-to-first-byte.
              </div>
            </div>

            <Panel className="p-8">
              <div className="text-[#5f636a] text-[10px] tracking-[0.28em] uppercase">
                WATERFALL_VISUALIZATION
              </div>
              <div className="mt-2 text-[#d6d7da] text-[18px] font-bold uppercase tracking-tight">
                REQUEST_TIMELINE
              </div>

              <div className="mt-7 space-y-5">
                {[
                  { k: "DNS_LOOKUP", v: "12ms", left: "0%", w: "15%", c: "#b9c7ff" },
                  { k: "TCP_CONNECT", v: "24ms", left: "15%", w: "25%", c: "#b9c7ff" },
                  { k: "TLS_HANDSHAKE", v: "58ms", left: "40%", w: "35%", c: "#f2d48a" },
                  { k: "TTFB", v: "142ms", left: "75%", w: "25%", c: "#b9c7ff" },
                ].map((row) => (
                  <div key={row.k}>
                    <div className="flex items-center justify-between text-[10px] tracking-[0.26em] uppercase">
                      <span className="text-[#5f636a]">{row.k}</span>
                      <span style={{ color: row.c }}>{row.v}</span>
                    </div>
                    <div className="mt-2 h-[10px] border border-[#15171a] bg-[rgba(0,0,0,0.22)] relative">
                      <div
                        className="absolute top-0 h-full"
                        style={{ left: row.left, width: row.w, backgroundColor: row.c, opacity: 0.95 }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-7 pt-6 border-t border-[#15171a] text-[#5f636a] text-[10px] tracking-[0.28em] uppercase">
                TOTAL_LATENCY: <span className="text-[#d6d7da] tracking-[0.20em]">236ms</span>
              </div>
            </Panel>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-[980px] mx-auto px-8 text-center">
          <div className="text-[#5f636a] text-[10px] tracking-[0.28em] uppercase">READY_TO_START</div>
          <div className="mt-4 text-[#d6d7da] text-[44px] font-black uppercase tracking-tight leading-[0.92]">
            DEPLOY YOUR FIRST
            <br />
            MONITOR IN 60 SECONDS
          </div>
          <div className="mt-6 text-[#6f6f6f] text-[13px] leading-relaxed">
            No credit card required. Start monitoring with anomaly detection, SSL tracking and domain expiry alerts.
          </div>

          <div className="mt-10 flex items-center justify-center gap-3">
            <PrimaryButton onClick={() => setIsLoginOpen(true)}>START_FREE_TRIAL</PrimaryButton>
            <GhostButton onClick={() => router.push("/docs")}>VIEW_DOCUMENTATION</GhostButton>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#1b1d20] py-10">
        <div className="max-w-[1400px] mx-auto px-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="text-[#d6d7da] text-[12px] tracking-[0.22em] uppercase">
              PINGSIGHT_SYSTEMS
            </div>
            <div className="mt-2 text-[#5f636a] text-[10px] tracking-[0.28em] uppercase">
              BUILD: V2.0.4_GRAPHITE — STATUS: OPERATIONAL
            </div>
          </div>

          <div className="text-[#5f636a] text-[10px] tracking-[0.28em] uppercase">
            © 2024 ALL_RIGHTS_RESERVED
          </div>
        </div>
      </footer>

      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </div>
  );
}