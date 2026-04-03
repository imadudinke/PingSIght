import { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export default function Input({ label, className = '', ...props }: InputProps) {
  return (
    <div>
      {label && (
        <label className="font-mono text-[10px] tracking-widest text-[#888] block mb-2">
          {label}
        </label>
      )}
      <input
        className={`w-full bg-[#0a0a0a] border border-[#2a2a2a] text-[#e0e0e0] font-mono text-sm p-3 focus:outline-none focus:border-[#a5b9ff] transition-colors ${className}`}
        {...props}
      />
    </div>
  );
}
