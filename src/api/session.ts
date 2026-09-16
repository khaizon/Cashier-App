/** Session helpers: read the username and expiry out of the stored JWT. */

import { jwtDecode } from 'jwt-decode';

export const TOKEN_STORAGE_KEY = 'cashier.token';

type TokenClaims = {
  sub?: string;
  exp?: number;
};

export function decodeToken(token: string): TokenClaims | null {
  try {
    return jwtDecode<TokenClaims>(token);
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const claims = decodeToken(token);
  if (!claims?.exp) {
    return true;
  }
  return claims.exp * 1000 <= Date.now();
}

export function readStoredToken(): string | null {
  const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (!stored || isTokenExpired(stored)) {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    return null;
  }
  return stored;
}

export function tokenUsername(token: string | null): string | null {
  return token ? (decodeToken(token)?.sub ?? null) : null;
}
