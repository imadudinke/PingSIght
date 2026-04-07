"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { 
  enableMaintenanceMonitorsMonitorIdMaintenancePut,
  disableMaintenanceMonitorsMonitorIdMaintenanceDelete 
} from "@/lib/api/sdk.gen";
import type { MonitorResponse } from "@/lib/api/types.gen";

interface MonitorActionsMenuProps {
  monitor: MonitorResponse;
  onEdit: () => void;
  onDelete: () => void;
  onShare: () => void;
  onMaintenanceToggle: (updatedMonitor: MonitorResponse) => void;
}

export function MonitorActionsMenu({ 
  monitor, 
  onEdit, 
  onDelete,
  onShare,
  onMaintenanceToggle 
}: MonitorActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const dropdownHeight = 280; // Approximate height of dropdown
      
      // Calculate position relative to viewport
      let top = rect.bottom + 4;
      let left = rect.right - 224; // 224px = w-56
      
      // Adjust if dropdown would go below viewport
      if (top + dropdownHeight > viewportHeight) {
        top = rect.top - dropdownHeight - 4;
      }
      
      // Adjust if dropdown would go outside left edge
      if (left < 8) {
        left = 8;
      }
      
      // Adjust if dropdown would go outside right edge
      if (left + 224 > window.innerWidth - 8) {
        left = window.innerWidth - 224 - 8;
      }
      
      setDropdownPosition({ top, left });
    }
  }, [isOpen]);

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

    const handleScroll = () => {
      if (isOpen) {
        // Reposition dropdown on scroll
        if (buttonRef.current) {
          const rect = buttonRef.current.getBoundingClientRect();
          const viewportHeight = window.innerHeight;
          const dropdownHeight = 280;
          
          let top = rect.bottom + 4;
          let left = rect.right - 224;
          
          if (top + dropdownHeight > viewportHeight) {
            top = rect.top - dropdownHeight - 4;
          }
          
          if (left < 8) {
            left = 8;
          }
          
          if (left + 224 > window.innerWidth - 8) {
            left = window.innerWidth - 224 - 8;
          }
          
          setDropdownPosition({ top, left });
        }
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
      window.addEventListener("scroll", handleScroll, true); // Use capture to catch all scroll events
      window.addEventListener("resize", handleScroll);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleScroll);
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
      
      // Create updated monitor object
      const updatedMonitor = {
        ...monitor,
        is_maintenance: !monitor.is_maintenance
      };
      
      onMaintenanceToggle(updatedMonitor);
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
      {mounted && isOpen && createPortal(
        <div 
          ref={menuRef}
          className="fixed w-56 bg-[#0f1113] border border-[#1f2227] shadow-2xl z-[10000] opacity-0 scale-95 animate-in fade-in zoom-in-95 duration-150"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            animation: 'fadeInScale 150ms ease-out forwards'
          }}
        >
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

          {/* Share */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
              onShare();
            }}
            className="w-full px-4 py-3 text-left text-[#d6d7da] hover:bg-[#15171a] transition-colors font-mono text-[10px] tracking-wider uppercase flex items-center gap-3 border-b border-[#1f2227]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            SHARE_MONITOR
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
        </div>,
        document.body
      )}
      
      <style jsx>{`
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-4px);
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
