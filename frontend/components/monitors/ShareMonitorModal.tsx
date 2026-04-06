"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils/ui";

interface ShareMonitorModalProps {
  isOpen: boolean;
  monitorId: string;
  monitorName: string;
  onClose: () => void;
}

export function ShareMonitorModal({ isOpen, monitorId, monitorName, onClose }: ShareMonitorModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Fetch current share status
      fetchShareStatus();
    }
  }, [isOpen, monitorId]);

  const fetchShareStatus = async () => {
    // For now, we'll enable sharing when modal opens
    // In a real app, you'd check if sharing is already enabled
  };

  const handleEnableSharing = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`http://localhost:8000/monitors/${monitorId}/share`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to enable sharing");
      }

      const data = await response.json();
      setShareUrl(data.share_url);
      setIsPublic(true);
    } catch (err: any) {
      setError(err.message || "Failed to enable sharing");
    } finally {
      setLoading(false);
    }
  };

  const handleDisableSharing = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`http://localhost:8000/monitors/${monitorId}/share`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to disable sharing");
      }

      setShareUrl(null);
      setIsPublic(false);
    } catch (err: any) {
      setError(err.message || "Failed to disable sharing");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyUrl = async () => {
    if (shareUrl) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    }
  };

  const handleClose = () => {
    setError(null);
    setCopied(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0f1113] border border-[#1f2227] w-full max-w-2xl">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#1f2227] flex items-center justify-between">
          <h2 className="text-[#d6d7da] text-[14px] tracking-[0.18em] uppercase font-mono">
            SHARE_MONITOR
          </h2>
          <button
            onClick={handleClose}
            className="text-[#6b6f76] hover:text-[#d6d7da] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-[#ff6a6a]/10 border border-[#ff6a6a]/30 px-4 py-3">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-[#ff6a6a] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <div className="text-[#ff6a6a] text-[10px] tracking-wider uppercase font-mono font-bold mb-1">
                    ERROR
                  </div>
                  <div className="text-[#ff6a6a] text-[10px] font-mono leading-relaxed">
                    {error}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Monitor Info */}
          <div className="bg-[#f2d48a]/5 border border-[#f2d48a]/20 px-4 py-3">
            <p className="text-[#f2d48a] text-[10px] tracking-wider font-mono leading-relaxed">
              MONITOR: {monitorName}
            </p>
          </div>

          {!isPublic && !shareUrl ? (
            /* Enable Sharing View */
            <div className="space-y-4">
              <div className="text-[#d6d7da] text-[11px] font-mono leading-relaxed">
                Share this monitor with others by generating a public link. Anyone with the link can view:
              </div>
              
              <ul className="space-y-2 text-[#6b6f76] text-[10px] font-mono leading-relaxed pl-4">
                <li>• Current status (UP/DOWN)</li>
                <li>• Uptime percentage</li>
                <li>• Response time metrics</li>
                <li>• Recent incident history</li>
                <li>• SSL certificate status</li>
              </ul>

              <div className="bg-[#ff6a6a]/5 border border-[#ff6a6a]/20 px-4 py-3">
                <p className="text-[#ff6a6a] text-[9px] tracking-wider font-mono leading-relaxed">
                  ⚠️ WARNING: Anyone with the link can view this monitor. Do not share sensitive information.
                </p>
              </div>

              <button
                onClick={handleEnableSharing}
                disabled={loading}
                className="w-full bg-[#f2d48a] text-[#0b0c0e] font-mono text-xs font-bold tracking-wider uppercase py-3 hover:bg-[#d6d7da] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "GENERATING_LINK..." : "ENABLE_PUBLIC_SHARING"}
              </button>
            </div>
          ) : (
            /* Share URL View */
            <div className="space-y-4">
              <div className="bg-[#f2d48a]/10 border border-[#f2d48a]/30 px-4 py-3">
                <div className="flex items-center gap-2 text-[#f2d48a] text-xs font-mono tracking-wider uppercase mb-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  PUBLIC_SHARING_ENABLED
                </div>
                <p className="text-[#d6d7da] text-[10px] font-mono leading-relaxed">
                  This monitor is now publicly accessible via the link below.
                </p>
              </div>

              {/* Share URL Display */}
              <div>
                <label className="block text-[#6b6f76] text-[10px] tracking-[0.26em] uppercase mb-3 font-mono">
                  PUBLIC_SHARE_LINK
                </label>
                
                <div className="flex items-center gap-3">
                  <code className="flex-1 px-4 py-3 bg-[#0b0c0e] border border-[#1f2227] text-[#f2d48a] text-[11px] font-mono break-all">
                    {shareUrl}
                  </code>
                  
                  <button
                    type="button"
                    onClick={handleCopyUrl}
                    className="px-4 py-3 bg-[#f2d48a] text-[#0b0c0e] font-mono text-[10px] font-bold tracking-wider uppercase hover:bg-[#d6d7da] transition-all flex items-center gap-2 whitespace-nowrap"
                  >
                    {copied ? (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        COPIED!
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        COPY
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="text-[#6b6f76] text-[9px] font-mono leading-relaxed space-y-1">
                <p>• Share this link with anyone you want to give access to</p>
                <p>• Recipients don't need a PingSight account</p>
                <p>• They can only view, not edit or delete</p>
                <p>• You can disable sharing at any time</p>
              </div>

              {/* Disable Button */}
              <button
                onClick={handleDisableSharing}
                disabled={loading}
                className="w-full bg-[#ff6a6a]/10 border border-[#ff6a6a]/30 text-[#ff6a6a] font-mono text-xs tracking-wider uppercase py-3 hover:bg-[#ff6a6a]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "DISABLING..." : "DISABLE_PUBLIC_SHARING"}
              </button>
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={handleClose}
            className="w-full bg-[#0b0c0e] border border-[#1f2227] text-[#6b6f76] font-mono text-xs tracking-wider uppercase py-3 hover:border-[#2a2d31] hover:text-[#d6d7da] transition-all"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}
