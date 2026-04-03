import Cookies from 'js-cookie';

interface TokenData {
  token: string;
  expiresAt: string;
}

const TOKEN_KEY = 'access_token';
const TOKEN_EXPIRY_KEY = 'token_expiry';

export function setAuthToken(token: string, expiresInMinutes: number = 1440) {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);
  
  // Store token with 24 hour expiry (1 day)
  Cookies.set(TOKEN_KEY, token, { 
    expires: 1, // 1 day
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  });
  
  // Store expiry timestamp
  Cookies.set(TOKEN_EXPIRY_KEY, expiresAt.toISOString(), { 
    expires: 1,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  });
}

export function getAuthToken(): string | null {
  return Cookies.get(TOKEN_KEY) || null;
}

export function removeAuthToken() {
  Cookies.remove(TOKEN_KEY);
  Cookies.remove(TOKEN_EXPIRY_KEY);
}

export function isTokenExpired(): boolean {
  const token = getAuthToken();
  if (!token) return true;
  
  const expiryStr = Cookies.get(TOKEN_EXPIRY_KEY);
  if (!expiryStr) return true;
  
  const expiryDate = new Date(expiryStr);
  const now = new Date();
  
  return now >= expiryDate;
}

export function getTokenExpiryTime(): Date | null {
  const expiryStr = Cookies.get(TOKEN_EXPIRY_KEY);
  if (!expiryStr) return null;
  
  return new Date(expiryStr);
}
