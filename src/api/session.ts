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
  if (!stored) return null;

  // An unreadable token is corruption, not a stale session: drop it. Only
  // *expiry* is tolerated, because the till has to keep selling offline.
  if (decodeToken(stored) === null) {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    return null;
  }
  return stored;
}

/**
 * Is the stored session still valid? Drives the "sign in to sync" prompt.
 *
 * Note the deliberate change in `readStoredToken`: it no longer discards an
 * expired token. The backend is hosted remotely, so dropping it on expiry meant
 * that after 12 hours — or one refresh past it — the till could not even open,
 * which defeats offline operation entirely. An offline till keeps ringing sales
 * (they are queued on the device regardless); syncing still needs a valid
 * session, and the server is what enforces that.
 */
export function storedTokenExpired(): boolean {
  const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
  return !stored || isTokenExpired(stored);
}

export function tokenUsername(token: string | null): string | null {
  return token ? (decodeToken(token)?.sub ?? null) : null;
}
