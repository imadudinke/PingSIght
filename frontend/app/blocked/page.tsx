"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { BackgroundLayers } from "@/components/dashboard/BackgroundLayers";

function BlockedContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [reason, setReason] = useState<string>("unknown");

  useEffect(() => {
    const reasonParam = searchParams.get("reason");
    if (reasonParam) {
      setReason(reasonParam);
    }
  }, [searchParams]);

  const getMessage = () => {
    switch (reason) {
      case "email_blocked":
        return {
          title: "EMAIL_ADDRESS_BLOCKED",
          message:
            "This email address has been blocked from accessing the system. If you believe this is an error, please contact support.",
          icon: "⊗",
        };
      case "account_deactivated":
        return {
          title: "ACCOUNT_DEACTIVATED",
          message:
            "Your account has been deactivated by an administrator. If you believe this is an error, please contact support.",
          icon: "⚠",
        };
      default:
        return {
          title: "ACCESS_DENIED",
          message: "You do not have permission to access this system.",
          icon: "🚫",
        };
    }
  };

  const { title, message, icon } = getMessage();

  return (
    <div className="min-h-screen bg-[#0b0c0e] text-[#b0b3b8] font-mono flex items-center justify-center p-4">
      <BackgroundLayers />

      <div className="relative z-10 max-w-2xl w-full">
        <div className="border border-[#1b1d20] bg-[#0f1012] p-8 md:p-12">
          {/* Icon */}
          <div className="text-center mb-6">
            <span className="text-6xl" aria-hidden="true">
              {icon}
            </span>
          </div>

          {/* Title */}
          <div className="text-center mb-4">
            <h1 className="text-[#ef4444] text-[18px] md:text-[24px] tracking-[0.18em] uppercase font-bold">
              {title}
            </h1>
          </div>

          {/* Message */}
          <div className="text-center mb-8">
            <p className="text-[#6f6f6f] text-[12px] md:text-[14px] tracking-[0.10em] leading-relaxed">
              {message}
            </p>
          </div>

          {/* Divider */}
          <div className="border-t border-[#1b1d20] my-8"></div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push("/")}
              className="px-6 py-3 bg-[#1b1d20] text-[#d6d7da] font-mono text-[11px] font-bold tracking-wider uppercase hover:bg-[#2a2d31] transition-all border border-[#2a2d31]"
            >
              RETURN_TO_HOME
            </button>

            <a
              href="mailto:support@pingsight.com"
              className="px-6 py-3 bg-[#f2d48a] text-[#0b0c0e] font-mono text-[11px] font-bold tracking-wider uppercase hover:bg-[#d6d7da] transition-all text-center"
            >
              CONTACT_SUPPORT
            </a>
          </div>

          {/* Additional Info */}
          <div className="mt-8 text-center">
            <p className="text-[#5f636a] text-[10px] tracking-[0.20em] uppercase">
              ERROR_CODE: {reason.toUpperCase()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BlockedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0b0c0e] flex items-center justify-center">
        <div className="text-[#6f6f6f] text-[11px] tracking-[0.26em] uppercase">
          LOADING...
        </div>
      </div>
    }>
      <BlockedContent />
    </Suspense>
  );
}
