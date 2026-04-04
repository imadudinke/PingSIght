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
  ).finally(() => {
    // Redirect to home page
    window.location.href = '/';
  });
}

export async function checkAuth(): Promise<boolean> {
  try {
    const response = await getCurrentUserInfoAuthMeGet();
    return response.response.ok;
  } catch {
    return false;
  }
}
