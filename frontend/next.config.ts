import type { NextConfig } from "next";

/**
 * BFF: /api/v1/* → FastAPI (same-origin session cookies on Vercel).
 *
 * On Vercel (VERCEL=1), BFF is ON by default unless NEXT_PUBLIC_BFF=0.
 * Set BACKEND_INTERNAL_URL to your Render API root (e.g. https://pingsight.onrender.com).
 */
const backendInternal =
  process.env.BACKEND_INTERNAL_URL || "http://127.0.0.1:8000";

const isVercel = Boolean(process.env.VERCEL);

/** Prefer same-origin proxy on Vercel so the browser never calls Render directly. */
const bffEnabled =
  process.env.NEXT_PUBLIC_BFF === "1" ||
  (isVercel && process.env.NEXT_PUBLIC_BFF !== "0");

if (
  process.env.NODE_ENV === "production" &&
  bffEnabled &&
  !process.env.BACKEND_INTERNAL_URL
) {
  throw new Error(
    "Vercel BFF: set BACKEND_INTERNAL_URL to your Render API URL (e.g. https://pingsight.onrender.com).",
  );
}

const nextConfig: NextConfig = {
  // Ensure the client bundle matches rewrite behavior (fixes accidental NEXT_PUBLIC_API_URL → Render).
  env: {
    NEXT_PUBLIC_BFF: bffEnabled ? "1" : "0",
  },
  async rewrites() {
    if (!bffEnabled) return [];
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendInternal.replace(/\/$/, "")}/:path*`,
      },
    ];
  },
};

export default nextConfig;
