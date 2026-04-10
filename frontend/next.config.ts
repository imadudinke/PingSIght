import type { NextConfig } from "next";

const backendInternal =
  process.env.BACKEND_INTERNAL_URL || "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  async rewrites() {
    // Optional local dev only: proxy /api/* → FastAPI so cookies stay same-origin with NEXT_PUBLIC_API_PROXY=1
    if (process.env.NODE_ENV !== "development") return [];
    if (process.env.NEXT_PUBLIC_API_PROXY === "0") return [];
    if (process.env.NEXT_PUBLIC_API_PROXY !== "1") return [];
    return [
      {
        source: "/api/:path*",
        destination: `${backendInternal.replace(/\/$/, "")}/:path*`,
      },
    ];
  },
};

export default nextConfig;
