"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/ui";
import { AlertModal } from "@/components/ui/ConfirmModal";
import { API_BASE_URL } from "@/lib/constants";

interface ExportMonitorModalProps {
  monitorId: string;
  monitorName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ExportMonitorModal({
  monitorId,
  monitorName,
  isOpen,
  onClose,
}: ExportMonitorModalProps) {
  const [format, setFormat] = useState<"csv" | "json">("csv");
  const [days, setDays] = useState(30);
  const [isExporting, setIsExporting] = useState(false);
  const [errorAlert, setErrorAlert] = useState<string | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/export/monitors/${monitorId}?format=${format}&days=${days}`,
        {
          credentials: 'include', // Use cookies for authentication
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Export failed:", response.status, errorText);
        throw new Error(`Export failed: ${response.status} - ${errorText}`);
      }

      // Get filename from Content-Disposition header or generate one
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = `monitor_${monitorName}_${new Date().toISOString().split('T')[0]}.${format}`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      onClose();
    } catch (error) {
      console.error("Export error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      setErrorAlert(`Failed to export data: ${errorMessage}. Please check that you are logged in, the monitor exists, and your session hasn't expired.`);
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-[#0f1113] border border-[#2a2d31] shadow-2xl">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#2a2d31]">
          <div className="flex items-center justify-between">
            <div className="text-[#d6d7da] text-[14px] tracking-[0.18em] uppercase">
              EXPORT_DATA
            </div>
            <button
              onClick={onClose}
              className="text-[#6f6f6f] hover:text-[#d6d7da] transition"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <div className="mt-2 text-[#6f6f6f] text-[11px] tracking-[0.10em]">
            {monitorName}
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-6">
          {/* Format Selection */}
          <div>
            <label className="block text-[#5f636a] text-[10px] tracking-[0.26em] uppercase mb-3">
              EXPORT_FORMAT
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setFormat("csv")}
                className={cn(
                  "flex-1 h-12 px-4 border transition",
                  "text-[11px] tracking-[0.22em] uppercase",
                  format === "csv"
                    ? "border-[#f2d48a] bg-[#f2d48a]/10 text-[#f2d48a]"
                    : "border-[#2a2d31] bg-[rgba(255,255,255,0.02)] text-[#6f6f6f] hover:text-[#d6d7da] hover:border-[#3a3d42]"
                )}
              >
                <div className="flex flex-col items-center gap-1">
                  <span>CSV</span>
                  <span className="text-[9px] opacity-70">SPREADSHEET</span>
                </div>
              </button>
              <button
                onClick={() => setFormat("json")}
                className={cn(
                  "flex-1 h-12 px-4 border transition",
                  "text-[11px] tracking-[0.22em] uppercase",
                  format === "json"
                    ? "border-[#f2d48a] bg-[#f2d48a]/10 text-[#f2d48a]"
                    : "border-[#2a2d31] bg-[rgba(255,255,255,0.02)] text-[#6f6f6f] hover:text-[#d6d7da] hover:border-[#3a3d42]"
                )}
              >
                <div className="flex flex-col items-center gap-1">
                  <span>JSON</span>
                  <span className="text-[9px] opacity-70">STRUCTURED</span>
                </div>
              </button>
            </div>
          </div>

          {/* Date Range Selection */}
          <div>
            <label className="block text-[#5f636a] text-[10px] tracking-[0.26em] uppercase mb-3">
              TIME_RANGE
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[7, 30, 90].map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={cn(
                    "h-10 px-3 border transition",
                    "text-[11px] tracking-[0.22em] uppercase",
                    days === d
                      ? "border-[#f2d48a] bg-[#f2d48a]/10 text-[#f2d48a]"
                      : "border-[#2a2d31] bg-[rgba(255,255,255,0.02)] text-[#6f6f6f] hover:text-[#d6d7da] hover:border-[#3a3d42]"
                  )}
                >
                  {d}D
                </button>
              ))}
            </div>
          </div>

          {/* Export Info */}
          <div className="border border-[#2a2d31] bg-[rgba(255,255,255,0.02)] p-4">
            <div className="text-[#5f636a] text-[10px] tracking-[0.26em] uppercase mb-2">
              EXPORT_INCLUDES
            </div>
            <ul className="space-y-1 text-[#d6d7da] text-[11px]">
              <li className="flex items-center gap-2">
                <span className="text-[#f2d48a]">•</span>
                <span>Monitor configuration</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#f2d48a]">•</span>
                <span>Heartbeat history ({days} days)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#f2d48a]">•</span>
                <span>SSL & Domain information</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#f2d48a]">•</span>
                <span>Performance statistics</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-[#2a2d31] flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isExporting}
            className={cn(
              "h-10 px-6",
              "border border-[#2a2d31] bg-[rgba(255,255,255,0.02)]",
              "text-[#a9acb2] hover:text-[#d6d7da] hover:border-[#3a3d42]",
              "text-[11px] tracking-[0.26em] uppercase transition",
              isExporting && "opacity-50 cursor-not-allowed"
            )}
          >
            CANCEL
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className={cn(
              "h-10 px-6",
              "bg-[#f2d48a] text-[#0b0c0e]",
              "text-[11px] tracking-[0.26em] uppercase font-bold",
              "hover:bg-[#d6d7da] transition",
              isExporting && "opacity-50 cursor-not-allowed"
            )}
          >
            {isExporting ? "EXPORTING..." : "EXPORT"}
          </button>
        </div>
      </div>

      <AlertModal
        isOpen={!!errorAlert}
        onClose={() => setErrorAlert(null)}
        title="EXPORT_FAILED"
        message={errorAlert || ""}
        variant="error"
      />
    </div>
  );
}
