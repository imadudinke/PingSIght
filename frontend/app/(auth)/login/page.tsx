"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getApiBaseUrl } from '@/lib/constants';

export default function LoginPage() {
  const [loadingProvider, setLoadingProvider] = useState<'google' | null>(null);
  const router = useRouter();

  // Reset loading state when user returns to the page
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setLoadingProvider(null);
      }
    };

    const handleFocus = () => {
      setLoadingProvider(null);
    };

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        setLoadingProvider(null);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, []);

  const handleGoogleLogin = () => {
    setLoadingProvider('google');
    window.location.href = `${getApiBaseUrl()}/auth/login`;
  };

  return (
    <div className="min-h-screen bg-[#0b0c0e] text-[#b0b3b8] font-mono flex items-center justify-center p-4">
      {/* Background layers */}
      <div className="fixed inset-0 -z-10 bg-[#0b0c0e]" />
      <div className="fixed inset-0 -z-10 opacity-[0.22] bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.08),transparent_55%)]" />
      <div className="fixed inset-0 -z-10 opacity-[0.35] bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0),rgba(0,0,0,0.85))]" />

      <div className="w-full max-w-md">
        {/* Login panel */}
        <div className="relative border border-[#1b1d20] bg-[#0f1012] shadow-2xl">
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#b9c7ff] to-transparent opacity-60" />
          
          {/* Content */}
          <div className="p-8">
            {/* Header */}
            <div className="mb-8 text-center">
              <div className="text-[#d6d7da] text-[18px] tracking-[0.18em] uppercase font-bold">
                SIGN_IN
              </div>
              <div className="mt-2 text-[#6f6f6f] text-[11px] tracking-[0.26em] uppercase">
                AUTHENTICATE_WITH_PROVIDER
              </div>
            </div>

            {/* Google Login Button */}
            <button
              onClick={handleGoogleLogin}
              disabled={loadingProvider === 'google'}
              className="w-full h-[52px] px-4 flex items-center justify-center gap-3 border border-[#2a2d31] bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.04)] hover:border-[#b9c7ff] transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {loadingProvider === 'google' ? (
                <>
                  <div className="w-5 h-5 border-2 border-[#6f6f6f] border-t-[#b9c7ff] rounded-full animate-spin" />
                  <span className="text-[#6f6f6f] text-[11px] tracking-[0.26em] uppercase font-mono">
                    CONNECTING...
                  </span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span className="text-[#d6d7da] text-[11px] tracking-[0.26em] uppercase font-mono group-hover:text-[#b9c7ff] transition-colors">
                    CONTINUE_WITH_GOOGLE
                  </span>
                </>
              )}
            </button>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#1b1d20]"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-[#0f1012] px-3 text-[#5f636a] text-[9px] tracking-[0.28em] uppercase font-mono">
                  SECURE_OAUTH_2.0
                </span>
              </div>
            </div>

            {/* Info */}
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-[#b9c7ff] mt-1.5 flex-shrink-0" />
                <p className="text-[#6f6f6f] text-[10px] tracking-[0.14em] leading-relaxed">
                  No password required
                </p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-[#b9c7ff] mt-1.5 flex-shrink-0" />
                <p className="text-[#6f6f6f] text-[10px] tracking-[0.14em] leading-relaxed">
                  Encrypted end-to-end
                </p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-[#b9c7ff] mt-1.5 flex-shrink-0" />
                <p className="text-[#6f6f6f] text-[10px] tracking-[0.14em] leading-relaxed">
                  GDPR compliant
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-[#1b1d20]">
              <p className="text-[#5f636a] text-[9px] tracking-[0.20em] leading-relaxed text-center">
                By signing in, you agree to our{' '}
                <a href="#" className="text-[#b9c7ff] hover:text-[#d6d7da] transition-colors">
                  Terms
                </a>{' '}
                and{' '}
                <a href="#" className="text-[#b9c7ff] hover:text-[#d6d7da] transition-colors">
                  Privacy Policy
                </a>
              </p>
            </div>

            {/* Back button */}
            <div className="mt-6">
              <button
                onClick={() => router.back()}
                className="w-full h-[40px] px-4 flex items-center justify-center gap-2 border border-[#1b1d20] text-[#6f6f6f] hover:text-[#d6d7da] hover:border-[#2a2d31] transition-all text-[10px] tracking-[0.26em] uppercase font-mono"
              >
                <span>←</span>
                <span>BACK</span>
              </button>
            </div>
          </div>

          {/* Bottom accent line */}
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#f2d48a] to-transparent opacity-40" />
        </div>
      </div>
    </div>
  );
}
