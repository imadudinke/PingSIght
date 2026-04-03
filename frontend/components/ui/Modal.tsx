import { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export default function Modal({ isOpen, onClose, children, title, subtitle }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] max-w-md w-full p-8 shadow-[0_0_30px_rgba(165,185,255,0.15)]">
        <div className="flex justify-between items-start mb-6">
          {(title || subtitle) && (
            <div>
              {title && (
                <h2 className="text-2xl font-bold text-[#e0e0e0] mb-2 font-mono tracking-wider">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="font-mono text-[10px] text-[#555] tracking-widest">
                  {subtitle}
                </p>
              )}
            </div>
          )}
          <button 
            onClick={onClose}
            className="text-[#888] hover:text-[#e0e0e0] transition-colors text-xl"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
