"use client";

import { useState, useRef, useEffect } from "react";
import { 
  enableMaintenanceMonitorsMonitorIdMaintenancePut,
  disableMaintenanceMonitorsMonitorIdMaintenanceDelete 
} from "@/lib/api/sdk.gen";
import type { MonitorResponse } from "@/lib/api/types.gen";

interface MonitorActionsMenuProps {
  monitor: MonitorResponse;
  onEdit: () => void;
  onDelete: () => void;
  onMaintenanceToggle: () => void;
}

export function MonitorActionsMenu({ 
  monitor, 
  onEdit, 
  onDelete, 
  onMaintenanceToggle 
}: MonitorActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current && 
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const handleMaintenanceToggle = async () => {
    setLoading(true);
    setIsOpen(false);

    try {
      if (monitor.is_maintenance) {
        await disableMaintenanceMonitorsMonitorIdMaintenanceDelete({
          path: { monitor_id: monitor.id }
        });
      } else {
        await enableMaintenanceMonitorsMonitorIdMaintenancePut({
          path: { monitor_id: monitor.id }
        });
      }
      onMaintenanceToggle();
    } catch (error) {
      console.error("Failed to toggle maintenance mode:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Menu Button */}
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        disabled={loading}
        className="h-10 w-10 grid place-items-center border border-[#2a2d31] bg-[rgba(255,255,255,0.02)] text-[#a9acb2] hover:text-[#d6d7da] hover:border-[#3a3d42] transition disabled:opacity-50"
        title="Actions"
      >
        <span className="text-[18px] leading-none">⋮</span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-1 w-56 bg-[#0f1113] border border-[#1f2227] shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Edit */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
              onEdit();
            }}
            className="w-full px-4 py-3 text-left text-[#d6d7da] hover:bg-[#15171a] transition-colors font-mono text-[10px] tracking-wider uppercase flex items-center gap-3 border-b border-[#1f2227]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            EDIT_MONITOR
          </button>

          {/* Maintenance Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleMaintenanceToggle();
            }}
            className={`w-full px-4 py-3 text-left hover:bg-[#15171a] transition-colors font-mono text-[10px] tracking-wider uppercase flex items-center gap-3 border-b border-[#1f2227] ${
              monitor.is_maintenance ? "text-[#f2d48a]" : "text-[#d6d7da]"
            }`}
          >
            {monitor.is_maintenance ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                RESUME_MONITORING
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                ENABLE_MAINTENANCE
              </>
            )}
          </button>

          {/* Delete */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
              onDelete();
            }}
            className="w-full px-4 py-3 text-left text-[#ff6a6a] hover:bg-[#ff6a6a]/10 transition-colors font-mono text-[10px] tracking-wider uppercase flex items-center gap-3"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            DELETE_MONITOR
          </button>
        </div>
      )}
    </div>
  );
}
