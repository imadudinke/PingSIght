"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { client } from '@/lib/api/client.gen';
import { setAuthToken, getAuthToken, removeAuthToken, isTokenExpired } from '@/lib/utils/auth';

interface User {
  id: string;
  email: string;
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkTokenExpiry: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const logout = useCallback(() => {
    removeAuthToken();
    setUser(null);
    client.setConfig({
      baseUrl: API_URL,
      headers: {},
    });
    router.push('/');
  }, [router]);

  const checkTokenExpiry = useCallback(() => {
    if (isTokenExpired()) {
      console.log('Token expired, logging out...');
      logout();
    }
  }, [logout]);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      // Check if token is expired before making request
      if (isTokenExpired()) {
        console.log('Token expired during fetch');
        logout();
        return;
      }

      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        
        // Configure client with token
        client.setConfig({
          baseUrl: API_URL,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } else if (response.status === 401) {
        console.log('Unauthorized, logging out...');
        logout();
      } else {
        console.error('Failed to fetch user, status:', response.status);
        removeAuthToken();
        setUser(null);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      removeAuthToken();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    // Configure client base URL
    client.setConfig({
      baseUrl: API_URL,
    });

    // Check if user is already logged in
    const token = getAuthToken();
    if (token && !isTokenExpired()) {
      fetchCurrentUser();
    } else {
      if (token) {
        // Token exists but expired
        removeAuthToken();
      }
      setIsLoading(false);
    }
  }, [fetchCurrentUser]);

  // Set up interval to check token expiry every minute
  useEffect(() => {
    const interval = setInterval(() => {
      checkTokenExpiry();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [checkTokenExpiry]);

  // Check token expiry on visibility change (when user returns to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkTokenExpiry();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [checkTokenExpiry]);

  const login = async (username: string, password: string) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Login failed');
    }

    const data = await response.json();
    
    // Store token with 24 hour expiry
    setAuthToken(data.access_token, 1440);
    
    // Set auth header for all future requests
    client.setConfig({
      baseUrl: API_URL,
      headers: {
        Authorization: `Bearer ${data.access_token}`,
      },
    });

    await fetchCurrentUser();
  };

  const register = async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Registration failed');
    }

    return response.json();
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      isLoading, 
      login, 
      register, 
      logout,
      checkTokenExpiry
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
