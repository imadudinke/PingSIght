"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUserInfoAuthMeGet } from "@/lib/api/sdk.gen";

export default function AuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState("Verifying authentication...");

  useEffect(() => {
    // The backend has already set the httpOnly cookie
    // We just need to verify it works and redirect
    const verifyAuth = async () => {
      try {
        const response = await getCurrentUserInfoAuthMeGet();

        if (response.response.ok) {
          setStatus("Success! Redirecting...");
          router.push("/dashboard");
        } else {
          setStatus("Authentication failed");
          router.push("/?error=auth_failed");
        }
      } catch (error) {
        setStatus("Network error");
        router.push("/?error=network_error");
      }
    };

    verifyAuth();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p>{status}</p>
      </div>
    </div>
  );
}