"use client";

import { useState, FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
}

export default function LoginForm({ onSuccess, onSwitchToRegister }: LoginFormProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        type="email"
        label="EMAIL"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="user@domain.com"
        required
      />

      <Input
        type="password"
        label="PASSWORD"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
        required
      />

      {error && (
        <div className="bg-[#ff6b6b]/10 border border-[#ff6b6b] p-3 font-mono text-[10px] text-[#ff6b6b]">
          {error}
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        size="md"
        disabled={loading}
        className="w-full"
      >
        {loading ? 'PROCESSING...' : 'LOGIN'}
      </Button>

      {onSwitchToRegister && (
        <div className="text-center">
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="font-mono text-[10px] text-[#888] hover:text-[#a5b9ff] transition-colors tracking-widest"
          >
            NEED_ACCOUNT? REGISTER
          </button>
        </div>
      )}
    </form>
  );
}
