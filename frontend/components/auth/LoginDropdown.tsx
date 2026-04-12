"use client";

import { useState, useEffect, useRef } from 'react';
import { getApiBaseUrl } from '@/lib/constants';

interface LoginDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement>;
}

export default function LoginDropdown({ isOpen, onClose, triggerRef }: LoginDropdownProps) {
  const [loadingProvider, setLoadingProvider] = useState<'google' | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Reset loading state when dropdown opens/closes
  useEffect(() => {
    if (isOpen) {
      setLoadingProvider(null);
    }
  }, [isOpen]);

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

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose, triggerRef]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  const handleGoogleLogin = () => {
    setLoadingProvider('google');
    window.location.href = `${getApiBaseUrl()}/auth/login`;
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full right-0 mt-2 w-[320px] sm:w-[360px] z-50 animate-in fade-in slide-in-from-top-2 duration-200"
    >
      {/* Dropdown panel */}
      <div className="relative border border-[#1b1d20] bg-[#0f1012] shadow-2xl">
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#b9c7ff] to-transparent opacity-60" />
        
        {/* Content */}
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="text-[#d6d7da] text-[14px] tracking-[0.18em] uppercase font-bold">
              SIGN_IN
            </div>
            <div className="mt-1 text-[#6f6f6f] text-[10px] tracking-[0.26em] uppercase">
              AUTHENTICATE_WITH_PROVIDER
            </div>
          </div>

          {/* Google Login Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={loadingProvider === 'google'}
            className="w-full h-[48px] px-4 flex items-center justify-center gap-3 border border-[#2a2d31] bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.04)] hover:border-[#b9c7ff] transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
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
          <div className="relative my-6">
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
          <div className="space-y-2">
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
          <div className="mt-6 pt-4 border-t border-[#1b1d20]">
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
        </div>

        {/* Bottom accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#f2d48a] to-transparent opacity-40" />
      </div>
    </div>
  );
}
