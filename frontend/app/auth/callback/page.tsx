"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUserInfoAuthMeGet } from "@/lib/api/sdk.gen";
import { BackgroundLayers } from "@/components/dashboard/BackgroundLayers";
import { Panel } from "@/components/dashboard/Panel";
import { cn } from "@/lib/utils/ui";

export default function AuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState("VERIFYING_AUTHENTICATION...");
  const [tone, setTone] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        let response: Awaited<ReturnType<typeof getCurrentUserInfoAuthMeGet>> | undefined;

        // Retry briefly to avoid transient timing issues while the cookie settles.
        for (let attempt = 0; attempt < 3; attempt++) {
          response = await getCurrentUserInfoAuthMeGet();
          if (response?.response?.ok) {
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, 250));
        }

        if (response?.response?.ok) {
          setTone("ok");
          setStatus("SUCCESS — REDIRECTING...");
          router.push("/dashboard");
        } else {
          setTone("error");
          setStatus("AUTHENTICATION_FAILED");
          router.push("/?error=auth_failed");
        }
      } catch {
        setTone("error");
        setStatus("NETWORK_ERROR");
        router.push("/?error=network_error");
      }
    };

    verifyAuth();
  }, [router]);

  const strip = tone === "error" ? "bg-[#ff6a6a]" : tone === "ok" ? "bg-[#f2d48a]" : "bg-[#b9c7ff]";

  return (
    <div className="min-h-screen text-[#b0b3b8] font-mono">
      <BackgroundLayers />

      <div className="min-h-screen flex items-center justify-center px-6">
        <Panel className="p-0 w-full max-w-[520px] overflow-hidden">
          <div className={cn("h-[3px]", strip)} />

          <div className="px-6 py-6">
            <div className="text-[#d6d7da] text-[14px] tracking-[0.18em] uppercase">
              AUTH_CALLBACK
            </div>
            <div className="mt-2 text-[#6f6f6f] text-[11px] tracking-[0.12em]">
              SESSION_HANDSHAKE / COOKIE_VALIDATION
            </div>

            <div className="mt-6 flex items-center gap-4">
              <div className="h-9 w-9 border border-[#2a2d31] bg-[rgba(255,255,255,0.03)] grid place-items-center">
                <div
                  className={cn(
                    "h-3 w-3",
                    tone === "loading" ? "bg-[#b9c7ff] animate-pulse" : tone === "ok" ? "bg-[#f2d48a]" : "bg-[#ff6a6a]"
                  )}
                />
              </div>

              <div className="flex-1">
                <div className="text-[#5f636a] text-[10px] tracking-[0.28em] uppercase">
                  STATUS
                </div>
                <div
                  className={cn(
                    "mt-1 text-[12px] tracking-[0.22em] uppercase",
                    tone === "error" ? "text-[#ff6a6a]" : tone === "ok" ? "text-[#f2d48a]" : "text-[#d6d7da]"
                  )}
                >
                  {status}
                </div>
              </div>

              <div className="hidden sm:block text-right text-[#5f636a] text-[10px] tracking-[0.26em] uppercase">
                OBSERVATORY
                <br />
                ALPHA_V1
              </div>
            </div>

            <div className="mt-6 border-t border-[#15171a] pt-5">
              <div className="text-[#5f636a] text-[10px] tracking-[0.26em] uppercase">
                NOTE
              </div>
              <div className="mt-2 text-[#6f6f6f] text-[11px] leading-relaxed">
                IF_REDIRECT_DOES_NOT_START_AUTOMATICALLY, RETURN_TO_HOME_AND_RETRY_AUTH.
              </div>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}