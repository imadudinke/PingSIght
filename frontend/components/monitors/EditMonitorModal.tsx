"use client";

import { useState, useEffect } from "react";
import { updateMonitorMonitorsMonitorIdPut } from "@/lib/api/sdk.gen";
import type { MonitorResponse, MonitorUpdate } from "@/lib/api/types.gen";

interface EditMonitorModalProps {
  isOpen: boolean;
  monitor: MonitorResponse | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditMonitorModal({ isOpen, monitor, onClose, onSuccess }: EditMonitorModalProps) {
  const [friendlyName, setFriendlyName] = useState("");
  const [intervalSeconds, setIntervalSeconds] = useState(60);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (monitor) {
      setFriendlyName(monitor.friendly_name);
      setIntervalSeconds(monitor.interval_seconds);
      setIsActive(monitor.is_active);
    }
  }, [monitor]);

  if (!isOpen || !monitor) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const updateData: MonitorUpdate = {
        friendly_name: friendlyName,
        interval_seconds: intervalSeconds,
        is_active: isActive,
      };

      const response = await updateMonitorMonitorsMonitorIdPut({
        path: { monitor_id: monitor.id },
        body: updateData
      });

      if (response.response.ok) {
        onSuccess();
        handleClose();
      } else {
        setError("Failed to update monitor");
      }
    } catch (err: any) {
      setError(err?.message || "An error occurred while updating the monitor");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0f1113] border border-[#1f2227] w-full max-w-xl">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#1f2227] flex items-center justify-between">
          <h2 className="text-[#d6d7da] text-[14px] tracking-[0.18em] uppercase font-mono">
            EDIT_MONITOR
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-[#ff6a6a]/10 border border-[#ff6a6a]/30 px-4 py-3 text-[#ff6a6a] text-xs font-mono">
              ERROR: {error}
            </div>
          )}

          {/* Monitor Type Info */}
          <div className="bg-[#f2d48a]/5 border border-[#f2d48a]/20 px-4 py-3">
            <p className="text-[#f2d48a] text-[9px] tracking-wider font-mono">
              TYPE: {monitor.monitor_type?.toUpperCase() || "SIMPLE"} | URL: {monitor.url}
            </p>
          </div>

          {/* Friendly Name */}
          <div>
            <label className="block text-[#6b6f76] text-[10px] tracking-[0.26em] uppercase mb-2 font-mono">
              FRIENDLY_NAME *
            </label>
            <input
              type="text"
              value={friendlyName}
              onChange={(e) => setFriendlyName(e.target.value)}
              required
              maxLength={50}
              className="w-full bg-[#0b0c0e] border border-[#1f2227] px-4 py-3 text-[#d6d7da] font-mono text-sm focus:outline-none focus:border-[#f2d48a] transition-colors"
              placeholder="My Production API"
            />
          </div>

          {/* Interval */}
          <div>
            <label className="block text-[#6b6f76] text-[10px] tracking-[0.26em] uppercase mb-2 font-mono">
              CHECK_INTERVAL (seconds) *
            </label>
            <input
              type="number"
              value={intervalSeconds}
              onChange={(e) => setIntervalSeconds(parseInt(e.target.value))}
              required
              min={monitor.monitor_type === "heartbeat" ? 60 : 30}
              max={3600}
              className="w-full bg-[#0b0c0e] border border-[#1f2227] px-4 py-3 text-[#d6d7da] font-mono text-sm focus:outline-none focus:border-[#f2d48a] transition-colors"
            />
            <p className="mt-1 text-[#6b6f76] text-[9px] tracking-wider font-mono">
              MIN: {monitor.monitor_type === "heartbeat" ? "60" : "30"}s | MAX: 3600s (1 hour)
            </p>
          </div>

          {/* Active Status */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 bg-[#0b0c0e] border border-[#1f2227] checked:bg-[#f2d48a] checked:border-[#f2d48a] focus:outline-none focus:ring-2 focus:ring-[#f2d48a]/50"
              />
              <span className="text-[#6b6f76] text-[10px] tracking-[0.26em] uppercase font-mono">
                MONITOR_ACTIVE
              </span>
            </label>
            <p className="mt-1 ml-7 text-[#6b6f76] text-[9px] tracking-wider font-mono">
              Inactive monitors are not checked
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 bg-[#0b0c0e] border border-[#1f2227] text-[#6b6f76] font-mono text-xs tracking-wider uppercase py-3 hover:border-[#2a2d31] hover:text-[#d6d7da] transition-all"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#f2d48a] text-[#0b0c0e] font-mono text-xs font-bold tracking-wider uppercase py-3 hover:bg-[#d6d7da] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "UPDATING..." : "UPDATE_MONITOR"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
