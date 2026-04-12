import type { NextConfig } from "next";

/**
 * BFF: map /api/v1/* → FastAPI backend (same-origin cookies on Vercel).
 * Set NEXT_PUBLIC_BFF=1 and BACKEND_INTERNAL_URL (e.g. https://your-api.onrender.com).
 */
const backendInternal =
  process.env.BACKEND_INTERNAL_URL || "http://127.0.0.1:8000";

if (
  process.env.NODE_ENV === "production" &&
  process.env.NEXT_PUBLIC_BFF === "1" &&
  !process.env.BACKEND_INTERNAL_URL
) {
  throw new Error(
    "Set BACKEND_INTERNAL_URL (Render API URL) when NEXT_PUBLIC_BFF=1.",
  );
}

const nextConfig: NextConfig = {
  async rewrites() {
    if (process.env.NEXT_PUBLIC_BFF !== "1") return [];
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendInternal.replace(/\/$/, "")}/:path*`,
      },
    ];
  },
};

export default nextConfig;
