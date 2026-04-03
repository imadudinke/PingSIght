"use client";

import * as React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

function iconGlyph(icon: string) {
  switch (icon) {
    case "home":
      return "⌂";
    case "monitors":
      return "∿";
    case "heartbeats":
      return "♥";
    case "status":
      return "▤";
    case "team":
      return "◎";
    case "settings":
      return "⛭";
    case "docs":
      return "▣";
    case "help":
      return "?";
    default:
      return "•";
  }
}

export function AppSidebar() {
  const active = "HOME"; // replace later with pathname logic

  return (
    <Sidebar
      className="border-r border-[#1b1d20] bg-[rgba(10,10,11,0.35)] backdrop-blur-[2px]"
      style={{ width: 248 }}
    >
      <SidebarHeader className="px-6 pt-6 pb-5">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 border border-[#2a2d31] bg-[rgba(255,255,255,0.03)] grid place-items-center">
            <div className="h-4 w-4 bg-[#b9c7ff]" />
          </div>
          <div>
            <div className="text-[#d6d7da] text-[14px] tracking-[0.08em] font-mono">
              DRAFT_CORE
            </div>
            <div className="text-[#6f6f6f] text-[10px] tracking-[0.24em] mt-0.5 font-mono">
              TERMINAL-01
            </div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3">
        <SidebarMenu className="gap-1 font-mono">
          {[
            { label: "HOME", icon: "home" },
            { label: "MONITORS", icon: "monitors" },
            { label: "HEARTBEATS", icon: "heartbeats" },
            { label: "STATUS_PAGES", icon: "status" },
            { label: "TEAM", icon: "team" },
            { label: "SETTINGS", icon: "settings" },
          ].map((item) => {
            const isActive = active === item.label;
            return (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton
                  className={[
                    "h-[44px] rounded-none px-4",
                    "text-[11px] tracking-[0.24em] uppercase",
                    "transition-colors",
                    isActive
                      ? "bg-[rgba(255,255,255,0.05)] text-[#d6d7da]"
                      : "text-[#6f6f6f] hover:text-[#d6d7da]",
                  ].join(" ")}
                  isActive={isActive}
                >
                  {/* Figma-style left accent bar */}
                  <span
                    className={[
                      "mr-2 h-[26px] w-[2px] block",
                      isActive ? "bg-[#f2d48a]" : "bg-transparent",
                    ].join(" ")}
                  />
                  <span className="opacity-90">{iconGlyph(item.icon)}</span>
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}

          {/* NEW_SCAN */}
          <div className="pt-5">
            <button
              className={[
                "w-full h-[40px] rounded-none",
                "bg-[#b9c7ff] text-[#0b0c0e]",
                "text-[11px] tracking-[0.24em] uppercase font-mono",
                "border border-[#c8d2ff]",
                "hover:brightness-95 transition",
              ].join(" ")}
            >
              NEW_SCAN
            </button>
          </div>
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="px-3 pb-6 pt-8">
        <div className="border-t border-[#1b1d20] pt-4 font-mono">
          {[
            { label: "DOCS", icon: "docs" },
            { label: "HELP", icon: "help" },
          ].map((item) => (
            <SidebarMenu key={item.label} className="gap-1">
              <SidebarMenuItem>
                <SidebarMenuButton className="h-[36px] rounded-none px-4 text-[11px] tracking-[0.24em] uppercase text-[#6f6f6f] hover:text-[#d6d7da] transition">
                  <span className="opacity-80">{iconGlyph(item.icon)}</span>
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          ))}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}