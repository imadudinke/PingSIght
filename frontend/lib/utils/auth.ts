// Auth utilities for httpOnly cookie-based authentication
// The token is stored in an httpOnly cookie set by the backend
// and automatically sent with requests using credentials: 'include'

import { getCurrentUserInfoAuthMeGet } from '@/lib/api/sdk.gen';

export function logout() {
  // Call backend to clear the cookie
  fetch(
    `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/auth/logout`,
    {
      method: 'POST',
      credentials: 'include'
    }
  ).catch((error) => {
    // Backend might be offline, but we still want to logout on frontend
    console.warn('Logout request failed, but clearing frontend session:', error);
  }).finally(() => {
    // Always redirect to home page, even if backend call fails
    window.location.href = '/';
  });
}

export async function checkAuth(): Promise<boolean> {
  try {
    const response = await getCurrentUserInfoAuthMeGet();
    return response?.response?.ok || false;
  } catch {
    return false;
  }
}
