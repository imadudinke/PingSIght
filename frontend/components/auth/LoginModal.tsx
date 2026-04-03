"use client";

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import SocialLoginButton from './SocialLoginButton';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [loadingProvider, setLoadingProvider] = useState<'google' | 'github' | null>(null);

  const handleSocialLogin = (provider: 'google' | 'github') => {
    // Set loading state
    setLoadingProvider(provider);
    
    // Redirect to backend OAuth endpoint
    // The backend will handle the OAuth flow and redirect back to /auth/callback
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    
    if (provider === 'google') {
      window.location.href = `${apiUrl}/auth/login`;
    } else if (provider === 'github') {
      // GitHub OAuth not yet implemented in backend
      setLoadingProvider(null);
      alert('GitHub login coming soon!');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="SIGN IN"
      subtitle="AUTHENTICATE_WITH_SOCIAL_PROVIDER"
    >
      <div className="space-y-4">
        <SocialLoginButton 
          provider="google" 
          onClick={() => handleSocialLogin('google')}
          isLoading={loadingProvider === 'google'}
        />
        
        <SocialLoginButton 
          provider="github" 
          onClick={() => handleSocialLogin('github')}
          isLoading={loadingProvider === 'github'}
        />

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#2a2a2a]"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-[#1a1a1a] px-4 text-[#555] font-mono tracking-widest">
              SECURE_OAUTH_AUTHENTICATION
            </span>
          </div>
        </div>

        <div className="text-center">
          <p className="text-[10px] text-[#555] font-mono tracking-wider leading-relaxed">
            By signing in, you agree to our Terms of Service and Privacy Policy.
            Your data is encrypted and secure.
          </p>
        </div>
      </div>
    </Modal>
  );
}
