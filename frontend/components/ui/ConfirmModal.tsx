"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils/ui";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "CONFIRM",
  cancelText = "CANCEL",
  variant = "danger",
}: ConfirmModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const variantColors = {
    danger: {
      accent: "bg-[#ff6a6a]",
      border: "border-[#ff6a6a]",
      text: "text-[#ff6a6a]",
      buttonBg: "bg-[#ff6a6a]",
      buttonHover: "hover:bg-[#ff5555]",
    },
    warning: {
      accent: "bg-[#f2d48a]",
      border: "border-[#f2d48a]",
      text: "text-[#f2d48a]",
      buttonBg: "bg-[#f2d48a]",
      buttonHover: "hover:bg-[#e0c278]",
    },
    info: {
      accent: "bg-[#b9c7ff]",
      border: "border-[#b9c7ff]",
      text: "text-[#b9c7ff]",
      buttonBg: "bg-[#b9c7ff]",
      buttonHover: "hover:bg-[#a8b6ee]",
    },
  };

  const colors = variantColors[variant];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-[440px] max-h-[85vh] overflow-y-auto border border-[#2a2d31] bg-[rgba(10,10,11,0.98)] backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.6)] my-auto"
        style={{ animation: "modalSlideIn 0.2s ease-out" }}
      >
        {/* Accent bar */}
        <div className={cn("absolute left-0 top-0 bottom-0 w-[3px]", colors.accent)} />

        {/* Content */}
        <div className="p-4 sm:p-5">
          {/* Icon and Title */}
          <div className="flex items-start gap-3 mb-3">
            <div
              className={cn(
                "flex-shrink-0 w-9 h-9 border grid place-items-center",
                colors.border,
                "bg-[rgba(255,255,255,0.02)]"
              )}
            >
              {variant === "danger" && (
                <span className={cn("text-[16px]", colors.text)}>!</span>
              )}
              {variant === "warning" && (
                <span className={cn("text-[16px]", colors.text)}>⚠</span>
              )}
              {variant === "info" && (
                <span className={cn("text-[16px]", colors.text)}>i</span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3
                className={cn(
                  "text-[12px] tracking-[0.14em] uppercase font-bold mb-1.5 leading-tight",
                  colors.text
                )}
              >
                {title}
              </h3>
              <p className="text-[#b0b3b8] text-[11px] leading-relaxed">
                {message}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-2.5 mt-4">
            <button
              onClick={onClose}
              className={cn(
                "flex-1 h-[40px] px-4",
                "border border-[#2a2d31] bg-[rgba(255,255,255,0.02)]",
                "text-[#d6d7da] hover:bg-[rgba(255,255,255,0.05)] hover:border-[#3a3d42]",
                "text-[10px] tracking-[0.22em] uppercase font-mono",
                "transition-all"
              )}
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={cn(
                "flex-1 h-[40px] px-4",
                colors.buttonBg,
                "text-[#0b0c0e]",
                "text-[10px] tracking-[0.22em] uppercase font-mono font-bold",
                colors.buttonHover,
                "transition-all"
              )}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

// Alert Modal (simpler version for notifications)
interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  variant?: "success" | "error" | "info";
}

export function AlertModal({
  isOpen,
  onClose,
  title,
  message,
  variant = "info",
}: AlertModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const variantColors = {
    success: {
      accent: "bg-[#10b981]",
      border: "border-[#10b981]",
      text: "text-[#10b981]",
      icon: "✓",
    },
    error: {
      accent: "bg-[#ff6a6a]",
      border: "border-[#ff6a6a]",
      text: "text-[#ff6a6a]",
      icon: "✕",
    },
    info: {
      accent: "bg-[#b9c7ff]",
      border: "border-[#b9c7ff]",
      text: "text-[#b9c7ff]",
      icon: "i",
    },
  };

  const colors = variantColors[variant];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-[400px] max-h-[85vh] overflow-y-auto border border-[#2a2d31] bg-[rgba(10,10,11,0.98)] backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.6)] my-auto"
        style={{ animation: "modalSlideIn 0.2s ease-out" }}
      >
        {/* Accent bar */}
        <div className={cn("absolute left-0 top-0 bottom-0 w-[3px]", colors.accent)} />

        {/* Content */}
        <div className="p-4 sm:p-5">
          {/* Icon and Title */}
          <div className="flex items-start gap-3 mb-3">
            <div
              className={cn(
                "flex-shrink-0 w-9 h-9 border grid place-items-center",
                colors.border,
                "bg-[rgba(255,255,255,0.02)]"
              )}
            >
              <span className={cn("text-[16px]", colors.text)}>{colors.icon}</span>
            </div>

            <div className="flex-1 min-w-0">
              <h3
                className={cn(
                  "text-[12px] tracking-[0.14em] uppercase font-bold mb-1.5 leading-tight",
                  colors.text
                )}
              >
                {title}
              </h3>
              <p className="text-[#b0b3b8] text-[11px] leading-relaxed">
                {message}
              </p>
            </div>
          </div>

          {/* Action */}
          <div className="flex justify-end mt-4">
            <button
              onClick={onClose}
              className={cn(
                "h-[38px] px-5",
                "border",
                colors.border,
                colors.text,
                "hover:bg-[rgba(255,255,255,0.05)]",
                "text-[10px] tracking-[0.22em] uppercase font-mono",
                "transition-all"
              )}
            >
              OK
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
