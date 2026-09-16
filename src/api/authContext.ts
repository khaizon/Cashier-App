/**
 * The auth context lives in its own module, not in ``App``.
 *
 * Components that need the session (the till, the record dialog) would otherwise
 * import from ``App``, which imports those same components back — a cycle whose
 * evaluation order ESM does not guarantee. A separate module keeps the graph a
 * one-way street.
 */

import { createContext } from 'react';

export type AuthContextValue = {
  token: string | null;
  username: string | null;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextValue>({
  token: null,
  username: null,
  logout: () => undefined,
});
