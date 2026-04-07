"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

interface EditStatusPageModalProps {
  statusPage: any;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditStatusPageModal({ statusPage, onClose, onSuccess }: EditStatusPageModalProps) {
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({
    name: statusPage.name || "",
    description: statusPage.description || "",
    is_public: statusPage.is_public ?? true,
    show_uptime: statusPage.show_uptime ?? true,
    show_incident_history: statusPage.show_incident_history ?? true,
    branding_primary_color: statusPage.branding_primary_color || "#10b981",
    branding_logo_url: statusPage.branding_logo_url || "",
    branding_custom_css: statusPage.branding_custom_css || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `http://localhost:8000/api/status-pages/${statusPage.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to update status page");
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0f1113] border border-[#2a2d31] shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 px-6 py-5 border-b border-[#15171a] bg-[#0f1113] flex items-center justify-between">
          <div className="text-[#d6d7da] text-[14px] tracking-[0.18em] uppercase">
            EDIT_STATUS_PAGE
          </div>
          <button
            onClick={onClose}
            className="text-[#6f6f6f] hover:text-[#d6d7da] transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="px-4 py-3 bg-[#ff6a6a]/10 border border-[#ff6a6a]/30 text-[#ff6a6a] text-[11px]">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-[#a9acb2] text-[10px] tracking-[0.26em] uppercase mb-2">
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full h-11 px-4 bg-[#0b0c0e] border border-[#2a2d31] text-[#d6d7da] text-[13px] focus:border-[#f2d48a] focus:outline-none transition"
              placeholder="My Service Status"
            />
          </div>

          {/* Slug (Read-only) */}
          <div>
            <label className="block text-[#a9acb2] text-[10px] tracking-[0.26em] uppercase mb-2">
              Slug (Cannot be changed)
            </label>
            <input
              type="text"
              value={statusPage.slug}
              disabled
              className="w-full h-11 px-4 bg-[#0b0c0e] border border-[#2a2d31] text-[#6f6f6f] text-[13px] font-mono cursor-not-allowed"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[#a9acb2] text-[10px] tracking-[0.26em] uppercase mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 bg-[#0b0c0e] border border-[#2a2d31] text-[#d6d7da] text-[13px] focus:border-[#f2d48a] focus:outline-none transition resize-none"
              placeholder="Real-time status and incident history for our services"
            />
          </div>

          {/* Logo URL */}
          <div>
            <label className="block text-[#a9acb2] text-[10px] tracking-[0.26em] uppercase mb-2">
              Logo URL (Optional)
            </label>
            <input
              type="url"
              value={formData.branding_logo_url}
              onChange={(e) => setFormData({ ...formData, branding_logo_url: e.target.value })}
              className="w-full h-11 px-4 bg-[#0b0c0e] border border-[#2a2d31] text-[#d6d7da] text-[13px] focus:border-[#f2d48a] focus:outline-none transition"
              placeholder="https://example.com/logo.png"
            />
            <div className="mt-1 text-[#6f6f6f] text-[10px]">
              External URL to your logo image
            </div>
          </div>

          {/* Primary Color */}
          <div>
            <label className="block text-[#a9acb2] text-[10px] tracking-[0.26em] uppercase mb-2">
              Primary Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={formData.branding_primary_color}
                onChange={(e) => setFormData({ ...formData, branding_primary_color: e.target.value })}
                className="h-11 w-20 bg-[#0b0c0e] border border-[#2a2d31] cursor-pointer"
              />
              <input
                type="text"
                value={formData.branding_primary_color}
                onChange={(e) => setFormData({ ...formData, branding_primary_color: e.target.value })}
                pattern="^#[0-9A-Fa-f]{6}$"
                className="flex-1 h-11 px-4 bg-[#0b0c0e] border border-[#2a2d31] text-[#d6d7da] text-[13px] font-mono focus:border-[#f2d48a] focus:outline-none transition"
                placeholder="#10b981"
              />
            </div>
          </div>

          {/* Custom CSS */}
          <div>
            <label className="block text-[#a9acb2] text-[10px] tracking-[0.26em] uppercase mb-2">
              Custom CSS (Advanced)
            </label>
            <textarea
              value={formData.branding_custom_css}
              onChange={(e) => setFormData({ ...formData, branding_custom_css: e.target.value })}
              rows={5}
              className="w-full px-4 py-3 bg-[#0b0c0e] border border-[#2a2d31] text-[#d6d7da] text-[12px] font-mono focus:border-[#f2d48a] focus:outline-none transition resize-none"
              placeholder=".status-page { background: #000; }"
            />
            <div className="mt-1 text-[#6f6f6f] text-[10px]">
              Custom CSS will be applied to the public status page
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_public}
                onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                className="w-4 h-4 bg-[#0b0c0e] border border-[#2a2d31] text-[#f2d48a] focus:ring-0 focus:ring-offset-0"
              />
              <span className="text-[#a9acb2] text-[11px] tracking-[0.22em] uppercase">
                Public (visible to everyone)
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.show_uptime}
                onChange={(e) => setFormData({ ...formData, show_uptime: e.target.checked })}
                className="w-4 h-4 bg-[#0b0c0e] border border-[#2a2d31] text-[#f2d48a] focus:ring-0 focus:ring-offset-0"
              />
              <span className="text-[#a9acb2] text-[11px] tracking-[0.22em] uppercase">
                Show Uptime Statistics
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.show_incident_history}
                onChange={(e) => setFormData({ ...formData, show_incident_history: e.target.checked })}
                className="w-4 h-4 bg-[#0b0c0e] border border-[#2a2d31] text-[#f2d48a] focus:ring-0 focus:ring-offset-0"
              />
              <span className="text-[#a9acb2] text-[11px] tracking-[0.22em] uppercase">
                Show Incident History
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 border border-[#2a2d31] bg-[rgba(255,255,255,0.02)] text-[#a9acb2] hover:text-[#d6d7da] hover:border-[#3a3d42] transition text-[10px] tracking-[0.26em] uppercase"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 h-11 bg-[#f2d48a] text-[#0b0c0e] font-mono text-[10px] font-bold tracking-wider uppercase hover:bg-[#d6d7da] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "SAVING..." : "SAVE_CHANGES"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
