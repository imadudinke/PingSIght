"use client";

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import SocialLoginButton from './SocialLoginButton';
import { AlertModal } from '@/components/ui/ConfirmModal';
import { getApiBaseUrl } from '@/lib/constants';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [loadingProvider, setLoadingProvider] = useState<'google' | 'github' | null>(null);
  const [showGithubAlert, setShowGithubAlert] = useState(false);

  // Reset loading state when modal opens/closes or when user returns to page
  useEffect(() => {
    if (isOpen) {
      // Reset loading state when modal opens
      setLoadingProvider(null);
    }
  }, [isOpen]);

  // Reset loading state when user returns to the page (e.g., after going back from OAuth)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setLoadingProvider(null);
      }
    };

    const handleFocus = () => {
      setLoadingProvider(null);
    };

    const handlePageShow = (event: PageTransitionEvent) => {
      // Reset loading state when page is shown from cache (back button)
      if (event.persisted) {
        setLoadingProvider(null);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, []);

  const handleSocialLogin = (provider: 'google' | 'github') => {
    // Set loading state
    setLoadingProvider(provider);
    
    // Redirect to backend OAuth endpoint
    // The backend will handle the OAuth flow and redirect back to /auth/callback
    if (provider === 'google') {
      window.location.href = `${getApiBaseUrl()}/auth/login`;
    } else if (provider === 'github') {
      // GitHub OAuth not yet implemented in backend
      setLoadingProvider(null);
      setShowGithubAlert(true);
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

      <AlertModal
        isOpen={showGithubAlert}
        onClose={() => setShowGithubAlert(false)}
        title="COMING_SOON"
        message="GitHub login will be available in a future update. Please use Google authentication for now."
        variant="info"
      />
    </Modal>
  );
}
