import { createContext, useCallback, useEffect, useState } from 'react';
import './App.css';

import Cashier from './components/Cashier';
import Cms from './components/cms/Cms';
import Sales from './components/sales/Sales';
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

/** The till, the catalog editor, or recorded sales. */
type View = 'cashier' | 'cms' | 'sales';

function App() {
  const [token, setToken] = useState<string | null>(readStoredToken);
  const [categoryItems, setCategoryItems] = useState<CategoryItem[]>([]);
  const [catalogError, setCatalogError] = useState('');
  const [view, setView] = useState<View>('cashier');
  // Bumped to force the catalog effect to re-run after CMS edits.
  const [catalogRevision, setCatalogRevision] = useState(0);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setCategoryItems([]);
    setCatalogError('');
    setView('cashier');
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
  }, [token, logout, catalogRevision]);

  /** Leaving the CMS: pick up whatever the editor just changed. */
  const showCashier = useCallback(() => {
    setView('cashier');
    setCatalogRevision((revision) => revision + 1);
  }, []);

  return (
    <AuthContext.Provider value={{ token, username: tokenUsername(token), logout }}>
      {catalogError && <div className="appError">{catalogError}</div>}
      {token ? (
        <div className="appShell">
          <nav className="appNav">
            <button type="button" className={view === 'cashier' ? 'appNavActive' : undefined} onClick={showCashier}>
              till
            </button>
            <button type="button" className={view === 'cms' ? 'appNavActive' : undefined} onClick={() => setView('cms')}>
              catalog cms
            </button>
            <button type="button" className={view === 'sales' ? 'appNavActive' : undefined} onClick={() => setView('sales')}>
              sales
            </button>
            <span className="appNavUser">{tokenUsername(token)}</span>
          </nav>
          {/* Takes the height left over by the nav. The till sizes itself from
              its parent, so giving the nav its own flow height used to push the
              reset/change row off the bottom of the viewport. */}
          <div className="appView">
            {view === 'cms' && <Cms token={token} onExit={showCashier} onUnauthorized={logout} />}
            {view === 'sales' && <Sales token={token} onUnauthorized={logout} />}
            {view === 'cashier' && <Cashier categoryItems={categoryItems} />}
          </div>
        </div>
      ) : (
        <LoginCard onAuthenticated={authenticate} />
      )}
    </AuthContext.Provider>
  );
}

export default App;
