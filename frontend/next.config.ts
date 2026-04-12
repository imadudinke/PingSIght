import type { NextConfig } from "next";

/**
 * BFF: /api/v1/* → FastAPI (same-origin session cookies on Vercel).
 *
 * On Vercel (VERCEL=1), BFF is ON by default unless NEXT_PUBLIC_BFF=0.
 * Set BACKEND_INTERNAL_URL to your Render API root (e.g. https://pingsight.onrender.com).
 */
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
  // Ensure the client bundle matches BFF behavior (fixes accidental NEXT_PUBLIC_API_URL → Render).
  env: {
    NEXT_PUBLIC_BFF: bffEnabled ? "1" : "0",
  },
  // /api/v1/* is proxied by app/api/v1/[[...path]]/route.ts (not rewrites) so OAuth Set-Cookie
  // is forwarded with redirect: "manual". Plain rewrites can follow 302s and drop the session cookie.
};

export default nextConfig;
