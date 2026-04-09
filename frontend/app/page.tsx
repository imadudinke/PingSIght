"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
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
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.querySelector(href || '');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <a
      href={href ?? "#"}
      onClick={handleClick}
      className={cn(
        "relative pt-[2px] pb-[10px]",
        "text-[11px] tracking-[0.26em] uppercase font-mono cursor-pointer",
        active ? "text-[#f2d48a]" : "text-[#6f6f6f] hover:text-[#d6d7da] transition"
      )}
    >
      {children}
      {active && <span className="absolute left-0 right-0 -bottom-[1px] h-[2px] bg-[#f2d48a]" />}
    </a>
  );
}

export default function Home() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>("overview");

  const { isAuthenticated, logout, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // All hooks must be called before any conditional returns
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
      <Link
        href="/login"
        className={cn(
          "h-[34px] px-5 flex items-center",
          "border border-[#b9c7ff] text-[#b9c7ff]",
          "hover:bg-[#b9c7ff] hover:text-[#0b0c0e] transition",
          "text-[11px] tracking-[0.26em] uppercase font-mono"
        )}
      >
        LOGIN
      </Link>
    );
  }, [isAuthenticated, logout]);

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

  // Scroll spy effect to update active section
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['overview', 'capabilities', 'diagnostics'];
      const scrollPosition = window.scrollY + 100; // Offset for header

      for (const sectionId of sections) {
        const section = document.getElementById(sectionId);
        if (section) {
          const { offsetTop, offsetHeight } = section;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Call once on mount

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
        <div className="fixed top-20 sm:top-24 right-4 sm:right-8 z-50 max-w-[calc(100vw-2rem)]">
          <Panel className="w-full sm:w-[420px]">
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
      <header className="fixed top-0 left-0 right-0 z-50 h-[56px] sm:h-[64px] border-b border-[#1b1d20] bg-[rgba(10,10,11,0.25)] backdrop-blur-[2px]">
        <div className="h-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-5">
            <div className="h-8 w-8 sm:h-9 sm:w-9 border border-[#2a2d31] bg-[rgba(255,255,255,0.03)] grid place-items-center flex-shrink-0">
              <div className="h-3 w-3 sm:h-4 sm:w-4 bg-[#b9c7ff]" />
            </div>
            <div className="min-w-0">
              <div className="text-[#d6d7da] text-[11px] sm:text-[14px] tracking-[0.10em] uppercase">
                PINGSIGHT
              </div>
              <div className="text-[#6f6f6f] text-[8px] sm:text-[10px] tracking-[0.26em] uppercase truncate">
                OBSERVATORY
              </div>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-7">
            <TopTab active={activeSection === "overview"} href="#overview">OBSERVATORY</TopTab>
            <TopTab active={activeSection === "capabilities"} href="#capabilities">CAPABILITIES</TopTab>
            <TopTab active={activeSection === "diagnostics"} href="#diagnostics">DIAGNOSTICS</TopTab>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <input
              className="hidden md:block w-[180px] lg:w-[240px] h-[32px] sm:h-[34px] px-3 bg-[rgba(0,0,0,0.28)] border border-[#2a2d31] text-[10px] sm:text-[11px] tracking-[0.20em] uppercase placeholder:text-[#60646b] focus:outline-none focus:border-[#b9c7ff]"
              placeholder="QUERY..."
            />
            {navCta}
          </div>
        </div>
      </header>

      {/* HERO (Figma composition) */}
      <main id="overview" className="pt-[72px] sm:pt-[88px] lg:pt-[112px] pb-12 sm:pb-16 lg:pb-20">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-[#5f636a] text-[9px] sm:text-[10px] tracking-[0.32em] uppercase">
            SYSTEM_IDENTITY: PINGSIGHT K-20
          </div>

          <div className="mt-5 grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-8 lg:gap-12 items-start">
            {/* Left: giant wordmark style title */}
            <div>
              <h1 className="text-[#d6d7da] font-black uppercase tracking-[-0.03em] leading-[0.86] text-[42px] sm:text-[56px] md:text-[72px] lg:text-[96px] xl:text-[112px]">
                THE
                <br />
                OBSERVATORY
              </h1>

              <div className="mt-6 sm:mt-8 max-w-[520px] text-[#6f6f6f] text-[12px] sm:text-[13px] leading-relaxed">
                A schematic synthesis of global network intelligence. We translate cold telemetry
                into high-fidelity visibility. Monitor the pulse of the digital void with
                military-grade precision.
              </div>

              <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row flex-wrap gap-3">
                <Link href="/login">
                  <PrimaryButton>
                    INITIATE_OBSERVER
                  </PrimaryButton>
                </Link>
                <GhostButton onClick={() => router.push("/docs")}>READ_PROTOCOL</GhostButton>
              </div>

              <div className="mt-8 sm:mt-10 border-t border-[#1b1d20] pt-5 sm:pt-6 grid grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                <Metric value="30s" label="CHECK_INTERVAL" tone="blue" />
                <Metric value="99.9%" label="UPTIME_TARGET" tone="white" />
                <Metric value="<5ms" label="DETECTION" tone="sand" />
              </div>
            </div>

            {/* Right: render panel like Figma (mechanical silhouette) */}
            <Panel className="p-4 sm:p-6">
              <div className="flex items-start justify-between">
                <div className="text-[#5f636a] text-[9px] sm:text-[10px] tracking-[0.28em] uppercase">
                  [MC-VII_008]
                </div>
                <div className="text-right text-[#5f636a] text-[9px] sm:text-[10px] tracking-[0.26em] uppercase">
                  SIGNAL: 88.2%
                  <br />
                  LATENCY: 12ms
                </div>
              </div>

              <div className="mt-4 sm:mt-6 h-[200px] sm:h-[240px] lg:h-[260px] border border-[#15171a] bg-[rgba(0,0,0,0.18)] relative overflow-hidden">
                {/* “Machine” silhouette approximation */}
                <div className="absolute inset-0 opacity-[0.55] bg-[radial-gradient(circle_at_60%_40%,rgba(255,255,255,0.10),transparent_55%)]" />
                <div className="absolute left-[56%] top-[18%] w-[110px] h-[220px] border border-[#2a2d31]" />
                <div className="absolute left-[66%] top-[8%] w-[24px] h-[260px] border-x border-[#2a2d31]" />
                <div className="absolute left-[48%] top-[36%] w-[220px] h-[220px] rounded-full border border-[#2a2d31]" />
                <div className="absolute left-[58%] top-[56%] w-[120px] h-[120px] rounded-full border border-[#2a2d31]" />
              </div>

              <div className="mt-4 sm:mt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                <div className="text-[#5f636a] text-[9px] sm:text-[10px] tracking-[0.28em] uppercase">
                  AUTH_PROTOCOL: V4.0
                </div>
                <div className="text-[#5f636a] text-[9px] sm:text-[10px] tracking-[0.28em] uppercase">
                  NODE: SG-1
                </div>
              </div>
            </Panel>
          </div>
        </div>
      </main>

      {/* CAPABILITIES (use Figma modules) */}
      <section id="capabilities" className="py-12 sm:py-16">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-[#5f636a] text-[9px] sm:text-[10px] tracking-[0.28em] uppercase">
            MODULE_INDEX
          </div>
          <div className="mt-3 text-[#d6d7da] text-[20px] sm:text-[24px] lg:text-[28px] tracking-[-0.02em] font-bold uppercase">
            SYSTEM_CAPABILITIES
          </div>

          <div className="mt-6 sm:mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <Panel className="p-6 sm:p-8">
              <div className="text-[#b9c7ff] text-[9px] sm:text-[10px] tracking-[0.28em] uppercase">MODULE_01</div>
              <div className="mt-3 text-[#d6d7da] text-[18px] sm:text-[20px] lg:text-[22px] font-bold uppercase tracking-tight">
                SIMPLE_MONITORING
              </div>
              <div className="mt-3 sm:mt-4 text-[#6f6f6f] text-[11px] sm:text-[12px] leading-relaxed">
                Monitor endpoints with status validation, timing, SSL expiry and domain health. Designed for APIs and
                public sites.
              </div>

              <div className="mt-5 sm:mt-6 space-y-2 sm:space-y-3 text-[10px] sm:text-[11px] tracking-[0.14em] text-[#8b8f96]">
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

            <Panel className="p-6 sm:p-8">
              <div className="text-[#f2d48a] text-[9px] sm:text-[10px] tracking-[0.28em] uppercase">MODULE_02</div>
              <div className="mt-3 text-[#d6d7da] text-[18px] sm:text-[20px] lg:text-[22px] font-bold uppercase tracking-tight">
                SCENARIO_MONITORING
              </div>
              <div className="mt-3 sm:mt-4 text-[#6f6f6f] text-[11px] sm:text-[12px] leading-relaxed">
                Multi-step journey tracing with step timing, failure point location and deep request diagnostics.
              </div>

              <div className="mt-5 sm:mt-6 space-y-2 sm:space-y-3 text-[10px] sm:text-[11px] tracking-[0.14em] text-[#8b8f96]">
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

      {/* DASHBOARD PREVIEW - Awesome showcase */}
      <section className="py-12 sm:py-16 lg:py-20 relative overflow-hidden">
        {/* Ambient glow effects */}
        <div className="absolute top-0 left-1/4 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-[#b9c7ff] opacity-[0.08] blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] bg-[#f2d48a] opacity-[0.06] blur-[100px] rounded-full" />
        
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-8 sm:mb-10 lg:mb-12">
            <div className="text-[#5f636a] text-[9px] sm:text-[10px] tracking-[0.32em] uppercase">
              INTERFACE_PREVIEW
            </div>
            <div className="mt-3 sm:mt-4 text-[#d6d7da] text-[28px] sm:text-[36px] md:text-[42px] lg:text-[48px] font-black uppercase tracking-tight leading-[0.92]">
              COMMAND_CENTER
              <br />
              <span className="text-[#b9c7ff]">INTERFACE</span>
            </div>
            <div className="mt-4 sm:mt-6 text-[#6f6f6f] text-[11px] sm:text-[12px] lg:text-[13px] leading-relaxed max-w-[600px] mx-auto px-4">
              A precision-engineered dashboard that transforms raw telemetry into actionable intelligence.
              Real-time monitoring with military-grade clarity.
            </div>
          </div>

          {/* Dashboard image container with effects */}
          <div className="relative group">
            {/* Outer glow ring */}
            <div className="absolute -inset-2 sm:-inset-4 bg-gradient-to-r from-[#b9c7ff]/20 via-[#f2d48a]/20 to-[#b9c7ff]/20 rounded-lg blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500" />
            
            {/* Main panel */}
            <Panel className="relative overflow-hidden">
              {/* Top accent bar */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#b9c7ff] to-transparent opacity-60" />
              
              {/* Corner indicators - hidden on mobile */}
              <div className="hidden sm:block absolute top-4 left-4 w-3 h-3 border-l-2 border-t-2 border-[#b9c7ff] opacity-40" />
              <div className="hidden sm:block absolute top-4 right-4 w-3 h-3 border-r-2 border-t-2 border-[#b9c7ff] opacity-40" />
              <div className="hidden sm:block absolute bottom-4 left-4 w-3 h-3 border-l-2 border-b-2 border-[#f2d48a] opacity-40" />
              <div className="hidden sm:block absolute bottom-4 right-4 w-3 h-3 border-r-2 border-b-2 border-[#f2d48a] opacity-40" />
              
              {/* Image container */}
              <div className="p-2 sm:p-4 md:p-6 lg:p-8">
                <div className="relative rounded-sm overflow-hidden border border-[#2a2d31] shadow-2xl">
                  {/* Scanline effect overlay */}
                  <div className="absolute inset-0 bg-[linear-gradient(0deg,transparent_50%,rgba(255,255,255,0.02)_50%)] bg-[length:100%_4px] pointer-events-none z-10 opacity-30" />
                  
                  {/* Image with hover effect */}
                  <img
                    src="/Dashboard-Image.png"
                    alt="PingSight Dashboard Interface"
                    className="w-full h-auto transform transition-transform duration-700 group-hover:scale-[1.02]"
                  />
                  
                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c0e]/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                </div>
                
                {/* Info bar below image */}
                <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 text-[9px] sm:text-[10px] tracking-[0.26em] uppercase">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
                      <span className="text-[#5f636a]">SYSTEM_ONLINE</span>
                    </div>
                    <div className="text-[#5f636a]">
                      LATENCY: <span className="text-[#f2d48a]">12ms</span>
                    </div>
                  </div>
                  <div className="text-[#5f636a]">
                    RESOLUTION: <span className="text-[#d6d7da]">1920×1080</span>
                  </div>
                </div>
              </div>
            </Panel>

            {/* Floating feature badges - hidden on mobile and tablet */}
            <div className="absolute -left-4 top-1/4 hidden xl:block">
              <Panel className="px-4 py-3 backdrop-blur-md">
                <div className="text-[#b9c7ff] text-[9px] tracking-[0.28em] uppercase">REAL-TIME</div>
                <div className="text-[#d6d7da] text-[11px] font-bold">UPDATES</div>
              </Panel>
            </div>
            
            <div className="absolute -right-4 top-1/3 hidden xl:block">
              <Panel className="px-4 py-3 backdrop-blur-md">
                <div className="text-[#f2d48a] text-[9px] tracking-[0.28em] uppercase">DEEP</div>
                <div className="text-[#d6d7da] text-[11px] font-bold">ANALYTICS</div>
              </Panel>
            </div>
          </div>

          {/* Feature highlights below dashboard */}
          <div className="mt-8 sm:mt-10 lg:mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 border border-[#2a2d31] bg-[rgba(185,199,255,0.05)] mb-3 sm:mb-4">
                <span className="text-[#b9c7ff] text-[18px] sm:text-[20px]">⚡</span>
              </div>
              <div className="text-[#d6d7da] text-[11px] sm:text-[12px] tracking-[0.22em] uppercase font-bold">
                INSTANT_INSIGHTS
              </div>
              <div className="mt-2 text-[#6f6f6f] text-[10px] sm:text-[11px] leading-relaxed px-2">
                Monitor status changes in real-time with sub-second precision
              </div>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 border border-[#2a2d31] bg-[rgba(242,212,138,0.05)] mb-4">
                <span className="text-[#f2d48a] text-[20px]">◈</span>
              </div>
              <div className="text-[#d6d7da] text-[12px] tracking-[0.22em] uppercase font-bold">
                VISUAL_CLARITY
              </div>
              <div className="mt-2 text-[#6f6f6f] text-[11px] leading-relaxed">
                Clean interface designed for rapid pattern recognition
              </div>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 border border-[#2a2d31] bg-[rgba(255,255,255,0.03)] mb-4">
                <span className="text-[#d6d7da] text-[20px]">◎</span>
              </div>
              <div className="text-[#d6d7da] text-[12px] tracking-[0.22em] uppercase font-bold">
                ZERO_FRICTION
              </div>
              <div className="mt-2 text-[#6f6f6f] text-[11px] leading-relaxed">
                Intuitive controls that feel natural from day one
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DIAGNOSTICS (waterfall like your system) */}
      <section id="diagnostics" className="py-12 sm:py-16">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-8 lg:gap-10 items-start">
            <div>
              <div className="text-[#5f636a] text-[9px] sm:text-[10px] tracking-[0.28em] uppercase">
                PERFORMANCE_ANALYSIS
              </div>
              <div className="mt-3 text-[#d6d7da] text-[28px] sm:text-[32px] lg:text-[36px] font-black uppercase tracking-tight leading-[0.92]">
                DEEP_TRACE
                <br />
                DIAGNOSTICS
              </div>
              <div className="mt-4 sm:mt-6 text-[#6f6f6f] text-[12px] sm:text-[13px] leading-relaxed">
                Every request is instrumented with trace hooks that capture timing at each network layer. Identify
                bottlenecks in DNS, TCP, TLS and time-to-first-byte.
              </div>
            </div>

            <Panel className="p-6 sm:p-8">
              <div className="text-[#5f636a] text-[9px] sm:text-[10px] tracking-[0.28em] uppercase">
                WATERFALL_VISUALIZATION
              </div>
              <div className="mt-2 text-[#d6d7da] text-[16px] sm:text-[18px] font-bold uppercase tracking-tight">
                REQUEST_TIMELINE
              </div>

              <div className="mt-5 sm:mt-7 space-y-4 sm:space-y-5">
                {[
                  { k: "DNS_LOOKUP", v: "12ms", left: "0%", w: "15%", c: "#b9c7ff" },
                  { k: "TCP_CONNECT", v: "24ms", left: "15%", w: "25%", c: "#b9c7ff" },
                  { k: "TLS_HANDSHAKE", v: "58ms", left: "40%", w: "35%", c: "#f2d48a" },
                  { k: "TTFB", v: "142ms", left: "75%", w: "25%", c: "#b9c7ff" },
                ].map((row) => (
                  <div key={row.k}>
                    <div className="flex items-center justify-between text-[9px] sm:text-[10px] tracking-[0.26em] uppercase">
                      <span className="text-[#5f636a]">{row.k}</span>
                      <span style={{ color: row.c }}>{row.v}</span>
                    </div>
                    <div className="mt-2 h-[8px] sm:h-[10px] border border-[#15171a] bg-[rgba(0,0,0,0.22)] relative">
                      <div
                        className="absolute top-0 h-full"
                        style={{ left: row.left, width: row.w, backgroundColor: row.c, opacity: 0.95 }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 sm:mt-7 pt-4 sm:pt-6 border-t border-[#15171a] text-[#5f636a] text-[9px] sm:text-[10px] tracking-[0.28em] uppercase">
                TOTAL_LATENCY: <span className="text-[#d6d7da] tracking-[0.20em]">236ms</span>
              </div>
            </Panel>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20 lg:py-24">
        <div className="max-w-[980px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-[#5f636a] text-[9px] sm:text-[10px] tracking-[0.28em] uppercase">READY_TO_START</div>
          <div className="mt-4 text-[#d6d7da] text-[32px] sm:text-[38px] lg:text-[44px] font-black uppercase tracking-tight leading-[0.92]">
            DEPLOY YOUR FIRST
            <br />
            MONITOR IN 60 SECONDS
          </div>
          <div className="mt-4 sm:mt-6 text-[#6f6f6f] text-[12px] sm:text-[13px] leading-relaxed px-4">
            No credit card required. Start monitoring with anomaly detection, SSL tracking and domain expiry alerts.
          </div>

          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/login">
              <PrimaryButton>START_FREE_TRIAL</PrimaryButton>
            </Link>
            <GhostButton onClick={() => router.push("/docs")}>VIEW_DOCUMENTATION</GhostButton>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#1b1d20] py-8 sm:py-10">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6">
          <div>
            <div className="text-[#d6d7da] text-[11px] sm:text-[12px] tracking-[0.22em] uppercase">
              PINGSIGHT_SYSTEMS
            </div>
            <div className="mt-2 text-[#5f636a] text-[9px] sm:text-[10px] tracking-[0.28em] uppercase">
              BUILD: V2.0.4_GRAPHITE — STATUS: OPERATIONAL
            </div>
          </div>

          <div className="text-[#5f636a] text-[9px] sm:text-[10px] tracking-[0.28em] uppercase">
            © 2026 ALL_RIGHTS_RESERVED
          </div>
        </div>
      </footer>
    </div>
  );
}