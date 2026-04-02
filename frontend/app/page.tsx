"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoginModal from '@/components/LoginModal';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const { isAuthenticated, logout, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#888] font-sans selection:bg-[#a5b9ff] selection:text-black">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .fade-in { animation: fadeIn 0.8s ease-out forwards; }
        .delay-1 { animation-delay: 0.2s; opacity: 0; }
        .delay-2 { animation-delay: 0.4s; opacity: 0; }
        .delay-3 { animation-delay: 0.6s; opacity: 0; }
        .panel { background-color: #0f0f0f; border: 1px solid #1a1a1a; position: relative; }
        .glow { box-shadow: 0 0 30px rgba(165, 185, 255, 0.15); }
        .pulse-dot { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
      `}} />

      {/* NAVIGATION */}
      <nav className="fixed top-0 w-full bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-[#1a1a1a] z-50">
        <div className="max-w-7xl mx-auto px-8 py-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#a5b9ff] flex items-center justify-center font-mono text-black text-xs font-bold">
              PS
            </div>
            <span className="text-[#e0e0e0] font-semibold tracking-wider">PINGSIGHT</span>
          </div>
          
          <div className="flex items-center gap-8 font-mono text-[10px] tracking-widest">
            <a href="#features" className="text-[#e0e0e0] hover:text-[#a5b9ff] transition-colors">FEATURES</a>
            <a href="#monitoring" className="text-[#888] hover:text-[#a5b9ff] transition-colors">MONITORING</a>
            <a href="#docs" className="text-[#888] hover:text-[#a5b9ff] transition-colors">DOCS</a>
            {isAuthenticated ? (
              <button 
                onClick={logout}
                className="bg-transparent border border-[#ff6b6b] text-[#ff6b6b] px-6 py-2 hover:bg-[#ff6b6b] hover:text-black transition-all"
              >
                LOGOUT
              </button>
            ) : (
              <button 
                onClick={() => setIsLoginOpen(true)}
                className="bg-transparent border border-[#a5b9ff] text-[#a5b9ff] px-6 py-2 hover:bg-[#a5b9ff] hover:text-black transition-all"
              >
                LOGIN
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="pt-32 pb-20 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 gap-16 items-center">
            {/* LEFT: HERO CONTENT */}
            <div className="space-y-8">
              <div className="fade-in">
                <div className="font-mono text-[10px] tracking-[0.3em] text-[#a5b9ff] mb-6 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#a5b9ff] pulse-dot"></span>
                  UPTIME_MONITORING / REAL_TIME_V2.0
                </div>
                
                <h1 className="text-6xl font-bold text-[#e0e0e0] leading-[1.1] mb-6">
                  PINGSIGHT
                </h1>
                
                <p className="text-lg text-[#888] leading-relaxed max-w-lg mb-8">
                  INTELLIGENT UPTIME MONITORING THAT WATCHES YOUR ENTIRE DIGITAL 
                  INFRASTRUCTURE. TRACK WEBSITE AVAILABILITY, SSL CERTIFICATES, 
                  DOMAIN EXPIRATION, AND MULTI-STEP USER JOURNEYS WITH 
                  SUB-MILLISECOND PRECISION.
                </p>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setIsLoginOpen(true)}
                    className="bg-[#a5b9ff] text-black font-mono text-xs font-bold px-8 py-4 tracking-widest hover:bg-[#b5c9ff] transition-all"
                  >
                    START_MONITORING
                  </button>
                  <button className="bg-transparent border border-[#333] text-[#e0e0e0] font-mono text-xs font-bold px-8 py-4 tracking-widest hover:border-[#a5b9ff] hover:text-[#a5b9ff] transition-all">
                    VIEW_DOCS
                  </button>
                </div>
              </div>

              <div className="fade-in delay-1 pt-8 border-t border-[#1a1a1a] grid grid-cols-3 gap-6 font-mono text-xs">
                <div>
                  <div className="text-2xl font-bold text-[#a5b9ff] mb-1">30s</div>
                  <div className="text-[#555] tracking-widest text-[10px]">CHECK_INTERVAL</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#e0e0e0] mb-1">99.9%</div>
                  <div className="text-[#555] tracking-widest text-[10px]">UPTIME_SLA</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#f5d76e] mb-1">&lt;5ms</div>
                  <div className="text-[#555] tracking-widest text-[10px]">DETECTION</div>
                </div>
              </div>
            </div>

            {/* RIGHT: DASHBOARD PREVIEW */}
            <div className="fade-in delay-2 relative">
              <div className="panel glow p-2">
                {/* Dashboard Screenshot Placeholder */}
                <div className="bg-[#0f0f0f] border border-[#1a1a1a] aspect-video flex items-center justify-center">
                  <div className="text-center space-y-4 p-8">
                    <div className="font-mono text-[10px] text-[#333] tracking-widest">DASHBOARD_PREVIEW</div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="h-16 bg-[#1a1a1a] border border-[#222]"></div>
                      <div className="h-16 bg-[#1a1a1a] border border-[#222]"></div>
                      <div className="h-16 bg-[#1a1a1a] border border-[#222]"></div>
                    </div>
                    <div className="space-y-1">
                      <div className="h-8 bg-[#1a1a1a] border-l-2 border-[#a5b9ff]"></div>
                      <div className="h-8 bg-[#1a1a1a] border-l-2 border-[#ff6b6b]"></div>
                      <div className="h-8 bg-[#1a1a1a] border-l-2 border-[#a5b9ff]"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 font-mono text-[8px] text-[#555] tracking-widest">
                BUILD: V2.0.4_GRAPHITE
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MONITORING TYPES */}
      <section className="py-20 px-8 bg-[#0f0f0f]" id="features">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <div className="font-mono text-[10px] tracking-widest text-[#555] mb-4">MONITORING_CAPABILITIES</div>
            <h2 className="text-4xl font-bold text-[#e0e0e0]">TWO MONITORING MODES</h2>
          </div>

          <div className="grid grid-cols-2 gap-8">
            {/* SIMPLE MONITORING */}
            <div className="panel p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="font-mono text-[10px] tracking-widest text-[#a5b9ff] mb-2">MODE_01</div>
                  <h3 className="text-2xl font-bold text-[#e0e0e0] mb-3">SIMPLE MONITORING</h3>
                </div>
                <div className="w-12 h-12 bg-[#0a0a0a] border border-[#a5b9ff] flex items-center justify-center text-[#a5b9ff] font-mono text-xs">
                  S
                </div>
              </div>
              
              <p className="text-sm text-[#666] leading-relaxed mb-6">
                Monitor single URL endpoints with comprehensive health checks. 
                Perfect for APIs, websites, and services.
              </p>

              <div className="space-y-3 font-mono text-[10px]">
                <div className="flex items-center gap-3 text-[#888]">
                  <span className="text-[#a5b9ff]">✓</span> HTTP status code tracking
                </div>
                <div className="flex items-center gap-3 text-[#888]">
                  <span className="text-[#a5b9ff]">✓</span> Response time measurement
                </div>
                <div className="flex items-center gap-3 text-[#888]">
                  <span className="text-[#a5b9ff]">✓</span> SSL certificate monitoring
                </div>
                <div className="flex items-center gap-3 text-[#888]">
                  <span className="text-[#a5b9ff]">✓</span> 30-3600s check intervals
                </div>
              </div>
            </div>

            {/* SCENARIO MONITORING */}
            <div className="panel p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="font-mono text-[10px] tracking-widest text-[#f5d76e] mb-2">MODE_02</div>
                  <h3 className="text-2xl font-bold text-[#e0e0e0] mb-3">SCENARIO MONITORING</h3>
                </div>
                <div className="w-12 h-12 bg-[#0a0a0a] border border-[#f5d76e] flex items-center justify-center text-[#f5d76e] font-mono text-xs">
                  SC
                </div>
              </div>
              
              <p className="text-sm text-[#666] leading-relaxed mb-6">
                Track multi-step user journeys through your application. 
                Monitor complete workflows from login to checkout.
              </p>

              <div className="space-y-3 font-mono text-[10px]">
                <div className="flex items-center gap-3 text-[#888]">
                  <span className="text-[#f5d76e]">✓</span> Multi-step journey tracking
                </div>
                <div className="flex items-center gap-3 text-[#888]">
                  <span className="text-[#f5d76e]">✓</span> Per-step timing breakdown
                </div>
                <div className="flex items-center gap-3 text-[#888]">
                  <span className="text-[#f5d76e]">✓</span> Failure point identification
                </div>
                <div className="flex items-center gap-3 text-[#888]">
                  <span className="text-[#f5d76e]">✓</span> Up to 3 steps per scenario
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DEEP PERFORMANCE METRICS */}
      <section className="py-20 px-8" id="monitoring">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 gap-16 items-center">
            <div>
              <div className="font-mono text-[10px] tracking-widest text-[#555] mb-4">PERFORMANCE_ANALYSIS</div>
              <h2 className="text-4xl font-bold text-[#e0e0e0] mb-6">
                DEEP TRACE<br/>DIAGNOSTICS
              </h2>
              <p className="text-base text-[#888] leading-relaxed mb-8">
                EVERY REQUEST IS INSTRUMENTED WITH TRACE HOOKS THAT CAPTURE 
                TIMING AT EACH NETWORK LAYER. IDENTIFY BOTTLENECKS IN DNS 
                RESOLUTION, TCP CONNECTION, TLS HANDSHAKE, AND TIME TO FIRST BYTE.
              </p>

              <div className="space-y-4 font-mono text-xs">
                <div className="flex items-center justify-between p-3 bg-[#0f0f0f] border-l-2 border-[#a5b9ff]">
                  <span className="text-[#888]">DNS_RESOLUTION</span>
                  <span className="text-[#a5b9ff]">12ms</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#0f0f0f] border-l-2 border-[#a5b9ff]">
                  <span className="text-[#888]">TCP_CONNECTION</span>
                  <span className="text-[#a5b9ff]">24ms</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#0f0f0f] border-l-2 border-[#f5d76e]">
                  <span className="text-[#888]">TLS_HANDSHAKE</span>
                  <span className="text-[#f5d76e]">58ms</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#0f0f0f] border-l-2 border-[#a5b9ff]">
                  <span className="text-[#888]">TTFB_LATENCY</span>
                  <span className="text-[#a5b9ff]">142ms</span>
                </div>
              </div>
            </div>

            <div className="panel p-8">
              <div className="mb-6">
                <div className="font-mono text-[10px] tracking-widest text-[#555] mb-2">WATERFALL_VISUALIZATION</div>
                <h3 className="text-xl font-bold text-[#e0e0e0]">REQUEST TIMELINE</h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between font-mono text-[10px]">
                    <span className="text-[#666]">DNS_LOOKUP</span>
                    <span className="text-[#a5b9ff]">12ms</span>
                  </div>
                  <div className="h-2 bg-[#0a0a0a] relative">
                    <div className="absolute left-0 top-0 h-full bg-[#a5b9ff] w-[15%]"></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between font-mono text-[10px]">
                    <span className="text-[#666]">TCP_CONNECT</span>
                    <span className="text-[#a5b9ff]">24ms</span>
                  </div>
                  <div className="h-2 bg-[#0a0a0a] relative">
                    <div className="absolute left-[15%] top-0 h-full bg-[#a5b9ff] w-[25%]"></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between font-mono text-[10px]">
                    <span className="text-[#666]">TLS_HANDSHAKE</span>
                    <span className="text-[#f5d76e]">58ms</span>
                  </div>
                  <div className="h-2 bg-[#0a0a0a] relative">
                    <div className="absolute left-[40%] top-0 h-full bg-[#f5d76e] w-[35%]"></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between font-mono text-[10px]">
                    <span className="text-[#666]">TTFB</span>
                    <span className="text-[#a5b9ff]">142ms</span>
                  </div>
                  <div className="h-2 bg-[#0a0a0a] relative">
                    <div className="absolute left-[75%] top-0 h-full bg-[#a5b9ff] w-[25%]"></div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-[#1a1a1a] font-mono text-[10px] text-[#555]">
                TOTAL_LATENCY: <span className="text-[#e0e0e0]">236ms</span>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* INTELLIGENT FEATURES GRID */}
      <section className="py-20 px-8 bg-[#0f0f0f]">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 text-center">
            <div className="font-mono text-[10px] tracking-widest text-[#555] mb-4">INTELLIGENT_MONITORING</div>
            <h2 className="text-4xl font-bold text-[#e0e0e0]">BEYOND BASIC UPTIME</h2>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {/* ANOMALY DETECTION */}
            <div className="panel p-6">
              <div className="w-12 h-12 bg-[#0a0a0a] border border-[#f5d76e] flex items-center justify-center text-[#f5d76e] mb-4 font-mono text-lg">
                ⚠
              </div>
              <h3 className="text-lg font-bold text-[#e0e0e0] mb-3 font-mono tracking-wider">ANOMALY_DETECTION</h3>
              <p className="text-sm text-[#666] leading-relaxed mb-4">
                AI-powered baseline learning detects performance degradation using the 3x rule. 
                Catches issues before they become critical.
              </p>
              <div className="font-mono text-[10px] text-[#555]">
                ACCURACY: <span className="text-[#f5d76e]">99.8%</span>
              </div>
            </div>

            {/* SSL MONITORING */}
            <div className="panel p-6">
              <div className="w-12 h-12 bg-[#0a0a0a] border border-[#a5b9ff] flex items-center justify-center text-[#a5b9ff] mb-4 font-mono text-lg">
                🔒
              </div>
              <h3 className="text-lg font-bold text-[#e0e0e0] mb-3 font-mono tracking-wider">SSL_CERTIFICATE</h3>
              <p className="text-sm text-[#666] leading-relaxed mb-4">
                Automatic SSL certificate expiration tracking. Get alerts at 30, 15, and 7 days 
                before expiry to prevent security warnings.
              </p>
              <div className="font-mono text-[10px] text-[#555]">
                STATUS: <span className="text-[#a5b9ff]">VALID / WARNING / CRITICAL</span>
              </div>
            </div>

            {/* DOMAIN EXPIRATION */}
            <div className="panel p-6">
              <div className="w-12 h-12 bg-[#0a0a0a] border border-[#ff6b6b] flex items-center justify-center text-[#ff6b6b] mb-4 font-mono text-lg">
                🌐
              </div>
              <h3 className="text-lg font-bold text-[#e0e0e0] mb-3 font-mono tracking-wider">DOMAIN_EXPIRATION</h3>
              <p className="text-sm text-[#666] leading-relaxed mb-4">
                WHOIS-based domain expiration monitoring. Checks once every 24 hours 
                to prevent domain loss and ownership issues.
              </p>
              <div className="font-mono text-[10px] text-[#555]">
                CHECK_INTERVAL: <span className="text-[#ff6b6b]">24_HOURS</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TECHNICAL SPECS */}
      <section className="py-20 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 gap-16 items-center">
            <div className="panel p-8">
              <div className="mb-6">
                <div className="font-mono text-[10px] tracking-widest text-[#555] mb-2">SYSTEM_ARCHITECTURE</div>
                <h3 className="text-2xl font-bold text-[#e0e0e0]">BUILT FOR SCALE</h3>
              </div>

              <div className="space-y-4 font-mono text-[10px]">
                <div className="flex items-start gap-4">
                  <div className="w-16 text-[#555]">BACKEND</div>
                  <div className="flex-1 text-[#e0e0e0]">FastAPI + SQLAlchemy + PostgreSQL</div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-16 text-[#555]">WORKER</div>
                  <div className="flex-1 text-[#e0e0e0]">APScheduler + AsyncIO + HTTPX</div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-16 text-[#555]">CHECKS</div>
                  <div className="flex-1 text-[#e0e0e0]">Trace hooks for deep diagnostics</div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-16 text-[#555]">STORAGE</div>
                  <div className="flex-1 text-[#e0e0e0]">JSONB for flexible step results</div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-16 text-[#555]">AUTH</div>
                  <div className="flex-1 text-[#e0e0e0]">JWT + OAuth2 + Social login</div>
                </div>
              </div>
            </div>

            <div>
              <div className="font-mono text-[10px] tracking-widest text-[#555] mb-4">MONITORING_STATS</div>
              <h2 className="text-4xl font-bold text-[#e0e0e0] mb-8">
                ENTERPRISE-GRADE<br/>RELIABILITY
              </h2>

              <div className="grid grid-cols-2 gap-6">
                <div className="panel p-6">
                  <div className="text-3xl font-bold text-[#a5b9ff] mb-2">30s</div>
                  <div className="font-mono text-[10px] text-[#555] tracking-widest">MIN_CHECK_INTERVAL</div>
                </div>
                <div className="panel p-6">
                  <div className="text-3xl font-bold text-[#e0e0e0] mb-2">3600s</div>
                  <div className="font-mono text-[10px] text-[#555] tracking-widest">MAX_CHECK_INTERVAL</div>
                </div>
                <div className="panel p-6">
                  <div className="text-3xl font-bold text-[#f5d76e] mb-2">10s</div>
                  <div className="font-mono text-[10px] text-[#555] tracking-widest">SCHEDULER_CYCLE</div>
                </div>
                <div className="panel p-6">
                  <div className="text-3xl font-bold text-[#a5b9ff] mb-2">3x</div>
                  <div className="font-mono text-[10px] text-[#555] tracking-widest">ANOMALY_THRESHOLD</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* USE CASES */}
      <section className="py-20 px-8 bg-[#0f0f0f]">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <div className="font-mono text-[10px] tracking-widest text-[#555] mb-4">REAL_WORLD_APPLICATIONS</div>
            <h2 className="text-4xl font-bold text-[#e0e0e0]">MONITOR WHAT MATTERS</h2>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="panel p-6 border-l-2 border-[#a5b9ff]">
              <h3 className="text-lg font-bold text-[#e0e0e0] mb-3 font-mono">API_ENDPOINTS</h3>
              <p className="text-sm text-[#666] leading-relaxed mb-4">
                Monitor REST APIs, GraphQL endpoints, and microservices. Track response times, 
                status codes, and detect performance degradation in real-time.
              </p>
              <div className="font-mono text-[10px] text-[#555]">
                USE_CASE: Production APIs, Third-party integrations
              </div>
            </div>

            <div className="panel p-6 border-l-2 border-[#f5d76e]">
              <h3 className="text-lg font-bold text-[#e0e0e0] mb-3 font-mono">USER_JOURNEYS</h3>
              <p className="text-sm text-[#666] leading-relaxed mb-4">
                Track complete user workflows from login to checkout. Identify which step 
                fails and why, with detailed timing for each interaction.
              </p>
              <div className="font-mono text-[10px] text-[#555]">
                USE_CASE: E-commerce flows, Authentication paths
              </div>
            </div>

            <div className="panel p-6 border-l-2 border-[#a5b9ff]">
              <h3 className="text-lg font-bold text-[#e0e0e0] mb-3 font-mono">SSL_COMPLIANCE</h3>
              <p className="text-sm text-[#666] leading-relaxed mb-4">
                Prevent certificate expiration incidents. Automatic tracking of SSL status 
                with alerts at 30, 15, and 7 days before expiry.
              </p>
              <div className="font-mono text-[10px] text-[#555]">
                USE_CASE: Security compliance, Certificate management
              </div>
            </div>

            <div className="panel p-6 border-l-2 border-[#ff6b6b]">
              <h3 className="text-lg font-bold text-[#e0e0e0] mb-3 font-mono">DOMAIN_PROTECTION</h3>
              <p className="text-sm text-[#666] leading-relaxed mb-4">
                WHOIS-based domain expiration monitoring. Get alerts before your domain 
                expires to prevent catastrophic site outages and ownership loss.
              </p>
              <div className="font-mono text-[10px] text-[#555]">
                USE_CASE: Domain portfolio management, Brand protection
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-32 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="font-mono text-[10px] tracking-widest text-[#555] mb-6">READY_TO_START</div>
          <h2 className="text-5xl font-bold text-[#e0e0e0] mb-6">
            DEPLOY YOUR FIRST<br/>MONITOR IN 60 SECONDS
          </h2>
          <p className="text-lg text-[#888] mb-12 max-w-2xl mx-auto">
            No credit card required. Start monitoring your infrastructure with 
            intelligent anomaly detection, SSL tracking, and domain expiration alerts.
          </p>
          <div className="flex gap-4 justify-center">
            <button 
              onClick={() => setIsLoginOpen(true)}
              className="bg-[#a5b9ff] text-black font-mono text-sm font-bold px-12 py-5 tracking-widest hover:bg-[#b5c9ff] transition-all"
            >
              START_FREE_TRIAL
            </button>
            <button className="bg-transparent border border-[#333] text-[#e0e0e0] font-mono text-sm font-bold px-12 py-5 tracking-widest hover:border-[#a5b9ff] hover:text-[#a5b9ff] transition-all">
              VIEW_DOCUMENTATION
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#1a1a1a] py-12 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-[#a5b9ff] flex items-center justify-center font-mono text-black text-xs font-bold">
                  PS
                </div>
                <span className="text-[#e0e0e0] font-semibold">PINGSIGHT</span>
              </div>
              <p className="text-xs text-[#555] leading-relaxed font-mono">
                INTELLIGENT_UPTIME_MONITORING<br/>
                FOR_MODERN_INFRASTRUCTURE
              </p>
            </div>

            <div>
              <h4 className="font-mono text-[10px] tracking-widest text-[#e0e0e0] mb-4">PRODUCT</h4>
              <div className="space-y-2 text-xs text-[#666] font-mono">
                <div><a href="#" className="hover:text-[#a5b9ff] transition-colors">Features</a></div>
                <div><a href="#" className="hover:text-[#a5b9ff] transition-colors">Pricing</a></div>
                <div><a href="#" className="hover:text-[#a5b9ff] transition-colors">Documentation</a></div>
                <div><a href="#" className="hover:text-[#a5b9ff] transition-colors">API_Reference</a></div>
              </div>
            </div>

            <div>
              <h4 className="font-mono text-[10px] tracking-widest text-[#e0e0e0] mb-4">MONITORING</h4>
              <div className="space-y-2 text-xs text-[#666] font-mono">
                <div><a href="#" className="hover:text-[#a5b9ff] transition-colors">Simple_Monitors</a></div>
                <div><a href="#" className="hover:text-[#a5b9ff] transition-colors">Scenario_Monitors</a></div>
                <div><a href="#" className="hover:text-[#a5b9ff] transition-colors">SSL_Tracking</a></div>
                <div><a href="#" className="hover:text-[#a5b9ff] transition-colors">Domain_Expiry</a></div>
              </div>
            </div>

            <div>
              <h4 className="font-mono text-[10px] tracking-widest text-[#e0e0e0] mb-4">COMPANY</h4>
              <div className="space-y-2 text-xs text-[#666] font-mono">
                <div><a href="#" className="hover:text-[#a5b9ff] transition-colors">About</a></div>
                <div><a href="#" className="hover:text-[#a5b9ff] transition-colors">Blog</a></div>
                <div><a href="#" className="hover:text-[#a5b9ff] transition-colors">Status</a></div>
                <div><a href="#" className="hover:text-[#a5b9ff] transition-colors">Contact</a></div>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-[#1a1a1a] flex justify-between items-center font-mono text-[9px] tracking-widest text-[#555]">
            <div>© 2024 PINGSIGHT. ALL_RIGHTS_RESERVED.</div>
            <div className="flex gap-6">
              <span>BUILD: <span className="text-[#a5b9ff]">V2.0.4_GRAPHITE</span></span>
              <span>STATUS: <span className="text-[#a5b9ff]">OPERATIONAL</span></span>
              <span>UPTIME: <span className="text-[#a5b9ff]">99.98%</span></span>
            </div>
          </div>
        </div>
      </footer>

      <LoginModal 
        isOpen={isLoginOpen} 
        onClose={() => setIsLoginOpen(false)} 
      />
    </div>
  );
}
