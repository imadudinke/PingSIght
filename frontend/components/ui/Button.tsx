import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
}

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const baseStyles =
    "font-mono font-bold tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary: "bg-[#a5b9ff] text-black hover:bg-[#b5c9ff]",
    secondary:
      "bg-transparent border border-[#333] text-[#e0e0e0] hover:border-[#a5b9ff] hover:text-[#a5b9ff]",
    danger:
      "bg-transparent border border-[#ff6b6b] text-[#ff6b6b] hover:bg-[#ff6b6b] hover:text-black",
    ghost: "bg-transparent text-[#888] hover:text-[#a5b9ff]",
  };

  const sizes = {
    sm: "text-[10px] px-4 py-2",
    md: "text-xs px-6 py-3",
    lg: "text-sm px-12 py-5",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
