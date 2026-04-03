"use client";

import { useState, FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export default function RegisterForm({ onSuccess, onSwitchToLogin }: RegisterFormProps) {
  const { register, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(email, password);
      await login(email, password);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Registration failed');
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
        {loading ? 'PROCESSING...' : 'CREATE_ACCOUNT'}
      </Button>

      {onSwitchToLogin && (
        <div className="text-center">
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="font-mono text-[10px] text-[#888] hover:text-[#a5b9ff] transition-colors tracking-widest"
          >
            HAVE_ACCOUNT? LOGIN
          </button>
        </div>
      )}
    </form>
  );
}
