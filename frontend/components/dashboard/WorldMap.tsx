"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils/ui";

type WorldNode = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  status?: "ok" | "alert" | "neutral";
};

type WorldPing = {
  id: string;
  fromId: string;
  toId: string;
  latencyMs?: number;
  tone?: "ok" | "alert" | "neutral";
};

type WorldMapProps = {
  className?: string;
  nodes: WorldNode[];
  pings?: WorldPing[];
  /** Optional: auto-play pulsing "traffic" lines */
  animate?: boolean;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/**
 * Simple equirectangular projection:
 * x = (lon + 180) / 360 * width
 * y = (90 - lat) / 180 * height
 */
function project(lat: number, lon: number, width: number, height: number) {
  const x = ((lon + 180) / 360) * width;
  const y = ((90 - lat) / 180) * height;
  return { x, y };
}

function toneColor(tone?: "ok" | "alert" | "neutral") {
  switch (tone) {
    case "ok":
      return "#f2d48a";
    case "alert":
      return "#ff6a6a";
    default:
      return "#b9c7ff";
  }
}

/**
 * Quadratic curve between points (simple "arc").
 * Control point is lifted upward proportionally to distance.
 */
function arcPath(ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax;
  const dy = by - ay;
  const dist = Math.sqrt(dx * dx + dy * dy);
  // lift curve upward (negative y) for a "global route" feel
  const lift = clamp(dist * 0.18, 18, 90);
  const cx = ax + dx * 0.5;
  const cy = Math.min(ay, by) - lift;
  return `M ${ax.toFixed(2)} ${ay.toFixed(2)} Q ${cx.toFixed(2)} ${cy.toFixed(2)} ${bx.toFixed(2)} ${by.toFixed(2)}`;
}

export function WorldMap({ className, nodes, pings = [], animate = true }: WorldMapProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ w: 900, h: 320 });

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect;
      if (!cr) return;
      setSize({
        w: Math.max(320, Math.floor(cr.width)),
        h: Math.max(200, Math.floor(cr.height)),
      });
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const nodeIndex = useMemo(() => {
    const map = new Map<string, WorldNode>();
    for (const n of nodes) map.set(n.id, n);
    return map;
  }, [nodes]);

  const projected = useMemo(() => {
    return nodes.map((n) => ({
      ...n,
      ...project(n.lat, n.lon, size.w, size.h),
    }));
  }, [nodes, size.w, size.h]);

  const projectedPings = useMemo(() => {
    return pings
      .map((p) => {
        const from = nodeIndex.get(p.fromId);
        const to = nodeIndex.get(p.toId);
        if (!from || !to) return null;

        const a = project(from.lat, from.lon, size.w, size.h);
        const b = project(to.lat, to.lon, size.w, size.h);

        return {
          ...p,
          ax: a.x,
          ay: a.y,
          bx: b.x,
          by: b.y,
          d: arcPath(a.x, a.y, b.x, b.y),
          color: toneColor(p.tone),
        };
      })
      .filter(Boolean) as Array<
      WorldPing & { ax: number; ay: number; bx: number; by: number; d: string; color: string }
    >;
  }, [pings, nodeIndex, size.w, size.h]);

  return (
    <div
      ref={wrapRef}
      className={cn(
        "relative w-full h-[220px] sm:h-[260px] md:h-[300px] lg:h-[320px]",
        "border border-[#15171a] bg-[rgba(0,0,0,0.18)] overflow-hidden",
        className
      )}
    >
      {/* subtle grid */}
      <div className="absolute inset-0 opacity-[0.12] pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(185,199,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(185,199,255,0.12) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      {/* scanline */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.08]">
        <div
          className="absolute inset-0"
          style={{
            background:
              "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.08) 3px, rgba(255,255,255,0.08) 4px)",
          }}
        />
      </div>

      <svg
        width={size.w}
        height={size.h}
        viewBox={`0 0 ${size.w} ${size.h}`}
        className="absolute inset-0"
        aria-label="World map topology"
        role="img"
      >
        {/* vignette */}
        <defs>
          <radialGradient id="ps-vignette" cx="50%" cy="50%" r="65%">
            <stop offset="0%" stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.55)" />
          </radialGradient>

          {/* ping pulse */}
          <filter id="ps-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* moving dash */}
          <style>
            {`.ps-dash {
  stroke-dasharray: 10 10;
  animation: psDash 1.4s linear infinite;
}
@keyframes psDash {
  to { stroke-dashoffset: -20; }
}
.ps-pulse {
  transform-origin: center;
  animation: psPulse 1.8s ease-in-out infinite;
}
@keyframes psPulse {
  0%, 100% { opacity: .55; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.2); }
}`}
          </style>
        </defs>

        {/* World map image as background */}
        <image
          href="/world_map.png"
          x="0"
          y="0"
          width={size.w}
          height={size.h}
          opacity="0.35"
          preserveAspectRatio="xMidYMid slice"
        />

        {/* routes */}
        <g fill="none" strokeWidth="2">
          {projectedPings.map((p) => (
            <path
              key={p.id}
              d={p.d}
              stroke={p.color}
              opacity={0.35}
              className={animate ? "ps-dash" : undefined}
            />
          ))}
        </g>

        {/* nodes */}
        <g filter="url(#ps-glow)">
          {projected.map((n) => {
            const c = toneColor(n.status);
            return (
              <g key={n.id}>
                <circle cx={n.x} cy={n.y} r="5" fill={c} opacity={0.95} className="ps-pulse" />
                <circle cx={n.x} cy={n.y} r="10" fill={c} opacity={0.10} />
              </g>
            );
          })}
        </g>

        {/* vignette overlay */}
        <rect x="0" y="0" width={size.w} height={size.h} fill="url(#ps-vignette)" />
      </svg>

      {/* legend / hint */}
      <div className="absolute left-3 bottom-3 flex items-center gap-3 border border-[#2a2d31] bg-[rgba(0,0,0,0.55)] backdrop-blur-sm px-3 py-2">
        <div className="text-[#5f636a] text-[9px] tracking-[0.26em] uppercase">GLOBAL_TOPOLOGY</div>
        <div className="h-2 w-2 rounded-full bg-[#f2d48a]" />
        <div className="text-[#6f6f6f] text-[9px] tracking-[0.22em] uppercase">ROUTES_ACTIVE</div>
      </div>
    </div>
  );
}
