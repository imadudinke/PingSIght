"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

type SidebarContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(true);
  return (
    <SidebarContext.Provider value={{ open, setOpen }}>
      <div className="flex min-h-screen w-full">{children}</div>
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = React.useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within SidebarProvider");
  return ctx;
}

export function Sidebar({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <aside
      className={cn(
        "shrink-0",
        // Default graphite base
        "bg-[rgba(10,10,11,0.35)] border-r border-[#1b1d20]",
        className
      )}
      {...props}
    />
  );
}

export function SidebarInset({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("min-w-0 flex-1", className)} {...props} />
  );
}

export function SidebarTrigger({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { open, setOpen } = useSidebar();
  return (
    <button
      type="button"
      aria-label="Toggle sidebar"
      onClick={() => setOpen(!open)}
      className={cn(
        "inline-flex items-center justify-center",
        "h-9 w-9 rounded-none",
        "border border-[#2a2d31] bg-[rgba(255,255,255,0.02)]",
        "text-[#6f6f6f] hover:text-[#d6d7da] hover:border-[#3a3d42] transition",
        className
      )}
      {...props}
    >
      {/* Minimal glyph-like icon */}
      <span className="text-[12px] leading-none">▤</span>
    </button>
  );
}

/* ----- Menu components ----- */

export function SidebarHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("shrink-0", className)} {...props} />;
}

export function SidebarContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex-1 min-h-0 overflow-auto", className)} {...props} />
  );
}

export function SidebarFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("shrink-0", className)} {...props} />;
}

export function SidebarMenu({
  className,
  ...props
}: React.HTMLAttributes<HTMLUListElement>) {
  return (
    <ul className={cn("flex flex-col", className)} {...props} />
  );
}

export function SidebarMenuItem({
  className,
  ...props
}: React.HTMLAttributes<HTMLLIElement>) {
  return <li className={cn(className)} {...props} />;
}

const sidebarMenuButtonVariants = cva(
  [
    "group w-full",
    "inline-flex items-center gap-3",
    "rounded-none",
    "focus:outline-none focus-visible:ring-0",
    "select-none",
  ].join(" "),
  {
    variants: {
      size: {
        default: "h-11 px-4",
      },
      variant: {
        default: "text-[#6f6f6f] hover:text-[#d6d7da] hover:bg-[rgba(255,255,255,0.03)]",
      },
      isActive: {
        true: "bg-[rgba(255,255,255,0.05)] text-[#d6d7da]",
        false: "",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "default",
    },
  }
);

export interface SidebarMenuButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof sidebarMenuButtonVariants> {
  asChild?: boolean;
  isActive?: boolean;
}

export function SidebarMenuButton({
  asChild,
  className,
  size,
  variant,
  isActive,
  ...props
}: SidebarMenuButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(
        sidebarMenuButtonVariants({ size, variant, isActive }),
        className
      )}
      {...props}
    />
  );
}