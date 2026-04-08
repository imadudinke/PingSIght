"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils/ui";

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

function CodeBlock({ children, language = "bash" }: { children: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-4">
      <div className="absolute top-2 sm:top-3 right-2 sm:right-3 z-10">
        <button
          onClick={handleCopy}
          className="px-2 sm:px-3 py-1 bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] border border-[#2a2d31] text-[8px] sm:text-[9px] tracking-[0.26em] uppercase text-[#d6d7da] transition"
        >
          {copied ? "COPIED" : "COPY"}
        </button>
      </div>
      <pre className="bg-[#0a0b0d] border border-[#1b1d20] p-3 sm:p-4 overflow-x-auto">
        <code className="text-[#d6d7da] text-[11px] sm:text-[12px] font-mono">{children}</code>
      </pre>
    </div>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20 sm:scroll-mt-24">
      <h2 className="text-[#d6d7da] text-[18px] sm:text-[20px] lg:text-[24px] font-bold uppercase tracking-tight mb-4 sm:mb-6">
        {title}
      </h2>
      <div className="space-y-4 text-[#b0b3b8] text-[12px] sm:text-[13px] lg:text-[14px] leading-relaxed">
        {children}
      </div>
    </section>
  );
}

export default function DocsPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState("getting-started");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const sections = [
    { id: "getting-started", label: "GETTING_STARTED" },
    { id: "monitors", label: "MONITORS" },
    { id: "heartbeats", label: "HEARTBEATS" },
    { id: "scenarios", label: "SCENARIOS" },
    { id: "status-pages", label: "STATUS_PAGES" },
    { id: "notifications", label: "NOTIFICATIONS" },
    { id: "api", label: "API_REFERENCE" },
  ];

  // Intersection Observer for scroll-based active section detection
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "-20% 0px -70% 0px", // Trigger when section is in the middle of viewport
      threshold: 0,
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // Observe all sections
    sections.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  const handleSectionClick = (sectionId: string) => {
    setActiveSection(sectionId);
    setIsMobileMenuOpen(false);
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 80; // Account for fixed header
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({
        top: elementPosition - offset,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0c0e] text-[#b0b3b8] font-mono">
      {/* Background */}
      <div className="fixed inset-0 -z-10 bg-[#0b0c0e]" />
      <div className="fixed inset-0 -z-10 opacity-[0.22] bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.08),transparent_55%)]" />
      <div className="fixed inset-0 -z-10 opacity-[0.35] bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0),rgba(0,0,0,0.85))]" />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 h-[56px] sm:h-[64px] border-b border-[#1b1d20] bg-[rgba(10,10,11,0.95)] backdrop-blur-md">
        <div className="h-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <button 
            onClick={() => router.push("/")}
            className="flex items-center gap-3 sm:gap-4 hover:opacity-80 transition"
          >
            <div className="h-8 w-8 sm:h-9 sm:w-9 border border-[#2a2d31] bg-[rgba(255,255,255,0.03)] grid place-items-center flex-shrink-0">
              <div className="h-3 w-3 sm:h-4 sm:w-4 bg-[#b9c7ff]" />
            </div>
            <div className="min-w-0">
              <div className="text-[#d6d7da] text-[11px] sm:text-[14px] tracking-[0.10em] uppercase truncate">
                PINGSIGHT
              </div>
              <div className="text-[#6f6f6f] text-[8px] sm:text-[10px] tracking-[0.26em] uppercase">
                DOCUMENTATION
              </div>
            </div>
          </button>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden h-[32px] w-[32px] sm:h-[34px] sm:w-[34px] border border-[#2a2d31] text-[#d6d7da] hover:border-[#b9c7ff] hover:text-[#b9c7ff] transition flex items-center justify-center"
              aria-label="Toggle menu"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

            <button
              onClick={() => router.push("/")}
              className="h-[32px] sm:h-[34px] px-3 sm:px-5 border border-[#2a2d31] text-[#d6d7da] hover:border-[#b9c7ff] hover:text-[#b9c7ff] transition text-[10px] sm:text-[11px] tracking-[0.26em] uppercase whitespace-nowrap"
            >
              <span className="hidden sm:inline">BACK_TO_HOME</span>
              <span className="sm:hidden">HOME</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Navigation Menu */}
      <aside
        className={cn(
          "fixed top-[56px] sm:top-[64px] left-0 bottom-0 w-[280px] bg-[rgba(10,10,11,0.98)] backdrop-blur-md border-r border-[#1b1d20] z-40 transition-transform duration-300 lg:hidden overflow-y-auto",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <nav className="p-4 sm:p-6 space-y-1">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => handleSectionClick(section.id)}
              className={cn(
                "w-full text-left px-4 py-3 text-[10px] sm:text-[11px] tracking-[0.26em] uppercase transition",
                activeSection === section.id
                  ? "bg-[rgba(255,255,255,0.05)] text-[#f2d48a] border-l-2 border-[#f2d48a]"
                  : "text-[#6f6f6f] hover:text-[#d6d7da] hover:bg-[rgba(255,255,255,0.02)] border-l-2 border-transparent"
              )}
            >
              {section.label}
            </button>
          ))}
        </nav>
      </aside>

      <div className="pt-[56px] sm:pt-[64px]">
        <div className="max-w-[1400px] mx-auto flex">
          {/* Desktop Sidebar Navigation */}
          <aside className="hidden lg:block w-[280px] border-r border-[#1b1d20] sticky top-[64px] h-[calc(100vh-64px)] overflow-y-auto">
            <nav className="p-6 space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => handleSectionClick(section.id)}
                  className={cn(
                    "w-full text-left px-4 py-3 text-[11px] tracking-[0.26em] uppercase transition",
                    activeSection === section.id
                      ? "bg-[rgba(255,255,255,0.05)] text-[#f2d48a] border-l-2 border-[#f2d48a]"
                      : "text-[#6f6f6f] hover:text-[#d6d7da] hover:bg-[rgba(255,255,255,0.02)] border-l-2 border-transparent"
                  )}
                >
                  {section.label}
                </button>
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 px-4 sm:px-6 lg:px-12 py-8 sm:py-12 max-w-[900px]">
            {/* Hero */}
            <div className="mb-10 sm:mb-12 lg:mb-16">
              <div className="text-[#5f636a] text-[9px] sm:text-[10px] tracking-[0.32em] uppercase mb-3 sm:mb-4">
                SYSTEM_DOCUMENTATION
              </div>
              <h1 className="text-[#d6d7da] text-[28px] sm:text-[36px] lg:text-[42px] xl:text-[48px] font-black uppercase tracking-tight leading-[0.92] mb-4 sm:mb-6">
                PINGSIGHT
                <br />
                <span className="text-[#b9c7ff]">PROTOCOL</span>
              </h1>
              <p className="text-[#6f6f6f] text-[12px] sm:text-[13px] lg:text-[14px] leading-relaxed max-w-[600px]">
                Complete technical reference for deploying and operating the PingSight monitoring system.
                From basic setup to advanced configurations.
              </p>
            </div>

            <div className="space-y-10 sm:space-y-12 lg:space-y-16">
              {/* Getting Started */}
              <Section id="getting-started" title="GETTING_STARTED">
                <p>
                  PingSight is a precision monitoring platform designed for developers who demand clarity.
                  Monitor HTTP endpoints, track SSL certificates, detect domain expiration, and receive
                  instant alerts when systems fail.
                </p>

                <Panel className="p-4 sm:p-6 mt-6">
                  <div className="text-[#f2d48a] text-[9px] sm:text-[10px] tracking-[0.28em] uppercase mb-3">
                    QUICK_START
                  </div>
                  <ol className="space-y-2 sm:space-y-3 text-[12px] sm:text-[13px]">
                    <li className="flex gap-3">
                      <span className="text-[#b9c7ff] font-bold">01.</span>
                      <span>Sign in with Google OAuth</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-[#b9c7ff] font-bold">02.</span>
                      <span>Create your first monitor</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-[#b9c7ff] font-bold">03.</span>
                      <span>Configure notification channels</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-[#b9c7ff] font-bold">04.</span>
                      <span>Monitor in real-time</span>
                    </li>
                  </ol>
                </Panel>
              </Section>

              {/* Monitors */}
              <Section id="monitors" title="SIMPLE_MONITORS">
                <p>
                  Simple monitors track HTTP/HTTPS endpoints with status code validation, response time measurement,
                  SSL certificate expiration, and domain expiration detection.
                </p>

                <div className="mt-6">
                  <div className="text-[#d6d7da] text-[13px] sm:text-[14px] font-bold uppercase tracking-tight mb-3">
                    CONFIGURATION
                  </div>
                  <ul className="space-y-2 text-[12px] sm:text-[13px] list-disc list-inside text-[#8b8f96]">
                    <li><span className="text-[#b9c7ff]">URL</span>: Target endpoint to monitor</li>
                    <li><span className="text-[#b9c7ff]">Interval</span>: Check frequency (30s - 3600s)</li>
                    <li><span className="text-[#b9c7ff]">Method</span>: HTTP method (GET, POST, etc.)</li>
                    <li><span className="text-[#b9c7ff]">Headers</span>: Custom request headers (optional)</li>
                    <li><span className="text-[#b9c7ff]">Body</span>: Request payload (optional)</li>
                  </ul>
                </div>

                <div className="mt-6">
                  <div className="text-[#d6d7da] text-[13px] sm:text-[14px] font-bold uppercase tracking-tight mb-3">
                    EXAMPLE
                  </div>
                  <CodeBlock language="json">{`{
  "friendly_name": "API Health Check",
  "url": "https://api.example.com/health",
  "interval_seconds": 60,
  "method": "GET",
  "expected_status_code": 200
}`}</CodeBlock>
                </div>

                <Panel className="p-4 sm:p-6 mt-6 border-l-2 border-[#f2d48a]">
                  <div className="text-[#f2d48a] text-[9px] sm:text-[10px] tracking-[0.28em] uppercase mb-2">
                    DEEP_TRACE_DIAGNOSTICS
                  </div>
                  <p className="text-[11px] sm:text-[12px]">
                    Every check captures detailed timing: DNS lookup, TCP connect, TLS handshake, and time-to-first-byte.
                    Identify bottlenecks at the network layer.
                  </p>
                </Panel>
              </Section>

              {/* Heartbeats */}
              <Section id="heartbeats" title="HEARTBEAT_MONITORS">
                <p>
                  Heartbeat monitors use reverse-ping methodology. Your cron jobs, backups, and scheduled tasks
                  ping PingSight. If we don't hear from them, you get alerted. Silence is the alarm.
                </p>

                <div className="mt-6">
                  <div className="text-[#d6d7da] text-[14px] font-bold uppercase tracking-tight mb-3">
                    HOW_IT_WORKS
                  </div>
                  <ol className="space-y-3 text-[13px]">
                    <li className="flex gap-3">
                      <span className="text-[#f2d48a] font-bold">01.</span>
                      <span>Create a heartbeat monitor and get a unique URL</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-[#f2d48a] font-bold">02.</span>
                      <span>Configure your job to ping that URL on success</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-[#f2d48a] font-bold">03.</span>
                      <span>If we don't receive a ping within the expected interval, alert fires</span>
                    </li>
                  </ol>
                </div>

                <div className="mt-6">
                  <div className="text-[#d6d7da] text-[14px] font-bold uppercase tracking-tight mb-3">
                    EXAMPLE_USAGE
                  </div>
                  <CodeBlock>{`# Add to your cron job or script
curl -X POST https://pingsight.com/api/ping/YOUR_HEARTBEAT_ID

# Or with status reporting
curl -X POST https://pingsight.com/api/ping/YOUR_HEARTBEAT_ID \\
  -H "Content-Type: application/json" \\
  -d '{"status": "success", "message": "Backup completed"}'`}</CodeBlock>
                </div>
              </Section>

              {/* Scenarios */}
              <Section id="scenarios" title="SCENARIO_MONITORS">
                <p>
                  Scenario monitors execute multi-step user journeys. Test complex workflows like login flows,
                  checkout processes, or API sequences. Each step is timed independently.
                </p>

                <div className="mt-6">
                  <div className="text-[#d6d7da] text-[14px] font-bold uppercase tracking-tight mb-3">
                    CAPABILITIES
                  </div>
                  <ul className="space-y-2 text-[13px] list-disc list-inside text-[#8b8f96]">
                    <li>Up to 3 sequential steps per scenario</li>
                    <li>Variable extraction from responses</li>
                    <li>Step-by-step timing breakdown</li>
                    <li>Failure point identification</li>
                    <li>Conditional step execution</li>
                  </ul>
                </div>

                <div className="mt-6">
                  <div className="text-[#d6d7da] text-[14px] font-bold uppercase tracking-tight mb-3">
                    EXAMPLE_SCENARIO
                  </div>
                  <CodeBlock language="json">{`{
  "name": "User Login Flow",
  "steps": [
    {
      "name": "Get CSRF Token",
      "url": "https://app.example.com/api/csrf",
      "method": "GET",
      "extract": { "token": "$.csrf_token" }
    },
    {
      "name": "Submit Login",
      "url": "https://app.example.com/api/login",
      "method": "POST",
      "body": {
        "email": "test@example.com",
        "password": "test123",
        "csrf_token": "{{token}}"
      }
    },
    {
      "name": "Verify Dashboard",
      "url": "https://app.example.com/dashboard",
      "method": "GET",
      "expected_status": 200
    }
  ]
}`}</CodeBlock>
                </div>
              </Section>

              {/* Status Pages */}
              <Section id="status-pages" title="STATUS_PAGES">
                <p>
                  Create public status pages to communicate system health to your users. Choose from multiple
                  templates, customize branding, and automatically sync with your monitors.
                </p>

                <div className="mt-6">
                  <div className="text-[#d6d7da] text-[14px] font-bold uppercase tracking-tight mb-3">
                    FEATURES
                  </div>
                  <ul className="space-y-2 text-[13px] list-disc list-inside text-[#8b8f96]">
                    <li>4 professional templates (Minimal, Modern, Corporate, Gaming)</li>
                    <li>Custom branding and colors</li>
                    <li>Incident management</li>
                    <li>Maintenance scheduling</li>
                    <li>Uptime history visualization</li>
                    <li>Public or password-protected</li>
                  </ul>
                </div>

                <Panel className="p-6 mt-6">
                  <div className="text-[#b9c7ff] text-[10px] tracking-[0.28em] uppercase mb-3">
                    PUBLIC_URL_FORMAT
                  </div>
                  <code className="text-[#f2d48a] text-[13px]">
                    https://pingsight.com/status/your-slug
                  </code>
                </Panel>
              </Section>

              {/* Notifications */}
              <Section id="notifications" title="NOTIFICATIONS">
                <p>
                  Configure Discord and Slack webhooks to receive instant alerts when monitors go down or recover.
                  Customize alert thresholds and notification preferences.
                </p>

                <div className="mt-6">
                  <div className="text-[#d6d7da] text-[14px] font-bold uppercase tracking-tight mb-3">
                    DISCORD_SETUP
                  </div>
                  <ol className="space-y-3 text-[13px]">
                    <li className="flex gap-3">
                      <span className="text-[#b9c7ff] font-bold">01.</span>
                      <span>Go to Server Settings → Integrations → Webhooks</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-[#b9c7ff] font-bold">02.</span>
                      <span>Create a new webhook and copy the URL</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-[#b9c7ff] font-bold">03.</span>
                      <span>Paste the URL in PingSight Settings → Notifications</span>
                    </li>
                  </ol>
                </div>

                <div className="mt-6">
                  <div className="text-[#d6d7da] text-[14px] font-bold uppercase tracking-tight mb-3">
                    SLACK_SETUP
                  </div>
                  <ol className="space-y-3 text-[13px]">
                    <li className="flex gap-3">
                      <span className="text-[#f2d48a] font-bold">01.</span>
                      <span>Create an Incoming Webhook app in your Slack workspace</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-[#f2d48a] font-bold">02.</span>
                      <span>Select the channel for notifications</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-[#f2d48a] font-bold">03.</span>
                      <span>Copy the webhook URL to PingSight Settings</span>
                    </li>
                  </ol>
                </div>
              </Section>

              {/* API Reference */}
              <Section id="api" title="API_REFERENCE">
                <p>
                  PingSight provides a RESTful API for programmatic access. All endpoints require authentication
                  via session cookies (obtained through OAuth login).
                </p>

                <div className="mt-6 space-y-6">
                  <div>
                    <div className="text-[#d6d7da] text-[14px] font-bold uppercase tracking-tight mb-3">
                      BASE_URL
                    </div>
                    <code className="text-[#f2d48a] text-[13px]">
                      https://api.pingsight.com
                    </code>
                  </div>

                  <div>
                    <div className="text-[#d6d7da] text-[14px] font-bold uppercase tracking-tight mb-3">
                      ENDPOINTS
                    </div>
                    <div className="space-y-4">
                      <Panel className="p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="px-2 py-1 bg-[#10b981]/20 text-[#10b981] text-[10px] tracking-wider">GET</span>
                          <code className="text-[#d6d7da] text-[12px]">/api/monitors</code>
                        </div>
                        <p className="text-[12px] text-[#8b8f96]">List all monitors</p>
                      </Panel>

                      <Panel className="p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="px-2 py-1 bg-[#3b82f6]/20 text-[#3b82f6] text-[10px] tracking-wider">POST</span>
                          <code className="text-[#d6d7da] text-[12px]">/api/monitors</code>
                        </div>
                        <p className="text-[12px] text-[#8b8f96]">Create a new monitor</p>
                      </Panel>

                      <Panel className="p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="px-2 py-1 bg-[#10b981]/20 text-[#10b981] text-[10px] tracking-wider">GET</span>
                          <code className="text-[#d6d7da] text-[12px]">/api/monitors/:id</code>
                        </div>
                        <p className="text-[12px] text-[#8b8f96]">Get monitor details with heartbeats</p>
                      </Panel>

                      <Panel className="p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="px-2 py-1 bg-[#f59e0b]/20 text-[#f59e0b] text-[10px] tracking-wider">PUT</span>
                          <code className="text-[#d6d7da] text-[12px]">/api/monitors/:id</code>
                        </div>
                        <p className="text-[12px] text-[#8b8f96]">Update monitor configuration</p>
                      </Panel>

                      <Panel className="p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="px-2 py-1 bg-[#ef4444]/20 text-[#ef4444] text-[10px] tracking-wider">DELETE</span>
                          <code className="text-[#d6d7da] text-[12px]">/api/monitors/:id</code>
                        </div>
                        <p className="text-[12px] text-[#8b8f96]">Delete a monitor</p>
                      </Panel>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <div className="text-[#d6d7da] text-[14px] font-bold uppercase tracking-tight mb-3">
                    RATE_LIMITS
                  </div>
                  <Panel className="p-6">
                    <ul className="space-y-2 text-[13px] text-[#8b8f96]">
                      <li className="flex items-center gap-3">
                        <span className="text-[#b9c7ff]">•</span>
                        <span>100 requests per minute per IP</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <span className="text-[#b9c7ff]">•</span>
                        <span>1000 requests per hour per user</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <span className="text-[#b9c7ff]">•</span>
                        <span>Rate limit headers included in responses</span>
                      </li>
                    </ul>
                  </Panel>
                </div>
              </Section>
            </div>

            {/* Footer */}
            <div className="mt-12 sm:mt-16 lg:mt-20 pt-6 sm:pt-8 border-t border-[#1b1d20]">
              <div className="text-[#5f636a] text-[10px] sm:text-[11px] tracking-[0.26em] uppercase mb-3 sm:mb-4">
                NEED_MORE_HELP?
              </div>
              <p className="text-[#8b8f96] text-[12px] sm:text-[13px] leading-relaxed mb-4 sm:mb-6">
                Join our community or contact support for additional assistance.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => router.push("/")}
                  className="h-10 px-6 bg-[#b9c7ff] text-[#0b0c0e] text-[10px] sm:text-[11px] tracking-[0.26em] uppercase font-semibold hover:brightness-95 transition"
                >
                  GET_STARTED
                </button>
                <button
                  onClick={() => window.open("https://github.com/yourusername/pingsight", "_blank")}
                  className="h-10 px-6 border border-[#2a2d31] text-[#d6d7da] hover:border-[#b9c7ff] hover:text-[#b9c7ff] transition text-[10px] sm:text-[11px] tracking-[0.26em] uppercase"
                >
                  VIEW_ON_GITHUB
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
