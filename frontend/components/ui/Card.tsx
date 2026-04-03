import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  borderColor?: string;
  glow?: boolean;
}

export default function Card({ children, className = '', borderColor, glow = false }: CardProps) {
  const glowStyle = glow ? 'shadow-[0_0_30px_rgba(165,185,255,0.15)]' : '';
  const borderStyle = borderColor ? `border-l-2` : '';
  
  return (
    <div 
      className={`bg-[#151922] border border-[#1f2937] ${borderStyle} ${glowStyle} ${className}`}
      style={borderColor ? { borderLeftColor: borderColor } : undefined}
    >
      {children}
    </div>
  );
}
