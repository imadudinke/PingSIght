"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/home");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0b0c0e] flex items-center justify-center">
      <div className="font-mono text-[#6b6f76] tracking-[0.28em] animate-pulse text-[11px] uppercase">
        LOADING_SYSTEM...
      </div>
    </div>
  );
}
