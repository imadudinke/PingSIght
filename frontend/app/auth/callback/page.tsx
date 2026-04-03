"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { setAuthToken } from '@/lib/utils/auth';

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('AUTHENTICATING...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the token from URL query parameters
        const token = searchParams.get('token');
        const error = searchParams.get('error');

        if (error) {
          console.error('OAuth error:', error);
          setStatus('error');
          setMessage('AUTHENTICATION_FAILED');
          
          // Wait a bit before redirecting
          setTimeout(() => {
            router.push('/?error=auth_failed');
          }, 2000);
          return;
        }

        if (token) {
          setMessage('VERIFYING_TOKEN...');
          
          // Store the token with 24 hour expiry
          setAuthToken(token, 1440);
          
          setStatus('success');
          setMessage('SUCCESS! REDIRECTING...');
          
          // Wait a bit before redirecting to show success state
          setTimeout(() => {
            router.push('/dashboard');
          }, 1000);
        } else {
          // No token received
          setStatus('error');
          setMessage('NO_TOKEN_RECEIVED');
          
          setTimeout(() => {
            router.push('/');
          }, 2000);
        }
      } catch (err) {
        console.error('Callback error:', err);
        setStatus('error');
        setMessage('UNEXPECTED_ERROR');
        
        setTimeout(() => {
          router.push('/');
        }, 2000);
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="text-center space-y-6 max-w-md px-6">
        {/* Animated Icon */}
        <div className="flex justify-center">
          {status === 'processing' && (
            <div className="w-16 h-16 border-4 border-[#a5b9ff] border-t-transparent rounded-full animate-spin"></div>
          )}
          {status === 'success' && (
            <div className="w-16 h-16 rounded-full bg-[#a5b9ff] flex items-center justify-center animate-pulse">
              <svg 
                className="w-8 h-8 text-[#0a0a0a]" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={3} 
                  d="M5 13l4 4L19 7" 
                />
              </svg>
            </div>
          )}
          {status === 'error' && (
            <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center animate-pulse">
              <svg 
                className="w-8 h-8 text-white" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={3} 
                  d="M6 18L18 6M6 6l12 12" 
                />
              </svg>
            </div>
          )}
        </div>

        {/* Status Message */}
        <div className={`font-mono tracking-widest animate-pulse ${
          status === 'success' ? 'text-[#a5b9ff]' : 
          status === 'error' ? 'text-red-500' : 
          'text-[#a5b9ff]'
        }`}>
          {message}
        </div>

        {/* Sub Message */}
        <div className="font-mono text-[10px] text-[#555] tracking-widest">
          {status === 'processing' && 'VERIFYING_CREDENTIALS'}
          {status === 'success' && 'LOADING_DASHBOARD'}
          {status === 'error' && 'REDIRECTING_TO_HOME'}
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1 bg-[#2a2a2a] rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-1000 ${
              status === 'success' ? 'bg-[#a5b9ff] w-full' : 
              status === 'error' ? 'bg-red-500 w-full' : 
              'bg-[#a5b9ff] w-2/3 animate-pulse'
            }`}
          ></div>
        </div>
      </div>
    </div>
  );
}
