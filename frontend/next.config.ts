import type { NextConfig } from "next";

const backendInternal =
  process.env.BACKEND_INTERNAL_URL || "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  async rewrites() {
    if (process.env.NODE_ENV !== "development") return [];
    if (process.env.NEXT_PUBLIC_API_PROXY === "0") return [];
    return [
      {
        source: "/api-backend/:path*",
        destination: `${backendInternal.replace(/\/$/, "")}/:path*`,
      },
    ];
  },
};

export default nextConfig;
