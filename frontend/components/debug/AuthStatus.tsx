"use client";

import { useAuth } from "@/contexts/AuthContext";
import { API_BASE_URL } from "@/lib/constants";

export function AuthStatus() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-[#1a1d21] border border-[#2a2d31] p-3 rounded text-xs font-mono z-50">
      <div className="text-[#f2d48a] mb-2">AUTH_DEBUG</div>
      <div className="space-y-1 text-[#6f6f6f]">
        <div>Loading: {isLoading ? 'YES' : 'NO'}</div>
        <div>Authenticated: {isAuthenticated ? 'YES' : 'NO'}</div>
        <div>User: {user ? user.email : 'NULL'}</div>
        <div>Admin: {user?.is_admin ? 'YES' : 'NO'}</div>
      </div>
      {!isAuthenticated && !isLoading && (
        <button 
          onClick={() => {
            window.location.href = `${API_BASE_URL}/auth/login`;
          }}
          className="mt-2 px-2 py-1 bg-[#f2d48a] text-[#0b0c0e] text-xs"
        >
          LOGIN
        </button>
      )}
    </div>
  );
}