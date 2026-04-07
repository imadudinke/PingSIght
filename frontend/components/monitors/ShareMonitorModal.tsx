"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils/ui";

interface ShareMonitorModalProps {
  isOpen: boolean;
  monitorId: string;
  monitorName: string;
  onClose: () => void;
}

interface ShareSettings {
  expiresInHours: number | null;
  password: string;
}

export function ShareMonitorModal({ isOpen, monitorId, monitorName, onClose }: ShareMonitorModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [shareSettings, setShareSettings] = useState<ShareSettings>({
    expiresInHours: null,
    password: ""
  });
  const [shareInfo, setShareInfo] = useState<{
    expiresAt: string | null;
    hasPassword: boolean;
  }>({
    expiresAt: null,
    hasPassword: false
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setShareSettings({ expiresInHours: null, password: "" });
      setError(null);
      setCopied(false);
      setIsEditing(false);
      setShowPassword(false);
      setShowEditPassword(false);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    } else {
      // Restore body scroll when modal closes
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, monitorId]);

  const handleUpdateSettings = async () => {
    setLoading(true);
    setError(null);

    try {
      const requestBody: any = {};
      
      if (shareSettings.expiresInHours) {
        requestBody.expires_in_hours = shareSettings.expiresInHours;
      }
      
      if (shareSettings.password.trim()) {
        requestBody.password = shareSettings.password.trim();
      }

      const response = await fetch(`http://localhost:8000/monitors/${monitorId}/share`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to update settings");
      }

      const data = await response.json();
      setShareUrl(data.share_url);
      setIsPublic(true);
      setShareInfo({
        expiresAt: data.expires_at,
        hasPassword: data.has_password
      });
      setIsEditing(false);
      setShareSettings({ expiresInHours: null, password: "" });
    } catch (err: any) {
      setError(err.message || "Failed to update settings");
    } finally {
      setLoading(false);
    }
  };

  const handleEnableSharing = async () => {
    setLoading(true);
    setError(null);

    try {
      const requestBody: any = {};
      
      if (shareSettings.expiresInHours) {
        requestBody.expires_in_hours = shareSettings.expiresInHours;
      }
      
      if (shareSettings.password.trim()) {
        requestBody.password = shareSettings.password.trim();
      }

      const response = await fetch(`http://localhost:8000/monitors/${monitorId}/share`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to enable sharing");
      }

      const data = await response.json();
      setShareUrl(data.share_url);
      setIsPublic(true);
      setShareInfo({
        expiresAt: data.expires_at,
        hasPassword: data.has_password
      });
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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to disable sharing");
      }

      setShareUrl(null);
      setIsPublic(false);
      setShareInfo({ expiresAt: null, hasPassword: false });
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
    setShareSettings({ expiresInHours: null, password: "" });
    onClose();
  };

  const formatExpirationDate = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0f1113] border border-[#1f2227] w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#1f2227] flex items-center justify-between sticky top-0 bg-[#0f1113] z-10">
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
            <div className="space-y-6">
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

              {/* Expiration Settings */}
              <div className="space-y-3">
                <label className="block text-[#6b6f76] text-[10px] tracking-[0.26em] uppercase mb-2 font-mono">
                  EXPIRATION (OPTIONAL)
                </label>
                
                <select
                  value={shareSettings.expiresInHours || ""}
                  onChange={(e) => setShareSettings(prev => ({
                    ...prev,
                    expiresInHours: e.target.value ? parseInt(e.target.value) : null
                  }))}
                  className="w-full px-4 py-3 bg-[#0b0c0e] border border-[#1f2227] text-[#d6d7da] text-[11px] font-mono focus:border-[#f2d48a] focus:outline-none"
                >
                  <option value="">Never expires</option>
                  <option value="1">1 hour</option>
                  <option value="6">6 hours</option>
                  <option value="24">1 day</option>
                  <option value="168">1 week</option>
                  <option value="720">1 month</option>
                  <option value="8760">1 year</option>
                </select>
              </div>

              {/* Password Settings */}
              <div className="space-y-3">
                <label className="block text-[#6b6f76] text-[10px] tracking-[0.26em] uppercase mb-2 font-mono">
                  PASSWORD (OPTIONAL)
                </label>
                
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={shareSettings.password}
                    onChange={(e) => setShareSettings(prev => ({
                      ...prev,
                      password: e.target.value
                    }))}
                    placeholder="Enter password to protect share"
                    className="w-full px-4 py-3 pr-12 bg-[#0b0c0e] border border-[#1f2227] text-[#d6d7da] text-[11px] font-mono placeholder-[#6b6f76] focus:border-[#f2d48a] focus:outline-none"
                  />
                  
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b6f76] hover:text-[#d6d7da] transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                
                <p className="text-[#6b6f76] text-[9px] font-mono leading-relaxed">
                  If set, viewers will need to enter this password to access the monitor.
                </p>
              </div>

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

              {/* Share Details */}
              {(shareInfo.expiresAt || shareInfo.hasPassword) && (
                <div className="bg-[#0b0c0e] border border-[#1f2227] px-4 py-3 space-y-2">
                  {shareInfo.expiresAt && (
                    <div className="flex items-center gap-2 text-[#6b6f76] text-[10px] font-mono">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      EXPIRES: {formatExpirationDate(shareInfo.expiresAt)}
                    </div>
                  )}
                  {shareInfo.hasPassword && (
                    <div className="flex items-center gap-2 text-[#6b6f76] text-[10px] font-mono">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      PASSWORD_PROTECTED
                    </div>
                  )}
                </div>
              )}

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

              {/* Edit Settings Section */}
              {!isEditing ? (
                <div>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="w-full bg-[#0b0c0e] border border-[#1f2227] text-[#d6d7da] font-mono text-xs tracking-wider uppercase py-3 hover:border-[#f2d48a] hover:text-[#f2d48a] transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    EDIT_SETTINGS
                  </button>
                </div>
              ) : (
                <div className="space-y-4 bg-[#0b0c0e] border border-[#f2d48a]/30 p-4">
                  <div className="text-[#f2d48a] text-[11px] tracking-[0.20em] uppercase font-mono mb-3">
                    UPDATE_SHARE_SETTINGS
                  </div>

                  {/* Expiration Settings */}
                  <div className="space-y-3">
                    <label className="block text-[#6b6f76] text-[10px] tracking-[0.26em] uppercase mb-2 font-mono">
                      NEW_EXPIRATION
                    </label>
                    
                    <select
                      value={shareSettings.expiresInHours || ""}
                      onChange={(e) => setShareSettings(prev => ({
                        ...prev,
                        expiresInHours: e.target.value ? parseInt(e.target.value) : null
                      }))}
                      className="w-full px-4 py-3 bg-[#0f1113] border border-[#1f2227] text-[#d6d7da] text-[11px] font-mono focus:border-[#f2d48a] focus:outline-none"
                    >
                      <option value="">Keep current / Never expires</option>
                      <option value="1">1 hour</option>
                      <option value="6">6 hours</option>
                      <option value="24">1 day</option>
                      <option value="168">1 week</option>
                      <option value="720">1 month</option>
                      <option value="8760">1 year</option>
                    </select>
                  </div>

                  {/* Password Settings */}
                  <div className="space-y-3">
                    <label className="block text-[#6b6f76] text-[10px] tracking-[0.26em] uppercase mb-2 font-mono">
                      NEW_PASSWORD
                    </label>
                    
                    <div className="relative">
                      <input
                        type={showEditPassword ? "text" : "password"}
                        value={shareSettings.password}
                        onChange={(e) => setShareSettings(prev => ({
                          ...prev,
                          password: e.target.value
                        }))}
                        placeholder="Enter new password (leave empty to keep current)"
                        className="w-full px-4 py-3 pr-12 bg-[#0f1113] border border-[#1f2227] text-[#d6d7da] text-[11px] font-mono placeholder-[#6b6f76] focus:border-[#f2d48a] focus:outline-none"
                      />
                      
                      <button
                        type="button"
                        onClick={() => setShowEditPassword(!showEditPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b6f76] hover:text-[#d6d7da] transition-colors"
                        aria-label={showEditPassword ? "Hide password" : "Show password"}
                      >
                        {showEditPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    
                    <p className="text-[#6b6f76] text-[9px] font-mono leading-relaxed">
                      Leave empty to keep current password. Enter new password to update.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleUpdateSettings}
                      disabled={loading}
                      className="flex-1 bg-[#f2d48a] text-[#0b0c0e] font-mono text-xs font-bold tracking-wider uppercase py-3 hover:bg-[#d6d7da] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? "UPDATING..." : "UPDATE_SETTINGS"}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setShareSettings({ expiresInHours: null, password: "" });
                        setError(null);
                      }}
                      disabled={loading}
                      className="flex-1 bg-[#0b0c0e] border border-[#1f2227] text-[#6b6f76] font-mono text-xs tracking-wider uppercase py-3 hover:border-[#2a2d31] hover:text-[#d6d7da] transition-all disabled:opacity-50"
                    >
                      CANCEL
                    </button>
                  </div>
                </div>
              )}

              {/* Info */}
              <div className="text-[#6b6f76] text-[9px] font-mono leading-relaxed space-y-1">
                <p>• Share this link with anyone you want to give access to</p>
                <p>• Recipients don't need a PingSight account</p>
                <p>• They can only view, not edit or delete</p>
                {shareInfo.hasPassword && <p>• Recipients will need the password to access</p>}
                {shareInfo.expiresAt && <p>• Link will expire automatically at the specified time</p>}
                <p>• You can update settings or disable sharing at any time</p>
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

  // Use portal to render at document root level
  return createPortal(modalContent, document.body);
}
