"use client";

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password);
        await login(email, password);
      }
      onClose();
      setEmail('');
      setPassword('');
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <style dangerouslySetInnerHTML={{ __html: `
        .panel { background-color: #1a1a1a; border: 1px solid #2a2a2a; position: relative; }
        .glow { box-shadow: 0 0 30px rgba(165, 185, 255, 0.15); }
      `}} />
      <div className="panel max-w-md w-full p-8 glow">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-[#e0e0e0] mb-2 font-mono tracking-wider">
              {isLogin ? 'LOGIN' : 'REGISTER'}
            </h2>
            <p className="font-mono text-[10px] text-[#555] tracking-widest">
              {isLogin ? 'ACCESS_SYSTEM' : 'CREATE_ACCOUNT'}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-[#888] hover:text-[#e0e0e0] transition-colors text-xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="font-mono text-[10px] tracking-widest text-[#888] block mb-2">
              EMAIL
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-[#e0e0e0] font-mono text-sm p-3 focus:outline-none focus:border-[#a5b9ff] transition-colors"
              placeholder="user@domain.com"
              required
            />
          </div>

          <div>
            <label className="font-mono text-[10px] tracking-widest text-[#888] block mb-2">
              PASSWORD
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-[#e0e0e0] font-mono text-sm p-3 focus:outline-none focus:border-[#a5b9ff] transition-colors"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="bg-[#ff6b6b]/10 border border-[#ff6b6b] p-3 font-mono text-[10px] text-[#ff6b6b]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#a5b9ff] text-black font-mono text-xs font-bold py-3 tracking-widest hover:bg-[#b5c9ff] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'PROCESSING...' : isLogin ? 'LOGIN' : 'CREATE_ACCOUNT'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="font-mono text-[10px] text-[#888] hover:text-[#a5b9ff] transition-colors tracking-widest"
          >
            {isLogin ? 'NEED_ACCOUNT? REGISTER' : 'HAVE_ACCOUNT? LOGIN'}
          </button>
        </div>
      </div>
    </div>
  );
}
