import { createContext, useCallback, useEffect, useState } from 'react';
import './App.css';

import Cashier from './components/Cashier';
import LoginCard from './components/auth/LoginCard';
import { ApiError, fetchCatalog } from './api/client';
import { TOKEN_STORAGE_KEY, readStoredToken, tokenUsername } from './api/session';

type AuthContextValue = {
  token: string | null;
  username: string | null;
  logout: () => void;
};

// Context is intentionally co-located with App; splitting it out is a larger refactor.
// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue>({
  token: null,
  username: null,
  logout: () => undefined,
});

function App() {
  const [token, setToken] = useState<string | null>(readStoredToken);
  const [categoryItems, setCategoryItems] = useState<CategoryItem[]>([]);
  const [catalogError, setCatalogError] = useState('');

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setCategoryItems([]);
    setCatalogError('');
  }, []);

  const authenticate = useCallback((nextToken: string) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, nextToken);
    setToken(nextToken);
  }, []);

  // Load the catalog whenever we have a token. Runs once per login rather than
  // once per render, and every state update happens in the promise callbacks.
  useEffect(() => {
    if (!token) {
      return;
    }

    let cancelled = false;

    fetchCatalog(token)
      .then((items) => {
        if (cancelled) return;
        setCategoryItems(items);
        setCatalogError('');
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        if (error instanceof ApiError && error.status === 401) {
          logout();
          return;
        }
        setCatalogError(error instanceof Error ? error.message : 'Failed to load the catalog.');
      });

    return () => {
      cancelled = true;
    };
  }, [token, logout]);

  return (
    <AuthContext.Provider value={{ token, username: tokenUsername(token), logout }}>
      {catalogError && <div className="appError">{catalogError}</div>}
      {token ? <Cashier categoryItems={categoryItems} /> : <LoginCard onAuthenticated={authenticate} />}
    </AuthContext.Provider>
  );
}

export default App;
