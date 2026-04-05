"use client";

import { useState } from "react";
import { deleteMonitorMonitorsMonitorIdDelete } from "@/lib/api/sdk.gen";
import type { MonitorResponse } from "@/lib/api/types.gen";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  monitor: MonitorResponse | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeleteConfirmModal({ isOpen, monitor, onClose, onSuccess }: DeleteConfirmModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState("");

  if (!isOpen || !monitor) return null;

  const handleDelete = async () => {
    if (confirmText !== "DELETE") {
      setError('Please type "DELETE" to confirm');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await deleteMonitorMonitorsMonitorIdDelete({
        path: { monitor_id: monitor.id }
      });

      if (response.response.ok) {
        onSuccess();
        handleClose();
      } else {
        setError("Failed to delete monitor");
      }
    } catch (err: any) {
      setError(err?.message || "An error occurred while deleting the monitor");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setConfirmText("");
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0f1113] border border-[#ff6a6a]/50 w-full max-w-md">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#ff6a6a]/30 flex items-center justify-between bg-[#ff6a6a]/5">
          <h2 className="text-[#ff6a6a] text-[14px] tracking-[0.18em] uppercase font-mono">
            ⚠ DELETE_MONITOR
          </h2>
          <button
            onClick={handleClose}
            className="text-[#ff6a6a] hover:text-[#d6d7da] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-[#ff6a6a]/10 border border-[#ff6a6a]/30 px-4 py-3 text-[#ff6a6a] text-xs font-mono">
              ERROR: {error}
            </div>
          )}

          {/* Warning */}
          <div className="bg-[#ff6a6a]/10 border border-[#ff6a6a]/30 px-4 py-4 space-y-2">
            <p className="text-[#ff6a6a] text-[11px] tracking-wider font-mono font-bold">
              CRITICAL_WARNING
            </p>
            <p className="text-[#d6d7da] text-[10px] tracking-wider font-mono leading-relaxed">
              This action cannot be undone. This will permanently delete:
            </p>
            <ul className="text-[#d6d7da] text-[10px] tracking-wider font-mono leading-relaxed list-disc list-inside space-y-1 ml-2">
              <li>Monitor configuration</li>
              <li>All heartbeat history</li>
              <li>All statistics and metrics</li>
            </ul>
          </div>

          {/* Monitor Info */}
          <div className="bg-[#0b0c0e] border border-[#1f2227] px-4 py-3 space-y-1">
            <p className="text-[#6b6f76] text-[9px] tracking-wider uppercase font-mono">
              MONITOR_TO_DELETE:
            </p>
            <p className="text-[#d6d7da] text-[11px] tracking-wider font-mono">
              {monitor.friendly_name}
            </p>
            <p className="text-[#6b6f76] text-[9px] tracking-wider font-mono">
              {monitor.url}
            </p>
          </div>

          {/* Confirmation Input */}
          <div>
            <label className="block text-[#6b6f76] text-[10px] tracking-[0.26em] uppercase mb-2 font-mono">
              TYPE "DELETE" TO CONFIRM
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              className="w-full bg-[#0b0c0e] border border-[#1f2227] px-4 py-3 text-[#d6d7da] font-mono text-sm focus:outline-none focus:border-[#ff6a6a] transition-colors"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 bg-[#0b0c0e] border border-[#1f2227] text-[#6b6f76] font-mono text-xs tracking-wider uppercase py-3 hover:border-[#2a2d31] hover:text-[#d6d7da] transition-all"
            >
              CANCEL
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading || confirmText !== "DELETE"}
              className="flex-1 bg-[#ff6a6a] text-[#0b0c0e] font-mono text-xs font-bold tracking-wider uppercase py-3 hover:bg-[#ff4444] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "DELETING..." : "DELETE_PERMANENTLY"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
