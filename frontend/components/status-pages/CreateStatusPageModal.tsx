"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

interface CreateStatusPageModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateStatusPageModal({ onClose, onSuccess }: CreateStatusPageModalProps) {
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    is_public: true,
    show_uptime: true,
    show_incident_history: true,
    branding_primary_color: "#10b981",
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

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: generateSlug(name),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:8000/api/status-pages/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to create status page");
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
            CREATE_STATUS_PAGE
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
              onChange={(e) => handleNameChange(e.target.value)}
              required
              className="w-full h-11 px-4 bg-[#0b0c0e] border border-[#2a2d31] text-[#d6d7da] text-[13px] focus:border-[#f2d48a] focus:outline-none transition"
              placeholder="My Service Status"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-[#a9acb2] text-[10px] tracking-[0.26em] uppercase mb-2">
              Slug * (URL-friendly identifier)
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              required
              pattern="^[a-z0-9-]+$"
              className="w-full h-11 px-4 bg-[#0b0c0e] border border-[#2a2d31] text-[#d6d7da] text-[13px] font-mono focus:border-[#f2d48a] focus:outline-none transition"
              placeholder="my-service"
            />
            <div className="mt-1 text-[#6f6f6f] text-[10px]">
              Public URL: {window.location.origin}/status/{formData.slug || "your-slug"}
            </div>
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
              {loading ? "CREATING..." : "CREATE_STATUS_PAGE"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
