"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils/ui";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

function TopTab({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative pt-[2px] pb-[10px]",
        "text-[11px] tracking-[0.26em] uppercase",
        active
          ? "text-[#f2d48a]"
          : "text-[#6f6f6f] hover:text-[#d6d7da] transition"
      )}
      type="button"
    >
      {children}
      {active && (
        <span className="absolute left-0 right-0 -bottom-[1px] h-[2px] bg-[#f2d48a]" />
      )}
    </button>
  );
}

function ToggleRow({
  label,
  hint,
  checked,
  disabled,
  onToggle,
}: {
  label: string;
  hint: string;
  checked: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="min-w-0 pr-6">
        <div className="text-[#d6d7da] text-[11px] tracking-[0.16em] uppercase">
          {label}
        </div>
        <div className="text-[#6f6f6f] text-[9px] tracking-[0.10em] mt-0.5">
          {hint}
        </div>
      </div>

      <button
        onClick={onToggle}
        disabled={disabled}
        className={cn(
          "relative w-11 h-6 rounded-full transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-[#b9c7ff]/50",
          checked
            ? "bg-[#b9c7ff] shadow-[0_0_0_1px_rgba(185,199,255,0.25),0_8px_20px_rgba(0,0,0,0.35)]"
            : "bg-[#2a2d31] hover:bg-[#3a3d42]",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        type="button"
        aria-pressed={checked}
        aria-label={label}
      >
        <div
          className={cn(
            "absolute top-0.5 w-5 h-5 bg-[#d6d7da] rounded-full transition-all duration-200 shadow-md",
            checked ? "translate-x-5" : "translate-x-0.5"
          )}
        />
      </button>
    </div>
  );
}

function UserAccountModal({
  isOpen,
  onClose,
  userEmail,
  onLogout,
  buttonRef,
}: {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  onLogout: () => void;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const panelRef = useRef<HTMLDivElement | null>(null);

  // Ensure we're mounted on client side
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load notification settings when modal opens
  useEffect(() => {
    if (isOpen) fetchNotificationSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Close modal on Escape / outside click
  useEffect(() => {
    if (!isOpen) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    const onPointerDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (panelRef.current && !panelRef.current.contains(t)) onClose();
    };

    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointerDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointerDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const fetchNotificationSettings = async () => {
    try {
      const response = await fetch(
        "http://localhost:8000/api/notifications/settings",
        { credentials: "include" }
      );
      if (response.ok) {
        const data = await response.json();
        setNotificationsEnabled(Boolean(data.discord_enabled));
      }
    } catch {
      // UI-only: fail silently, keep last toggle state
    }
  };

  const updateNotificationSettings = async (enabled: boolean) => {
    setLoading(true);
    try {
      const response = await fetch(
        "http://localhost:8000/api/notifications/settings",
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ discord_enabled: enabled }),
        }
      );

      if (!response.ok) throw new Error("update failed");
      setNotificationsEnabled(enabled);
    } catch {
      setNotificationsEnabled((v) => !v); // revert
    } finally {
      setLoading(false);
    }
  };

  // Calculate modal position based on button position
  const getModalPosition = () => {
    if (!buttonRef.current) return { top: 72, right: 32 };
    
    const buttonRect = buttonRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    
    // On mobile, center the modal
    if (viewportWidth < 768) {
      return {
        top: buttonRect.bottom + 8,
        left: '50%',
        transform: 'translateX(-50%)',
        right: 'auto',
      };
    }
    
    return {
      top: buttonRect.bottom + 8,
      right: viewportWidth - buttonRect.right,
    };
  };

  if (!isOpen || !mounted) return null;

  const modalPosition = getModalPosition();

  const modalContent = (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div
        ref={panelRef}
        className={cn(
          "fixed w-[340px] max-w-[calc(100vw-2rem)] z-[70]",
          "border border-[#2a2d31] bg-[rgba(10,10,11,0.98)] backdrop-blur-[12px]",
          "shadow-[0_18px_60px_rgba(0,0,0,0.55)]"
        )}
        style={{ 
          top: modalPosition.top,
          right: modalPosition.right,
          left: modalPosition.left,
          transform: modalPosition.transform,
          transformOrigin: "top right", 
          animation: "psSlideDown 0.16s ease-out" 
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Account menu"
      >
        {/* Header */}
        <div className="px-4 py-4 border-b border-[#2a2d31]">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-[#d6d7da] text-[11px] tracking-[0.20em] uppercase">
                ACCOUNT
              </div>
              <div className="mt-2 text-[#6f6f6f] text-[10px] tracking-[0.12em] break-all">
                {userEmail || "user@example.com"}
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-7 h-7 grid place-items-center text-[#6f6f6f] hover:text-[#d6d7da] hover:bg-[rgba(255,255,255,0.05)] transition"
              aria-label="Close"
              type="button"
            >
              ×
            </button>
          </div>
        </div>

        {/* Toggles */}
        <div className="p-4 space-y-4">
          <ToggleRow
            label="NOTIFICATIONS"
            hint="Discord alerts enabled"
            checked={notificationsEnabled}
            disabled={loading}
            onToggle={() => {
              const next = !notificationsEnabled;
              setNotificationsEnabled(next);
              updateNotificationSettings(next);
            }}
          />

          <ToggleRow
            label="AUTO_REFRESH"
            hint="Live data updates"
            checked={autoRefresh}
            onToggle={() => setAutoRefresh((v) => !v)}
          />
        </div>

        {/* Actions */}
        <div className="px-4 pb-4 space-y-3">
          <button
            onClick={onLogout}
            className={cn(
              "w-full h-[34px] px-3 text-left",
              "bg-[rgba(255,106,106,0.10)] hover:bg-[rgba(255,106,106,0.18)]",
              "border border-[rgba(255,106,106,0.28)] hover:border-[rgba(255,106,106,0.45)]",
              "text-[#ff6a6a] text-[11px] tracking-[0.16em] uppercase",
              "transition focus:outline-none focus:ring-2 focus:ring-[rgba(255,106,106,0.45)]"
            )}
            type="button"
          >
            LOGOUT
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes psSlideDown {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </>
  );

  // Use portal to render outside of header container
  return createPortal(modalContent, document.body);
}

export function DashboardHeader({ 
  userEmail,
  onMenuClick,
}: { 
  userEmail?: string;
  onMenuClick?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();

  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const accountButtonRef = useRef<HTMLButtonElement>(null);

  const isLiveFeed =
    pathname === "/dashboard" ||
    pathname === "/dashboard/home" ||
    pathname?.startsWith("/dashboard/monitors") ||
    pathname?.startsWith("/dashboard/heartbeats");

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <header className="relative z-30 h-[64px] border-b border-[#1b1d20] bg-[rgba(10,10,11,0.25)] backdrop-blur-[2px] px-4 md:px-8 flex items-center justify-between">
      <div className="flex items-center gap-4 md:gap-8">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden w-9 h-9 flex items-center justify-center text-[#d6d7da] hover:bg-[rgba(255,255,255,0.05)] transition rounded-sm"
          aria-label="Open menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="text-[#d6d7da] text-[11px] md:text-[14px] tracking-[0.12em] uppercase truncate">
          PINGSIGHT_MONITORING_V1.0
        </div>

        <div className="hidden lg:flex items-center gap-7">
          <TopTab active={isLiveFeed} onClick={() => router.push("/dashboard/home")}>
            LIVE_FEED
          </TopTab>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <button
            ref={accountButtonRef}
            onClick={() => setIsAccountModalOpen((v) => !v)}
            className="h-9 w-9 rounded-sm border border-[#2a2d31] bg-[rgba(255,255,255,0.03)] grid place-items-center text-[12px] text-[#d6d7da] uppercase hover:border-[#3a3d42] hover:bg-[rgba(255,255,255,0.05)] transition"
            title={`Account: ${userEmail || "User"}`}
            type="button"
          >
            {userEmail?.charAt(0).toUpperCase() || "U"}
          </button>

          <UserAccountModal
            isOpen={isAccountModalOpen}
            onClose={() => setIsAccountModalOpen(false)}
            userEmail={userEmail}
            onLogout={() => {
              setIsAccountModalOpen(false);
              setShowLogoutConfirm(true);
            }}
            buttonRef={accountButtonRef}
          />

          <ConfirmModal
            isOpen={showLogoutConfirm}
            onClose={() => setShowLogoutConfirm(false)}
            onConfirm={handleLogout}
            title="CONFIRM_LOGOUT"
            message="Are you sure you want to logout? You will need to sign in again to access your dashboard."
            confirmText="LOGOUT"
            cancelText="CANCEL"
            variant="warning"
          />
        </div>
      </div>
    </header>
  );
}